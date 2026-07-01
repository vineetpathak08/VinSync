"use client";

import type { ComponentType, DragEvent, ErrorInfo, ReactNode } from "react";
import {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Background,
  BackgroundVariant,
  type NodeProps,
  type EdgeProps,
  ConnectionMode,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import { Cursors, useLiveblocksFlow } from "@liveblocks/react-flow";
import {
  useUndo,
  useRedo,
  useCanUndo,
  useCanRedo,
  useMyPresence,
  useOthers,
} from "@liveblocks/react";
import useKeyboardShortcuts from "@/hooks/useKeyboardShortcuts";
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";
import { UserButton } from "@clerk/nextjs";

import {
  CanvasNodeRenderer,
  ShapeVisual,
} from "@/components/canvas/canvas-node";
import {
  SHAPE_DEFAULT_SIZES,
  SHAPE_DRAG_MIME,
  ShapePanel,
  type ShapeDragPayload,
} from "@/components/canvas/shape-panel";
import {
  CANVAS_NODE_TYPE,
  CANVAS_EDGE_TYPE,
  NODE_COLORS,
  type CanvasEdge,
  type CanvasNode,
  type CanvasNodeShape,
} from "@/types/canvas";
import { CanvasEdgeRenderer } from "@/components/canvas/canvas-edge";
import CANVAS_TEMPLATES, {
  instantiateCanvasTemplate,
} from "@/components/editor/starter-templates";
import { normalizeCanvasSnapshot } from "@/lib/canvas-storage";
import { useCanvasAutosave } from "@/hooks/use-canvas-autosave";

interface LiveblocksCanvasProps {
  roomId: string;
  initialTemplateId?: string | null;
}

interface CanvasErrorBoundaryProps {
  children: ReactNode;
}

interface CanvasErrorBoundaryState {
  hasError: boolean;
}

class CanvasErrorBoundary extends Component<
  CanvasErrorBoundaryProps,
  CanvasErrorBoundaryState
> {
  state: CanvasErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): CanvasErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Liveblocks canvas error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <CanvasConnectionError />;
    }

    return this.props.children;
  }
}

function CanvasConnectionError() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-base px-6 text-center">
      <div className="max-w-sm rounded-2xl border border-surface-border bg-surface px-5 py-4">
        <p className="text-sm font-medium text-copy-primary">
          Unable to connect to the collaborative canvas.
        </p>
        <p className="mt-2 text-sm text-copy-muted">
          Refresh the workspace or check that your project access is still
          active.
        </p>
      </div>
    </div>
  );
}

function CanvasLoadingState() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-base px-6 text-center">
      <div className="rounded-2xl border border-surface-border bg-surface px-5 py-4 text-sm text-copy-muted">
        Loading collaborative canvas...
      </div>
    </div>
  );
}

function SyncedReactFlowCanvasInner({
  projectId,
  initialTemplateId,
}: {
  projectId: string;
  initialTemplateId?: string | null;
}) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: {
        initial: [],
      },
      edges: {
        initial: [],
      },
    });
  const reactFlow = useReactFlow();
  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const idCounter = useRef(0);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const dragPayloadRef = useRef<ShapeDragPayload | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [myPresence, updateMyPresence] = useMyPresence();
  const others = useOthers();
  const lastPresenceUpdateRef = useRef<number>(0);
  const hasAppliedInitialZoomRef = useRef(false);
  const [hasCheckedSavedCanvas, setHasCheckedSavedCanvas] = useState(false);
  const [dragPreview, setDragPreview] = useState<null | {
    shape: CanvasNodeShape;
    size: { width: number; height: number };
    position: { x: number; y: number };
  }>(null);
  const { markSnapshotSaved } = useCanvasAutosave({
    projectId,
    nodes,
    edges,
    enabled: hasCheckedSavedCanvas,
  });

  const replaceCanvas = useCallback(
    (nextNodes: CanvasNode[], nextEdges: CanvasEdge[]) => {
      const removeEdgeOps = edgesRef.current.map((edge) => ({
        type: "remove" as const,
        id: edge.id,
      }));

      const removeNodeOps = nodesRef.current.map((node) => ({
        type: "remove" as const,
        id: node.id,
      }));

      if (removeEdgeOps.length > 0) {
        onEdgesChange(removeEdgeOps);
      }

      if (removeNodeOps.length > 0) {
        onNodesChange(removeNodeOps);
      }

      if (nextNodes.length > 0) {
        onNodesChange(
          nextNodes.map((item) => ({ type: "add" as const, item })),
        );
      }

      if (nextEdges.length > 0) {
        onEdgesChange(
          nextEdges.map((item) => ({ type: "add" as const, item })),
        );
      }

      window.setTimeout(() => {
        reactFlow?.fitView?.({ duration: 300 });
      }, 50);
    },
    [onEdgesChange, onNodesChange, reactFlow],
  );

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  useEffect(() => {
    if (hasCheckedSavedCanvas) {
      return;
    }

    if (nodesRef.current.length > 0 || edgesRef.current.length > 0) {
      setHasCheckedSavedCanvas(true);
      markSnapshotSaved({ nodes: nodesRef.current, edges: edgesRef.current });
      return;
    }

    let isCancelled = false;

    const loadSavedCanvas = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/canvas`);

        if (response.status === 404) {
          if (!isCancelled) {
            setHasCheckedSavedCanvas(true);
          }

          return;
        }

        if (!response.ok) {
          throw new Error(`Canvas load failed with status ${response.status}`);
        }

        const payload = (await response.json()) as { canvas?: unknown };
        const canvas = normalizeCanvasSnapshot(payload.canvas);

        if (!canvas) {
          throw new Error("Canvas load returned invalid data");
        }

        if (isCancelled) {
          return;
        }

        if (nodesRef.current.length > 0 || edgesRef.current.length > 0) {
          setHasCheckedSavedCanvas(true);
          markSnapshotSaved({ nodes: nodesRef.current, edges: edgesRef.current });
          return;
        }

        replaceCanvas(canvas.nodes, canvas.edges);
        markSnapshotSaved(canvas);
        setHasCheckedSavedCanvas(true);
      } catch (error) {
        if (!isCancelled) {
          console.error("Canvas load failed", error);
          setHasCheckedSavedCanvas(true);
        }
      }
    };

    void loadSavedCanvas();

    return () => {
      isCancelled = true;
    };
  }, [hasCheckedSavedCanvas, markSnapshotSaved, projectId, replaceCanvas]);

  const handleLabelChange = useCallback(
    (id: string, label: string) => {
      const targetNode = nodesRef.current.find((node) => node.id === id);

      if (!targetNode) {
        return;
      }

      const nextNode: CanvasNode = {
        ...targetNode,
        data: {
          ...targetNode.data,
          label,
        },
      };

      onNodesChange([{ type: "replace", id, item: nextNode }]);
    },
    [onNodesChange],
  );

  const handleColorChange = useCallback(
    (id: string, color: CanvasNode["data"]["color"]) => {
      const targetNode = nodesRef.current.find((node) => node.id === id);

      if (!targetNode) {
        return;
      }

      const nextNode: CanvasNode = {
        ...targetNode,
        data: {
          ...targetNode.data,
          color,
        },
      };

      onNodesChange([{ type: "replace", id, item: nextNode }]);
    },
    [onNodesChange],
  );

  const nodeTypes = useMemo(() => {
    const CanvasNodeWithLabel: ComponentType<NodeProps<CanvasNode>> = (
      props,
    ) => (
      <CanvasNodeRenderer
        {...props}
        onLabelChange={handleLabelChange}
        onColorChange={handleColorChange}
      />
    );

    return {
      [CANVAS_NODE_TYPE]: CanvasNodeWithLabel,
    };
  }, [handleLabelChange]);

  const handleEdgeLabelChange = useCallback(
    (id: string, label: string) => {
      const targetEdge = edgesRef.current.find((ed) => ed.id === id);
      if (!targetEdge) return;

      const nextEdge: CanvasEdge = {
        ...targetEdge,
        data: { ...(targetEdge.data ?? {}), label },
      };

      onEdgesChange([{ type: "replace", id, item: nextEdge }]);
    },
    [onEdgesChange],
  );

  const edgeTypes = useMemo(() => {
    const CanvasEdgeWithExtras: ComponentType<EdgeProps<CanvasEdge>> = (
      props,
    ) => (
      <CanvasEdgeRenderer
        {...(props as any)}
        allEdges={edgesRef.current}
        allNodes={nodesRef.current}
        onLabelChange={handleEdgeLabelChange}
      />
    );

    return { [CANVAS_EDGE_TYPE]: CanvasEdgeWithExtras };
  }, [handleEdgeLabelChange]);

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";

    const bounds = containerRef.current?.getBoundingClientRect();
    if (!bounds) {
      return;
    }

    let payload = dragPayloadRef.current;

    if (!payload) {
      const rawPayload = event.dataTransfer.getData(SHAPE_DRAG_MIME);
      if (!rawPayload) {
        setDragPreview(null);
        return;
      }

      try {
        payload = JSON.parse(rawPayload) as ShapeDragPayload;
      } catch {
        setDragPreview(null);
        return;
      }

      if (!payload) {
        setDragPreview(null);
        return;
      }

      dragPayloadRef.current = payload;
    }

    const fallbackSize = SHAPE_DEFAULT_SIZES[payload.shape];
    if (!fallbackSize) {
      setDragPreview(null);
      return;
    }

    const size = payload.size ?? fallbackSize;
    const position = {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };

    setDragPreview({ shape: payload.shape, size, position });
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    const relatedTarget = event.relatedTarget as Node | null;

    if (relatedTarget && containerRef.current?.contains(relatedTarget)) {
      return;
    }

    setDragPreview(null);
    dragPayloadRef.current = null;
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const rawPayload = event.dataTransfer.getData(SHAPE_DRAG_MIME);
      if (!rawPayload) {
        return;
      }

      let payload: ShapeDragPayload | null = null;

      try {
        payload = JSON.parse(rawPayload) as ShapeDragPayload;
      } catch {
        return;
      }

      if (!payload) {
        return;
      }

      const shape = payload.shape as CanvasNodeShape;
      const fallbackSize = SHAPE_DEFAULT_SIZES[shape];

      if (!fallbackSize) {
        return;
      }

      const size = payload.size ?? fallbackSize;
      const position = reactFlow.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const nodeId = `${shape}-${Date.now()}-${idCounter.current}`;

      idCounter.current += 1;

      const newNode: CanvasNode = {
        id: nodeId,
        type: CANVAS_NODE_TYPE,
        position,
        data: {
          label: "",
          color: NODE_COLORS[0],
          shape,
        },
        style: {
          width: size.width,
          height: size.height,
        },
      };

      onNodesChange([{ type: "add", item: newNode }]);
      setDragPreview(null);
      dragPayloadRef.current = null;
    },
    [onNodesChange, reactFlow],
  );

  useEffect(() => {
    const clearPreview = () => {
      setDragPreview(null);
      dragPayloadRef.current = null;
    };

    window.addEventListener("dragend", clearPreview);
    window.addEventListener("drop", clearPreview);

    return () => {
      window.removeEventListener("dragend", clearPreview);
      window.removeEventListener("drop", clearPreview);
    };
  }, []);

  useEffect(() => {
    const onLabelUpdate = (e: Event) => {
      // event detail: { id, label }
      const detail = (e as CustomEvent).detail as
        | { id: string; label: string }
        | undefined;
      if (!detail) return;
      const target = edgesRef.current.find((ed) => ed.id === detail.id);
      if (!target) return;

      const nextEdge: CanvasEdge = {
        ...target,
        data: { ...(target.data ?? {}), label: detail.label },
      };

      onEdgesChange([{ type: "replace", id: detail.id, item: nextEdge }]);
    };

    window.addEventListener(
      "vinsync:edge-label-update",
      onLabelUpdate as EventListener,
    );
    return () =>
      window.removeEventListener(
        "vinsync:edge-label-update",
        onLabelUpdate as EventListener,
      );
  }, [onEdgesChange]);

  useEffect(() => {
    const onReplace = (e: Event) => {
      const detail = (e as CustomEvent).detail as
        | { nodes?: CanvasNode[]; edges?: CanvasEdge[] }
        | undefined;

      if (!detail) return;

      replaceCanvas(detail.nodes ?? [], detail.edges ?? []);
    };

    window.addEventListener(
      "vinsync:replace-canvas",
      onReplace as EventListener,
    );
    return () =>
      window.removeEventListener(
        "vinsync:replace-canvas",
        onReplace as EventListener,
      );
  }, [replaceCanvas]);

  useEffect(() => {
    if (
      !hasCheckedSavedCanvas ||
      !initialTemplateId ||
      nodesRef.current.length > 0 ||
      edgesRef.current.length > 0
    ) {
      return;
    }

    const template = CANVAS_TEMPLATES.find(
      (item) => item.id === initialTemplateId,
    );
    if (!template) {
      return;
    }

    const seed = `${template.id}-${Date.now()}`;
    const imported = instantiateCanvasTemplate(template, seed);
    replaceCanvas(imported.nodes, imported.edges);
  }, [hasCheckedSavedCanvas, initialTemplateId, replaceCanvas]);

  // Keyboard shortcuts (zoom + undo/redo)
  // Hook lives in hooks/useKeyboardShortcuts and ignores typing targets.
  // Pass the React Flow instance and Liveblocks undo/redo handlers.
  useKeyboardShortcuts(reactFlow, undo, redo);

  useEffect(() => {
    if (hasAppliedInitialZoomRef.current || !reactFlow) {
      return;
    }

    hasAppliedInitialZoomRef.current = true;

    window.setTimeout(() => {
      reactFlow.zoomOut({ duration: 0 });
      reactFlow.zoomOut({ duration: 0 });
      reactFlow.zoomOut({ duration: 0 });
    }, 0);
  }, [reactFlow]);

  return (
    <div
      className="relative h-full w-full"
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onMouseMove={(e) => {
        const bounds = containerRef.current?.getBoundingClientRect();
        if (!bounds) return;

        const x = e.clientX - bounds.left;
        const y = e.clientY - bounds.top;

        const now = Date.now();
        // throttle presence updates to ~20fps
        if (now - lastPresenceUpdateRef.current < 50) return;
        lastPresenceUpdateRef.current = now;

        try {
          updateMyPresence({ cursor: { x, y } });
        } catch {
          // ignore
        }
      }}
      onMouseLeave={() => {
        try {
          updateMyPresence({ cursor: null });
        } catch {
          // ignore
        }
      }}
    >
      <ReactFlow<CanvasNode, CanvasEdge>
        className="ghost-canvas h-full w-full rounded-2xl border border-surface-border bg-base"
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        connectionMode={ConnectionMode.Loose}
        defaultEdgeOptions={{ type: CANVAS_EDGE_TYPE }}
        fitViewOptions={{ padding: 1 }}
        fitView
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={72}
          size={2.5}
          color="var(--text-primary)"
        />
        <Cursors />
      </ReactFlow>
      {/* Presence avatars + current user (top-right) */}
      <div className="pointer-events-none absolute top-4 right-4 z-40">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-surface/80 px-2 py-1 border border-surface-border shadow-sm">
          {/* collaborator avatars */}
          {others && others.length > 0 ? (
            <div className="flex items-center -space-x-2">
              {others.slice(0, 5).map((other) => {
                const info: any = (other as any).info ?? {};
                const name = info?.user?.name ?? info?.name ?? "Anonymous";
                const avatar = info?.user?.avatar ?? info?.avatar ?? null;

                const initials = name
                  .split(" ")
                  .map((s: string) => s[0])
                  .slice(0, 2)
                  .join("");

                return avatar ? (
                  <img
                    key={other.connectionId}
                    src={avatar}
                    alt={name}
                    className="h-8 w-8 rounded-full ring-2 ring-base/80 border border-surface-border"
                  />
                ) : (
                  <div
                    key={other.connectionId}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-xs font-semibold text-copy-primary ring-2 ring-base/80 border border-surface-border"
                  >
                    {initials}
                  </div>
                );
              })}

              {others.length > 5 ? (
                <div className="ml-2 rounded-full bg-surface px-2 py-1 text-xs text-copy-muted">
                  +{others.length - 5}
                </div>
              ) : null}
            </div>
          ) : null}

          {/* divider only when collaborators exist */}
          {others && others.length > 0 ? (
            <div className="mx-2 h-6 w-px bg-surface-border" />
          ) : null}

          {/* current user */}
          <div className="flex items-center">
            <UserButton />
          </div>
        </div>
      </div>
      {/* Live cursor overlays for other participants */}
      <div className="pointer-events-none absolute inset-0 z-30">
        {others &&
          others
            .map((other) => ({
              connId: other.connectionId,
              presence: (other as any).presence,
              info: (other as any).info,
            }))
            .filter((o) => o.presence && o.presence.cursor)
            .map((o) => {
              const cursor = o.presence.cursor as {
                x: number;
                y: number;
              } | null;
              if (!cursor) return null;

              const info = o.info ?? {};
              const userInfo = info.user ?? info;
              const name = userInfo?.name ?? info?.name ?? "Anonymous";
              const color = userInfo?.color ?? info?.color ?? "#52A8FF";

              return (
                <div
                  key={o.connId}
                  className="transition-transform duration-75 ease-out"
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    transform: `translate(${cursor.x}px, ${cursor.y}px) translate(-50%, -50%)`,
                    pointerEvents: "none",
                    willChange: "transform",
                  }}
                >
                  <div className="flex flex-col items-center">
                    <div
                      style={{ backgroundColor: color }}
                      className="h-2 w-2 rounded-full"
                    />
                    <div
                      style={{ borderColor: color }}
                      className="mt-2 rounded-md border bg-surface/90 px-2 py-0.5 text-xs text-copy-primary"
                    >
                      {name}
                    </div>
                  </div>
                </div>
              );
            })}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
        <ShapePanel className="pointer-events-auto" />
      </div>

      {/* Floating control bar: zoom + undo/redo (bottom-left) */}
      <div className="pointer-events-auto absolute left-6 bottom-6 z-30">
        <div className="flex items-center gap-2 rounded-full bg-surface px-2 py-1 border border-surface-border shadow-sm">
          <div className="flex items-center space-x-1">
            <button
              type="button"
              aria-label="Zoom out"
              onClick={() => reactFlow?.zoomOut?.({ duration: 200 })}
              className="rounded-full p-2 hover:bg-surface-pressed"
            >
              −
            </button>
            <button
              type="button"
              aria-label="Fit view"
              onClick={() => reactFlow?.fitView?.({ duration: 200 })}
              className="rounded-full p-2 hover:bg-surface-pressed"
            >
              ⤢
            </button>
            <button
              type="button"
              aria-label="Zoom in"
              onClick={() => reactFlow?.zoomIn?.({ duration: 200 })}
              className="rounded-full p-2 hover:bg-surface-pressed"
            >
              +
            </button>
          </div>

          <div className="mx-2 h-5 w-px bg-surface-border" />

          <div className="flex items-center space-x-1">
            <button
              type="button"
              aria-label="Undo"
              onClick={() => undo()}
              disabled={!canUndo}
              className={`rounded-full p-2 hover:bg-surface-pressed ${!canUndo ? "opacity-40" : ""}`}
            >
              ⤺
            </button>
            <button
              type="button"
              aria-label="Redo"
              onClick={() => redo()}
              disabled={!canRedo}
              className={`rounded-full p-2 hover:bg-surface-pressed ${!canRedo ? "opacity-40" : ""}`}
            >
              ⤻
            </button>
          </div>
        </div>
      </div>
      {dragPreview ? (
        <div
          className="pointer-events-none absolute left-0 top-0 z-20"
          style={{
            width: dragPreview.size.width,
            height: dragPreview.size.height,
            transform: `translate(${dragPreview.position.x}px, ${dragPreview.position.y}px) translate(-50%, -50%)`,
          }}
        >
          <div className="relative h-full w-full opacity-60">
            <ShapeVisual
              shape={dragPreview.shape}
              fill={NODE_COLORS[0].fill}
              borderColor="var(--border-subtle)"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SyncedReactFlowCanvas() {
  return (
    <ReactFlowProvider>
      <SyncedReactFlowCanvasInner projectId="" />
    </ReactFlowProvider>
  );
}

export function LiveblocksCanvas({
  roomId,
  initialTemplateId,
}: LiveblocksCanvasProps) {
  return (
    <div className="flex min-h-0 w-full flex-1">
      <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
        <RoomProvider
          id={roomId}
          initialPresence={{ cursor: null, thinking: false }}
        >
          <CanvasErrorBoundary>
            <ClientSideSuspense fallback={<CanvasLoadingState />}>
              <ReactFlowProvider>
                <SyncedReactFlowCanvasInner
                  projectId={roomId}
                  initialTemplateId={initialTemplateId}
                />
              </ReactFlowProvider>
            </ClientSideSuspense>
          </CanvasErrorBoundary>
        </RoomProvider>
      </LiveblocksProvider>
    </div>
  );
}
