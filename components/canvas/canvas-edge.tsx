"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type EdgeProps,
  getSmoothStepPath,
  Position,
  ViewportPortal,
} from "@xyflow/react";

import type { CanvasEdge } from "@/types/canvas";
import type { CanvasNode } from "@/types/canvas";

interface CanvasEdgeRendererProps extends EdgeProps<CanvasEdge> {
  onLabelChange: (id: string, label: string) => void;
  allEdges: CanvasEdge[];
  allNodes: CanvasNode[];
}

function getPositionVector(position?: Position | null) {
  switch (position) {
    case Position.Left:
      return { x: -1, y: 0 };
    case Position.Right:
      return { x: 1, y: 0 };
    case Position.Top:
      return { x: 0, y: -1 };
    case Position.Bottom:
      return { x: 0, y: 1 };
    default:
      return { x: 1, y: 0 };
  }
}

function getSelfLoopPath({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  radius,
}: {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition?: Position | null;
  targetPosition?: Position | null;
  radius: number;
}) {
  const sourceVector = getPositionVector(sourcePosition);
  const targetVector = getPositionVector(targetPosition ?? sourcePosition);
  const horizontalBias =
    sourceVector.x !== 0 ? sourceVector.x : targetVector.x || 1;
  const verticalBias =
    sourceVector.y !== 0 ? sourceVector.y : targetVector.y || -1;

  const loopRadiusX = radius * 1.25;
  const loopRadiusY = radius * 0.95;
  const sweepFlag = horizontalBias > 0 || verticalBias > 0 ? 1 : 0;

  // If source and target coordinates are identical (exact self-edge anchor),
  // create a loop that starts and ends at different points around the node
  if (sourceX === targetX && sourceY === targetY) {
    const startX = sourceX + horizontalBias * loopRadiusX * 0.6;
    const startY = sourceY + verticalBias * loopRadiusY * 0.6;
    const endX = sourceX - horizontalBias * loopRadiusX * 0.6;
    const endY = sourceY - verticalBias * loopRadiusY * 0.6;

    const path = `M ${startX} ${startY} A ${loopRadiusX} ${loopRadiusY} 0 1 ${sweepFlag} ${endX} ${endY}`;
    const labelX = sourceX + horizontalBias * loopRadiusX * 0.18;
    const labelY = sourceY + verticalBias * loopRadiusY * 0.55;

    return [path, labelX, labelY] as const;
  }

  const path = `M ${sourceX} ${sourceY} A ${loopRadiusX} ${loopRadiusY} 0 1 ${sweepFlag} ${targetX} ${targetY}`;
  const labelX = (sourceX + targetX) / 2 + horizontalBias * loopRadiusX * 0.18;
  const labelY = (sourceY + targetY) / 2 + verticalBias * loopRadiusY * 0.55;

  return [path, labelX, labelY] as const;
}

export function CanvasEdgeRenderer({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  style,
  data,
  allEdges,
  allNodes,
  onLabelChange,
}: CanvasEdgeRendererProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(data?.label ?? "");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const markerId = `canvas-edge-arrow-${id}`;

  const routeMetrics = useMemo(() => {
    const pairKey = [source, target].sort().join("::");
    const siblingEdges = allEdges
      .filter(
        (edge) => [edge.source, edge.target].sort().join("::") === pairKey,
      )
      .sort((left, right) => left.id.localeCompare(right.id));

    const laneIndex = Math.max(
      0,
      siblingEdges.findIndex((edge) => edge.id === id),
    );
    const laneCount = Math.max(1, siblingEdges.length);
    const laneOffset = laneIndex - (laneCount - 1) / 2;

    return {
      offset: 22 + laneOffset * 12,
      stepPosition: Math.min(0.8, Math.max(0.2, 0.5 + laneOffset * 0.11)),
      borderRadius: 18,
      laneOffset,
    };
  }, [allEdges, id, source, target]);

  const [path, labelX, labelY] = useMemo(() => {
    const isSelfConnection = source === target;

    if (isSelfConnection) {
      // prefer reading node size to compute a loop radius that stays outside the node
      const sourceNode = allNodes?.find((n) => n?.id === source);
      const nodeWidth =
        (sourceNode?.style as { width?: number } | undefined)?.width ?? 120;
      const nodeHeight =
        (sourceNode?.style as { height?: number } | undefined)?.height ?? 80;
      const minRadius = Math.hypot(nodeWidth, nodeHeight) / 2 + 12;

      return getSelfLoopPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
        radius: Math.max(42, routeMetrics.offset + 18, minRadius),
      });
    }

    const excludes = new Set([source, target]);

    const segmentIntersectsRect = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      rx: number,
      ry: number,
      rw: number,
      rh: number,
    ) => {
      const minX = rx;
      const maxX = rx + rw;
      const minY = ry;
      const maxY = ry + rh;

      const dx = x2 - x1;
      const dy = y2 - y1;

      let t0 = 0;
      let t1 = 1;

      const p = [-dx, dx, -dy, dy];
      const q = [x1 - minX, maxX - x1, y1 - minY, maxY - y1];

      for (let i = 0; i < 4; i++) {
        const pi = p[i];
        const qi = q[i];
        if (pi === 0) {
          if (qi < 0) return false;
        } else {
          const t = qi / pi;
          if (pi < 0) {
            if (t > t1) return false;
            if (t > t0) t0 = t;
          } else {
            if (t < t0) return false;
            if (t < t1) t1 = t;
          }
        }
      }

      return t1 >= t0;
    };

    let collides = false;

    try {
      for (const node of allNodes ?? []) {
        if (!node?.id || excludes.has(node.id)) continue;

        const nodeX = node.position?.x ?? 0;
        const nodeY = node.position?.y ?? 0;
        const width =
          (node.style as { width?: number } | undefined)?.width ?? 120;
        const height =
          (node.style as { height?: number } | undefined)?.height ?? 80;

        const padding = 8;
        if (
          segmentIntersectsRect(
            sourceX,
            sourceY,
            targetX,
            targetY,
            nodeX - padding,
            nodeY - padding,
            width + padding * 2,
            height + padding * 2,
          )
        ) {
          collides = true;
          break;
        }
      }
    } catch {
      collides = false;
    }

    const offset =
      routeMetrics.offset +
      (collides
        ? routeMetrics.laneOffset === 0
          ? 18
          : Math.sign(routeMetrics.laneOffset) * 18
        : 0) +
      (data?.pathStyle === "sigmoid" ? 10 : 0);
    const stepPosition = collides
      ? Math.min(0.82, Math.max(0.18, routeMetrics.stepPosition))
      : routeMetrics.stepPosition;

    return getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      offset,
      stepPosition,
      borderRadius: routeMetrics.borderRadius,
    });
  }, [
    routeMetrics.borderRadius,
    routeMetrics.offset,
    routeMetrics.stepPosition,
    data?.pathStyle,
    sourcePosition,
    sourceX,
    sourceY,
    targetPosition,
    targetX,
    targetY,
    source,
    target,
    allNodes,
  ]);

  const hasFiniteGeometry =
    Number.isFinite(sourceX) &&
    Number.isFinite(sourceY) &&
    Number.isFinite(targetX) &&
    Number.isFinite(targetY) &&
    Number.isFinite(labelX) &&
    Number.isFinite(labelY);

  const isActive = selected || isHovered || isEditing;
  const hasLabel = Boolean(data?.label?.trim());

  useEffect(() => {
    if (!isEditing) {
      setDraftLabel(data?.label ?? "");
    }
  }, [data?.label, isEditing]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const commitLabel = useCallback(
    (nextLabel: string) => {
      onLabelChange(id, nextLabel.trim());
      setIsEditing(false);
    },
    [id, onLabelChange],
  );

  const startEditing = useCallback(() => {
    setDraftLabel(data?.label ?? "");
    setIsEditing(true);
  }, [data?.label]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === "Escape") {
      event.preventDefault();
      event.currentTarget.blur();
    }
  };

  const visibleStroke = isActive
    ? "var(--text-primary)"
    : "rgba(240, 240, 244, 0.62)";

  const label = draftLabel.trim();
  const labelWidth = Math.max(7, Math.min(28, Math.max(label.length, 1) + 1));

  return (
    <>
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={18}
        style={{ cursor: "pointer", pointerEvents: "stroke" }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDoubleClick={startEditing}
      />
      <path
        d={path}
        fill="none"
        stroke={visibleStroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        markerEnd={data?.showArrow ? `url(#${markerId})` : undefined}
        style={{
          ...style,
          opacity: isActive ? 1 : 0.72,
          transition: "stroke 150ms ease, opacity 150ms ease",
        }}
      />
      <defs>
        <marker
          id={markerId}
          markerWidth="10"
          markerHeight="10"
          refX="8.5"
          refY="5"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={visibleStroke} />
        </marker>
      </defs>
      <ViewportPortal>
        {hasFiniteGeometry && (hasLabel || isActive) && (
          <div
            className="nodrag nopan pointer-events-none absolute left-0 top-0 z-20"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            {isEditing ? (
              <input
                ref={inputRef}
                value={draftLabel}
                onChange={(event) => setDraftLabel(event.target.value)}
                onBlur={() => commitLabel(draftLabel)}
                onKeyDown={handleKeyDown}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
                onDoubleClick={(event) => event.stopPropagation()}
                className="nodrag nopan pointer-events-auto h-8 rounded-full border border-surface-border bg-surface/95 px-3 text-xs font-medium text-copy-primary outline-none backdrop-blur-sm"
                style={{ width: `${labelWidth}ch` }}
                placeholder="Add label"
              />
            ) : hasLabel ? (
              <button
                type="button"
                className="nodrag nopan pointer-events-auto rounded-full border border-surface-border bg-surface/90 px-3 py-1 text-xs font-medium text-copy-primary shadow-lg shadow-black/25 backdrop-blur-sm transition-colors hover:border-subtle-border"
                onPointerDown={(event) => event.stopPropagation()}
                onDoubleClick={(event) => {
                  event.stopPropagation();
                  startEditing();
                }}
              >
                {data?.label}
              </button>
            ) : (
              <button
                type="button"
                className="nodrag nopan pointer-events-auto rounded-full border border-dashed border-subtle-border bg-surface/65 px-3 py-1 text-xs font-medium text-copy-faint shadow-lg shadow-black/20 backdrop-blur-sm"
                onPointerDown={(event) => event.stopPropagation()}
                onDoubleClick={(event) => {
                  event.stopPropagation();
                  startEditing();
                }}
              >
                Add label
              </button>
            )}
          </div>
        )}
      </ViewportPortal>
    </>
  );
}
