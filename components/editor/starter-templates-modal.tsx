"use client";

import { useMemo } from "react";
import { Layout } from "lucide-react";

import { EditorDialogPattern } from "@/components/editor/editor-dialog-pattern";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

import CANVAS_TEMPLATES, {
  instantiateCanvasTemplate,
  type CanvasTemplate,
} from "./starter-templates";

type PreviewNodeStyle = {
  width?: number;
  height?: number;
};

type PreviewNodeData = {
  color?: {
    fill?: string;
  };
  shape?: string;
};

interface StarterTemplatesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

function Preview({ template }: { template: CanvasTemplate }) {
  const view = useMemo(() => {
    const nodes = template.nodes;
    if (nodes.length === 0) return { minX: 0, minY: 0, maxX: 100, maxY: 100 };
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    for (const n of nodes) {
      const style = n.style as PreviewNodeStyle | undefined;
      const w = style?.width ?? 100;
      const h = style?.height ?? 60;
      minX = Math.min(minX, n.position.x - w / 2);
      minY = Math.min(minY, n.position.y - h / 2);
      maxX = Math.max(maxX, n.position.x + w / 2);
      maxY = Math.max(maxY, n.position.y + h / 2);
    }

    return { minX, minY, maxX, maxY };
  }, [template.nodes]);

  const width = Math.max(1, view.maxX - view.minX);
  const height = Math.max(1, view.maxY - view.minY);
  const padding = 28;
  const innerWidth = width + padding * 2;
  const innerHeight = height + padding * 2;

  const transform = (x: number, y: number) => ({
    x: padding + (x - view.minX),
    y: padding + (y - view.minY),
  });

  const filterId = `starter-template-shadow-${template.id}`;

  return (
    <svg
      viewBox={`0 0 ${innerWidth} ${innerHeight}`}
      preserveAspectRatio="xMidYMid meet"
      className="h-full w-full rounded-2xl bg-base/70"
    >
      <defs>
        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.06" />
        </filter>
      </defs>
      {/* edges */}
      {template.edges.map((e) => {
        const s = template.nodes.find((n) => n.id === e.source);
        const t = template.nodes.find((n) => n.id === e.target);
        if (!s || !t) return null;
        const p1 = transform(s.position.x, s.position.y);
        const p2 = transform(t.position.x, t.position.y);
        return (
          <line
            key={e.id}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke="rgba(200,200,200,0.4)"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        );
      })}

      {/* nodes */}
      {template.nodes.map((n) => {
        const p = transform(n.position.x, n.position.y);
        const style = n.style as PreviewNodeStyle | undefined;
        const data = n.data as PreviewNodeData | undefined;
        const w = style?.width ?? 100;
        const h = style?.height ?? 60;
        const color = data?.color?.fill ?? "#111";
        const shape = data?.shape ?? "rectangle";

        if (shape === "circle") {
          return (
            <circle
              key={n.id}
              cx={p.x}
              cy={p.y}
              r={Math.max(6, Math.min(w, h) / 2)}
              fill={color}
              stroke="rgba(255,255,255,0.06)"
            />
          );
        }

        return (
          <rect
            key={n.id}
            x={p.x - Math.max(8, w / 2)}
            y={p.y - Math.max(6, h / 2)}
            width={Math.max(16, w)}
            height={Math.max(12, h)}
            rx={6}
            fill={color}
            stroke="rgba(255,255,255,0.06)"
            filter={`url(#${filterId})`}
          />
        );
      })}
    </svg>
  );
}

export function StarterTemplatesModal({
  isOpen,
  onOpenChange,
}: StarterTemplatesModalProps) {
  const handleImport = (template: CanvasTemplate) => {
    const importSeed = `${template.id}-${Date.now()}`;
    const { nodes, edges } = instantiateCanvasTemplate(template, importSeed);

    window.dispatchEvent(
      new CustomEvent("vinsync:replace-canvas", { detail: { nodes, edges } }),
    );

    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-none overflow-hidden border-0 bg-transparent p-0 shadow-none ring-0 sm:w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-2rem)] lg:max-w-312 xl:max-w-368">
        <DialogTitle className="sr-only">Starter templates</DialogTitle>
        <DialogDescription className="sr-only">
          Choose a canvas template to import.
        </DialogDescription>
        <EditorDialogPattern
          className="grid max-h-[calc(100dvh-1rem)] w-full gap-4 overflow-hidden p-4 sm:max-h-[calc(100dvh-2rem)] sm:p-5 lg:p-6"
          title={"Import Template"}
          description={
            "Choose a starter template to pre-populate your canvas. Any existing nodes will be replaced — use z to undo."
          }
        >
          <div className="grid min-h-0 min-w-0 gap-4 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {CANVAS_TEMPLATES.map((template) => (
                <article
                  key={template.id}
                  className="grid overflow-hidden rounded-3xl border border-surface-border bg-surface/70 shadow-sm md:grid-cols-[10rem_minmax(0,1fr)] lg:grid-cols-[12rem_minmax(0,1fr)]"
                >
                  <div className="border-b border-surface-border bg-base/80 p-3 md:border-b-0 md:border-r md:p-3">
                    <div className="aspect-16/10 w-full overflow-hidden rounded-2xl bg-base/90 md:aspect-auto md:h-full">
                      <Preview template={template} />
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-col gap-3 p-3 sm:p-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-base/80 text-copy-secondary shadow-inner shadow-black/10 sm:h-11 sm:w-11">
                        <Layout className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-sm font-semibold text-copy-primary sm:text-[15px]">
                          {template.name}
                        </p>
                        <p className="text-sm leading-5 text-copy-muted sm:text-[15px]">
                          {template.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto pt-1">
                      <Button
                        className="w-full gap-2"
                        onClick={() => handleImport(template)}
                      >
                        Import
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </EditorDialogPattern>
      </DialogContent>
    </Dialog>
  );
}

export default StarterTemplatesModal;
