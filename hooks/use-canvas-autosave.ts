"use client";

import { useCallback, useEffect, useRef } from "react";

import { useEditorSaveStatus } from "@/components/editor/editor-save-status";
import { serializeCanvasSnapshot } from "@/lib/canvas-storage";
import type { CanvasEdge, CanvasNode, CanvasSnapshot } from "@/types/canvas";

interface UseCanvasAutosaveOptions {
  projectId: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  enabled?: boolean;
  debounceMs?: number;
}

interface CanvasAutosaveHandle {
  markSnapshotSaved: (snapshot: CanvasSnapshot) => void;
}

export function useCanvasAutosave({
  projectId,
  nodes,
  edges,
  enabled = true,
  debounceMs = 900,
}: UseCanvasAutosaveOptions): CanvasAutosaveHandle {
  const { setSaveStatus } = useEditorSaveStatus();
  const lastSavedSnapshotRef = useRef<string>("");
  const debounceTimerRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const markSnapshotSaved = useCallback(
    (snapshot: CanvasSnapshot) => {
      lastSavedSnapshotRef.current = serializeCanvasSnapshot(snapshot);
      setSaveStatus("saved");
    },
    [setSaveStatus],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const snapshot: CanvasSnapshot = { nodes, edges };
    const serializedSnapshot = serializeCanvasSnapshot(snapshot);

    if (
      nodes.length === 0 &&
      edges.length === 0 &&
      lastSavedSnapshotRef.current === ""
    ) {
      return;
    }

    if (serializedSnapshot === lastSavedSnapshotRef.current) {
      return;
    }

    setSaveStatus("saving");

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      const controller = new AbortController();

      abortControllerRef.current?.abort();
      abortControllerRef.current = controller;

      const saveCanvas = async () => {
        try {
          const response = await fetch(
            `/api/projects/${projectId}/canvas`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: serializedSnapshot,
              signal: controller.signal,
            },
          );

          if (!response.ok) {
            throw new Error(`Canvas save failed with status ${response.status}`);
          }

          const payload = (await response.json()) as {
            canvas?: CanvasSnapshot;
          };

          const savedSnapshot = payload.canvas ?? snapshot;
          lastSavedSnapshotRef.current = serializeCanvasSnapshot(savedSnapshot);
          setSaveStatus("saved");
        } catch (error) {
          if (controller.signal.aborted) {
            return;
          }

          console.error("Canvas autosave failed", error);
          setSaveStatus("error");
        }
      };

      void saveCanvas();
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [debounceMs, edges, enabled, nodes, projectId, setSaveStatus]);

  useEffect(
    () => () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }

      abortControllerRef.current?.abort();
    },
    [],
  );

  return { markSnapshotSaved };
}