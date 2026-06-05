import { useEffect } from "react";

type AnyFlow = any;

export default function useKeyboardShortcuts(
  reactFlow: AnyFlow | null | undefined,
  undo?: () => void,
  redo?: () => void,
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) {
          return;
        }
      }

      // Zoom in: '+' or '='
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        reactFlow?.zoomIn?.({ duration: 200 });
        return;
      }

      // Zoom out: '-'
      if (e.key === "-") {
        e.preventDefault();
        reactFlow?.zoomOut?.({ duration: 200 });
        return;
      }

      const cmd = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // Undo: Cmd/Ctrl+Z
      if (cmd && !e.shiftKey && key === "z") {
        e.preventDefault();
        undo?.();
        return;
      }

      // Redo: Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y
      if (cmd && ((e.shiftKey && key === "z") || key === "y")) {
        e.preventDefault();
        redo?.();
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [reactFlow, undo, redo]);
}
