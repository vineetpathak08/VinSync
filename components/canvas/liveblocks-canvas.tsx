"use client";

import type { DragEvent, ErrorInfo, ReactNode } from "react";
import { Component, useCallback, useMemo, useRef } from "react";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import { Cursors, useLiveblocksFlow } from "@liveblocks/react-flow";
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";

import { CanvasNodeRenderer } from "@/components/canvas/canvas-node";
import {
  SHAPE_DEFAULT_SIZES,
  SHAPE_DRAG_MIME,
  ShapePanel,
  type ShapeDragPayload,
} from "@/components/canvas/shape-panel";
import {
  CANVAS_NODE_TYPE,
  NODE_COLORS,
  type CanvasEdge,
  type CanvasNode,
  type CanvasNodeShape,
} from "@/types/canvas";

interface LiveblocksCanvasProps {
  roomId: string;
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

function SyncedReactFlowCanvasInner() {
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
  const idCounter = useRef(0);

  const nodeTypes = useMemo(
    () => ({
      [CANVAS_NODE_TYPE]: CanvasNodeRenderer,
    }),
    []
  );

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
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
    },
    [onNodesChange, reactFlow]
  );

  return (
    <div className="relative h-full w-full" onDragOver={handleDragOver} onDrop={handleDrop}>
      <ReactFlow<CanvasNode, CanvasEdge>
        className="ghost-canvas h-full w-full rounded-2xl border border-surface-border bg-base"
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        connectionMode={ConnectionMode.Loose}
        defaultEdgeOptions={{
          type: "smoothstep",
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "var(--text-primary)",
          },
          style: {
            stroke: "var(--text-primary)",
            strokeWidth: 1,
          },
        }}
        fitView
      >
        <MiniMap
          pannable
          zoomable
          maskColor="var(--bg-base)"
          nodeColor="var(--bg-elevated)"
          nodeStrokeColor="var(--border-subtle)"
          className="!border !border-surface-border !bg-surface"
        />
        <Background
          variant={BackgroundVariant.Dots}
          gap={72}
          size={2.5}
          color="var(--text-primary)"
        />
        <Cursors />
      </ReactFlow>
      <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
        <ShapePanel className="pointer-events-auto" />
      </div>
    </div>
  );
}

function SyncedReactFlowCanvas() {
  return (
    <ReactFlowProvider>
      <SyncedReactFlowCanvasInner />
    </ReactFlowProvider>
  );
}

export function LiveblocksCanvas({ roomId }: LiveblocksCanvasProps) {
  return (
    <div className="flex min-h-0 w-full flex-1">
      <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
        <RoomProvider
          id={roomId}
          initialPresence={{ cursor: null, isThinking: false }}
        >
          <CanvasErrorBoundary>
            <ClientSideSuspense fallback={<CanvasLoadingState />}>
              <SyncedReactFlowCanvas />
            </ClientSideSuspense>
          </CanvasErrorBoundary>
        </RoomProvider>
      </LiveblocksProvider>
    </div>
  );
}
