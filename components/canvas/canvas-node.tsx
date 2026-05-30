import type { NodeProps } from "@xyflow/react";

import type { CanvasNode } from "@/types/canvas";

export function CanvasNodeRenderer({ data, selected }: NodeProps<CanvasNode>) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center rounded-xl border border-surface-border px-3 text-center text-sm font-medium transition ${
        selected ? "ring-2 ring-brand" : ""
      }`}
      style={{ backgroundColor: data.color.fill, color: data.color.text }}
    >
      {data.label}
    </div>
  );
}
