import { NodeResizer, Handle, Position, type NodeProps } from "@xyflow/react";
import { useEffect, useRef, useState } from "react";

import type {
  CanvasNode,
  CanvasNodeShape,
  CanvasNodeColor,
} from "@/types/canvas";
import { NODE_COLORS } from "@/types/canvas";

interface ShapeVisualProps {
  shape: CanvasNodeShape;
  fill: string;
  borderColor: string;
  className?: string;
}

export function ShapeVisual({
  shape,
  fill,
  borderColor,
  className,
}: ShapeVisualProps) {
  const baseClassName = `absolute inset-0 ${className ?? ""}`.trim();

  if (shape === "rectangle" || shape === "pill" || shape === "circle") {
    const radiusClassName =
      shape === "rectangle" ? "rounded-xl" : "rounded-full";

    return (
      <div
        className={`${baseClassName} border ${radiusClassName}`}
        style={{ backgroundColor: fill, borderColor }}
      />
    );
  }

  if (shape === "diamond") {
    return (
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className={baseClassName}
      >
        <polygon
          points="50 0 100 50 50 100 0 50"
          fill={fill}
          stroke={borderColor}
          strokeWidth="2"
        />
      </svg>
    );
  }

  if (shape === "hexagon") {
    return (
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className={baseClassName}
      >
        <polygon
          points="20 0 80 0 100 50 80 100 20 100 0 50"
          fill={fill}
          stroke={borderColor}
          strokeWidth="2"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={baseClassName}
    >
      <path
        d="M10 20C10 9 28 0 50 0C72 0 90 9 90 20V80C90 91 72 100 50 100C28 100 10 91 10 80Z"
        fill={fill}
        stroke={borderColor}
        strokeWidth="2"
      />
      <ellipse
        cx="50"
        cy="20"
        rx="40"
        ry="14"
        fill="none"
        stroke={borderColor}
        strokeWidth="2"
      />
    </svg>
  );
}

const MIN_NODE_WIDTH = 120;
const MIN_NODE_HEIGHT = 80;

interface CanvasNodeRendererProps extends NodeProps<CanvasNode> {
  onLabelChange: (id: string, label: string) => void;
  onColorChange?: (id: string, color: CanvasNodeColor) => void;
}

export function CanvasNodeRenderer({
  id,
  data,
  selected,
  onLabelChange,
  onColorChange,
}: CanvasNodeRendererProps) {
  const borderColor = selected
    ? "var(--accent-primary)"
    : "var(--border-default)";
  const [isEditing, setIsEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(data.label);
  const labelBeforeEditRef = useRef(data.label);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!isEditing) {
      setDraftLabel(data.label);
    }
  }, [data.label, isEditing]);

  useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }
  }, [isEditing]);

  const handleLabelChange = (value: string) => {
    setDraftLabel(value);
    onLabelChange(id, value);
  };

  const handleLabelKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onLabelChange(id, labelBeforeEditRef.current);
      setDraftLabel(labelBeforeEditRef.current);
      setIsEditing(false);
      return;
    }
  };

  const handleLabelBlur = () => {
    setIsEditing(false);
  };

  return (
    <div className="relative h-full w-full group">
      {/* Connection handles: one source + one target per side to allow connecting in both directions */}
      <Handle
        type="source"
        id={`${id}-handle-top-src`}
        position={Position.Top}
        className="h-3 w-3 -translate-y-2 rounded-full border border-surface-border bg-white opacity-0 transition-opacity group-hover:opacity-100 nodrag nopan"
      />
      <Handle
        type="target"
        id={`${id}-handle-top-tgt`}
        position={Position.Top}
        className="h-3 w-3 translate-y-2 rounded-full border border-surface-border bg-white opacity-0 transition-opacity group-hover:opacity-100 nodrag nopan"
      />

      <Handle
        type="source"
        id={`${id}-handle-right-src`}
        position={Position.Right}
        className="h-3 w-3 translate-x-2 -translate-y-0 rounded-full border border-surface-border bg-white opacity-0 transition-opacity group-hover:opacity-100 nodrag nopan"
      />
      <Handle
        type="target"
        id={`${id}-handle-right-tgt`}
        position={Position.Right}
        className="h-3 w-3 -translate-x-2 rounded-full border border-surface-border bg-white opacity-0 transition-opacity group-hover:opacity-100 nodrag nopan"
      />

      <Handle
        type="source"
        id={`${id}-handle-bottom-src`}
        position={Position.Bottom}
        className="h-3 w-3 translate-y-2 rounded-full border border-surface-border bg-white opacity-0 transition-opacity group-hover:opacity-100 nodrag nopan"
      />
      <Handle
        type="target"
        id={`${id}-handle-bottom-tgt`}
        position={Position.Bottom}
        className="h-3 w-3 -translate-y-2 rounded-full border border-surface-border bg-white opacity-0 transition-opacity group-hover:opacity-100 nodrag nopan"
      />

      <Handle
        type="source"
        id={`${id}-handle-left-src`}
        position={Position.Left}
        className="h-3 w-3 -translate-x-2 rounded-full border border-surface-border bg-white opacity-0 transition-opacity group-hover:opacity-100 nodrag nopan"
      />
      <Handle
        type="target"
        id={`${id}-handle-left-tgt`}
        position={Position.Left}
        className="h-3 w-3 translate-x-2 rounded-full border border-surface-border bg-white opacity-0 transition-opacity group-hover:opacity-100 nodrag nopan"
      />
      <NodeResizer
        isVisible={selected}
        minWidth={MIN_NODE_WIDTH}
        minHeight={MIN_NODE_HEIGHT}
        handleClassName="h-2.5 w-2.5 rounded-full border border-surface-border bg-elevated"
        lineClassName="border border-surface-border/70"
      />
      <ShapeVisual
        shape={data.shape}
        fill={data.color.fill}
        borderColor={borderColor}
      />
      {selected && onColorChange ? (
        <div
          className="absolute left-1/2 z-20 -translate-x-1/2 -top-10 nodrag nopan pointer-events-auto"
          style={{ transform: "translateX(-50%)" }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center space-x-2 rounded-md bg-surface/80 p-1 shadow-sm">
            {NODE_COLORS.map((c, idx) => {
              const isActive =
                c.fill === data.color.fill && c.text === data.color.text;
              return (
                <button
                  key={idx}
                  title={`Color ${idx + 1}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onColorChange(id, c as CanvasNodeColor);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className={`h-6 w-6 rounded-md border-2 transition-all focus:outline-none" ${
                    isActive
                      ? "ring-2 ring-offset-1 ring-offset-surface ring-accent"
                      : "border-transparent"
                  }`}
                  style={{
                    backgroundColor: c.fill,
                    color: c.text,
                    boxShadow: `0 0 6px 0 ${c.text}22`,
                  }}
                />
              );
            })}
          </div>
        </div>
      ) : null}
      <div
        className="absolute inset-0 z-10 flex items-center justify-center px-3 text-center text-sm font-medium"
        style={{ color: data.color.text }}
        onDoubleClick={(event) => {
          event.stopPropagation();
          labelBeforeEditRef.current = data.label;
          setDraftLabel(data.label);
          setIsEditing(true);
        }}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={draftLabel}
            onChange={(event) => handleLabelChange(event.target.value)}
            onKeyDown={handleLabelKeyDown}
            onBlur={handleLabelBlur}
            onPointerDown={(event) => event.stopPropagation()}
            rows={1}
            className="nodrag nopan w-full max-w-[85%] resize-none rounded-xl bg-transparent text-center text-sm font-medium leading-5 text-current outline-none"
            placeholder="Add label"
          />
        ) : data.label ? (
          <span>{data.label}</span>
        ) : (
          <span className="text-copy-muted">Add label</span>
        )}
      </div>
    </div>
  );
}
