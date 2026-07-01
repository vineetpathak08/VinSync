import type { CanvasEdge, CanvasNode, CanvasSnapshot } from "@/types/canvas";

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isCanvasNodeArray = (value: unknown): value is CanvasNode[] =>
  Array.isArray(value) && value.every(isObject);

const isCanvasEdgeArray = (value: unknown): value is CanvasEdge[] =>
  Array.isArray(value) && value.every(isObject);

const safeParseJson = (value: string): unknown => {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
};

export const normalizeCanvasSnapshot = (
  value: unknown,
): CanvasSnapshot | null => {
  const parsedValue = typeof value === "string" ? safeParseJson(value) : value;

  if (!isObject(parsedValue)) {
    return null;
  }

  if (
    !isCanvasNodeArray(parsedValue.nodes) ||
    !isCanvasEdgeArray(parsedValue.edges)
  ) {
    return null;
  }

  return {
    nodes: parsedValue.nodes,
    edges: parsedValue.edges,
  };
};

export const serializeCanvasSnapshot = (snapshot: CanvasSnapshot): string =>
  JSON.stringify(snapshot);