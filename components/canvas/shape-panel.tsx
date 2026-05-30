"use client";

import type { DragEvent, ReactNode } from "react";

import type { CanvasNodeShape } from "@/types/canvas";

export const SHAPE_DRAG_MIME = "application/x-ghostai-shape";

export interface ShapeDragPayload {
  shape: CanvasNodeShape;
  size: { width: number; height: number };
}

export const SHAPE_DEFAULT_SIZES: Record<CanvasNodeShape, ShapeDragPayload["size"]> = {
  rectangle: { width: 180, height: 110 },
  diamond: { width: 200, height: 140 },
  circle: { width: 140, height: 140 },
  pill: { width: 180, height: 96 },
  cylinder: { width: 180, height: 120 },
  hexagon: { width: 180, height: 120 },
};

const SHAPE_ITEMS: Array<{
  shape: CanvasNodeShape;
  label: string;
  icon: ReactNode;
}> = [
  {
    shape: "rectangle",
    label: "Rectangle",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <rect
          x="4"
          y="6"
          width="16"
          height="12"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
      </svg>
    ),
  },
  {
    shape: "diamond",
    label: "Diamond",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <polygon
          points="12 3 21 12 12 21 3 12"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
      </svg>
    ),
  },
  {
    shape: "circle",
    label: "Circle",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <circle
          cx="12"
          cy="12"
          r="7"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
      </svg>
    ),
  },
  {
    shape: "pill",
    label: "Pill",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <rect
          x="4"
          y="8"
          width="16"
          height="8"
          rx="4"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
      </svg>
    ),
  },
  {
    shape: "cylinder",
    label: "Cylinder",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <ellipse
          cx="12"
          cy="6"
          rx="7"
          ry="3"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M5 6v10c0 1.7 3.1 3 7 3s7-1.3 7-3V6"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
      </svg>
    ),
  },
  {
    shape: "hexagon",
    label: "Hexagon",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <polygon
          points="7 4 17 4 22 12 17 20 7 20 2 12"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
      </svg>
    ),
  },
];

interface ShapePanelProps {
  className?: string;
}

export function ShapePanel({ className }: ShapePanelProps) {
  const handleDragStart = (shape: CanvasNodeShape) => (event: DragEvent) => {
    const payload: ShapeDragPayload = {
      shape,
      size: SHAPE_DEFAULT_SIZES[shape],
    };

    event.dataTransfer.setData(SHAPE_DRAG_MIME, JSON.stringify(payload));
    event.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div
      className={`flex items-center gap-2 rounded-full border border-surface-border bg-surface/90 px-3 py-2 shadow-lg shadow-black/30 ${
        className ?? ""
      }`}
    >
      {SHAPE_ITEMS.map((item) => (
        <button
          key={item.shape}
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-surface-border bg-base/70 text-copy-primary transition hover:border-surface-border-subtle hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          draggable
          onDragStart={handleDragStart(item.shape)}
          aria-label={`Drag ${item.label}`}
          title={item.label}
        >
          {item.icon}
        </button>
      ))}
    </div>
  );
}
