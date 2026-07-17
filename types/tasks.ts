export const AI_STATUS_FEED_ID = "ai-status-feed";

export const AI_STATUS_PHASES = [
  "start",
  "processing",
  "applying",
  "complete",
  "error",
] as const;

export type AiStatusPhase = (typeof AI_STATUS_PHASES)[number];

export interface AiStatusFeedMessage {
  kind: "ai-status";
  source: "design" | "spec" | "general";
  phase: AiStatusPhase;
  projectId: string;
  runId?: string;
  text?: string;
  timestamp: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isAiStatusPhase = (value: unknown): value is AiStatusPhase =>
  typeof value === "string" &&
  AI_STATUS_PHASES.includes(value as AiStatusPhase);

export const parseAiStatusFeedMessage = (
  value: unknown,
): AiStatusFeedMessage | null => {
  if (!isRecord(value)) {
    return null;
  }

  if (value.kind !== "ai-status") {
    return null;
  }

  if (
    value.source !== "design" &&
    value.source !== "spec" &&
    value.source !== "general"
  ) {
    return null;
  }

  if (!isAiStatusPhase(value.phase)) {
    return null;
  }

  if (typeof value.projectId !== "string" || !value.projectId.trim()) {
    return null;
  }

  if (typeof value.timestamp !== "string" || !value.timestamp.trim()) {
    return null;
  }

  if (value.runId !== undefined && typeof value.runId !== "string") {
    return null;
  }

  if (value.text !== undefined && typeof value.text !== "string") {
    return null;
  }

  return {
    kind: "ai-status",
    source: value.source,
    phase: value.phase,
    projectId: value.projectId,
    runId: value.runId,
    text: value.text,
    timestamp: value.timestamp,
  };
};

export const isAiGenerationActive = (phase: AiStatusPhase) =>
  phase === "start" || phase === "processing" || phase === "applying";
