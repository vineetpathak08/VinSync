import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { mutateFlow } from "@liveblocks/react-flow/node";
import { task } from "@trigger.dev/sdk/v3";
import type { Edge, Node } from "@xyflow/react";
import { z } from "zod";

import { getLiveblocksClient } from "@/lib/liveblocks";
import {
  AI_STATUS_FEED_ID,
  type AiStatusFeedMessage,
  type AiStatusPhase,
} from "@/types/tasks";
import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  DEFAULT_NODE_COLOR,
  NODE_COLORS,
  NODE_SHAPES,
  type CanvasEdge,
  type CanvasNode,
  type CanvasNodeColor,
  type CanvasNodeShape,
} from "@/types/canvas";

interface DesignAgentPayload {
  prompt: string;
  roomId: string;
  projectId?: string;
  runId?: string;
}

const AGENT_USER_ID = "vin-ai-design-agent";
const AGENT_NAME = "Vin AI";
const AGENT_COLOR = "#8b82ff";

const shapeSchema = z.enum(NODE_SHAPES);

const designActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("add-node"),
    node: z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      shape: shapeSchema,
      colorIndex: z.number().int().min(0).max(NODE_COLORS.length - 1),
      position: z.object({ x: z.number(), y: z.number() }),
      size: z.object({ width: z.number().positive(), height: z.number().positive() }),
    }),
  }),
  z.object({
    type: z.literal("move-node"),
    nodeId: z.string().min(1),
    position: z.object({ x: z.number(), y: z.number() }),
  }),
  z.object({
    type: z.literal("resize-node"),
    nodeId: z.string().min(1),
    size: z.object({ width: z.number().positive(), height: z.number().positive() }),
  }),
  z.object({
    type: z.literal("update-node-data"),
    nodeId: z.string().min(1),
    label: z.string().min(1).optional(),
    shape: shapeSchema.optional(),
    colorIndex: z.number().int().min(0).max(NODE_COLORS.length - 1).optional(),
  }),
  z.object({
    type: z.literal("delete-node"),
    nodeId: z.string().min(1),
  }),
  z.object({
    type: z.literal("add-edge"),
    edge: z.object({
      id: z.string().min(1),
      source: z.string().min(1),
      target: z.string().min(1),
      sourceHandle: z.string().optional(),
      targetHandle: z.string().optional(),
      label: z.string().optional(),
      showArrow: z.boolean().optional(),
      pathStyle: z.enum(["straight", "sigmoid"]).optional(),
    }),
  }),
  z.object({
    type: z.literal("delete-edge"),
    edgeId: z.string().min(1),
  }),
]);

const designPlanSchema = z.object({
  actions: z.array(designActionSchema).min(1).max(12),
});

type DesignPlan = z.infer<typeof designPlanSchema>;
type DesignAction = z.infer<typeof designActionSchema>;
type FlowSnapshot = {
  nodes: readonly CanvasNode[];
  edges: readonly CanvasEdge[];
};

const toKebabCase = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "item";

const uniqueId = (baseId: string, existingIds: Set<string>) => {
  let candidate = toKebabCase(baseId);
  let suffix = 1;

  while (existingIds.has(candidate)) {
    candidate = `${toKebabCase(baseId)}-${suffix}`;
    suffix += 1;
  }

  existingIds.add(candidate);
  return candidate;
};

const getColor = (index: number): CanvasNodeColor =>
  NODE_COLORS[Math.max(0, Math.min(index, NODE_COLORS.length - 1))] ??
  DEFAULT_NODE_COLOR;

const getShapeSize = (shape: CanvasNodeShape) => {
  switch (shape) {
    case "diamond":
      return { width: 200, height: 140 };
    case "circle":
      return { width: 140, height: 140 };
    case "pill":
      return { width: 180, height: 96 };
    case "cylinder":
      return { width: 180, height: 120 };
    case "hexagon":
      return { width: 180, height: 120 };
    case "rectangle":
    default:
      return { width: 180, height: 110 };
  }
};

const normalizePosition = (position: { x: number; y: number }) => ({
  x: Math.round(position.x / 24) * 24,
  y: Math.round(position.y / 24) * 24,
});

const normalizeSize = (size: { width: number; height: number }) => ({
  width: Math.round(Math.max(size.width, 80) / 8) * 8,
  height: Math.round(Math.max(size.height, 60) / 8) * 8,
});

const isCanvasNodeShape = (value: unknown): value is CanvasNodeShape =>
  typeof value === "string" &&
  NODE_SHAPES.includes(value as CanvasNodeShape);

const isCanvasNodeColor = (value: unknown): value is CanvasNodeColor =>
  NODE_COLORS.some((color) => color === value);

const getNumericStyleValue = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const buildCanvasSummary = (
  nodes: readonly Node[],
  edges: readonly Edge[],
) => ({
  nodes: nodes.map((node) => ({
    id: node.id,
    label: typeof node.data.label === "string" ? node.data.label : node.id,
    shape: isCanvasNodeShape(node.data.shape) ? node.data.shape : "rectangle",
    color: isCanvasNodeColor(node.data.color) ? node.data.color : DEFAULT_NODE_COLOR,
    position: node.position,
    size: {
      width: getNumericStyleValue(node.style?.width),
      height: getNumericStyleValue(node.style?.height),
    },
  })),
  edges: edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle ?? null,
    targetHandle: edge.targetHandle ?? null,
    label: edge.data?.label ?? null,
  })),
});

const getActionFocusPoint = (
  action: DesignAction,
  nodes: readonly Pick<Node, "id" | "position">[],
) => {
  const getNodePosition = (nodeId: string) =>
    nodes.find((node) => node.id === nodeId)?.position ?? null;

  if (action.type === "add-node") {
    return action.node.position;
  }

  if (
    action.type === "move-node" ||
    action.type === "resize-node" ||
    action.type === "update-node-data" ||
    action.type === "delete-node"
  ) {
    return getNodePosition(action.nodeId);
  }

  if (action.type === "add-edge") {
    const source = getNodePosition(action.edge.source);
    const target = getNodePosition(action.edge.target);

    if (source && target) {
      return {
        x: (source.x + target.x) / 2,
        y: (source.y + target.y) / 2,
      };
    }

    return source ?? target;
  }

  return null;
};

const buildPrompt = (prompt: string, canvasSummary: ReturnType<typeof buildCanvasSummary>) => `
You are Vin AI, a collaborative system design agent.

Goal:
- Turn the user's prompt into a concise architecture update on a shared React Flow canvas.

Rules:
- Use only these node shapes: ${NODE_SHAPES.join(", ")}.
- Use the existing color palette by choosing colorIndex values from 0 to ${NODE_COLORS.length - 1}.
- Prefer a left-to-right architecture flow with consistent spacing.
- Keep nodes on a loose grid and avoid overlap.
- Keep labels concise and architecture-oriented.
- Reuse existing nodes and edges when they already fit the prompt.
- Use at most 12 actions.
- Return only actions that are safe to apply directly.

Current canvas summary:
${JSON.stringify(canvasSummary, null, 2)}

User prompt:
${prompt}
`;

const roomEventTime = () => new Date().toISOString();

const ensureAiStatusFeed = async (
  client: ReturnType<typeof getLiveblocksClient>,
  roomId: string,
) => {
  try {
    await client.getFeed({ roomId, feedId: AI_STATUS_FEED_ID });
  } catch {
    await client
      .createFeed({
        roomId,
        feedId: AI_STATUS_FEED_ID,
        metadata: { purpose: "ai-status" },
      })
      .catch(() => undefined);
  }
};

const emitStatus = async (
  client: ReturnType<typeof getLiveblocksClient>,
  roomId: string,
  runId: string,
  projectId: string,
  phase: AiStatusPhase,
  message: string,
) => {
  const timestamp = roomEventTime();
  const feedMessage: AiStatusFeedMessage = {
    kind: "ai-status",
    source: "design",
    phase,
    projectId,
    runId,
    text: message,
    timestamp,
  };

  await ensureAiStatusFeed(client, roomId);
  await client
    .createFeedMessage<AiStatusFeedMessage>({
      roomId,
      feedId: AI_STATUS_FEED_ID,
      data: feedMessage,
      createdAt: Date.parse(timestamp),
    })
    .catch(() => undefined);

  await client.broadcastEvent(roomId, {
    type: "design-agent/status",
    phase,
    message,
    runId,
    projectId,
    timestamp,
  });
};

const setAgentPresence = async (
  client: ReturnType<typeof getLiveblocksClient>,
  roomId: string,
  presence: { cursor: { x: number; y: number } | null; thinking: boolean },
  ttl = 30,
) => {
  await client.setPresence(roomId, {
    userId: AGENT_USER_ID,
    data: presence,
    userInfo: {
      name: AGENT_NAME,
      avatar: "",
      color: AGENT_COLOR,
    },
    ttl,
  });
};

const applyPlan = async (
  roomId: string,
  runId: string,
  projectId: string,
  plan: DesignPlan,
) => {
  const client = getLiveblocksClient();
  const takenIds = new Set<string>();
  const idMap = new Map<string, string>();
  let appliedActions = 0;
  let skippedActions = 0;

  await emitStatus(
    client,
    roomId,
    runId,
    projectId,
    "start",
    "Starting the architecture update.",
  );

  try {
    await mutateFlow<CanvasNode, CanvasEdge>({ client, roomId }, async (flow) => {
      for (const action of plan.actions) {
        const snapshot = flow.toJSON();
        const focusPoint = getActionFocusPoint(action, snapshot.nodes);

        await setAgentPresence(
          client,
          roomId,
          {
            cursor: focusPoint ? normalizePosition(focusPoint) : { x: 120, y: 120 },
            thinking: true,
          },
          30,
        );

        await emitStatus(
          client,
          roomId,
          runId,
          projectId,
          "applying",
          `Applying ${action.type.replace(/-/g, " ")}.`,
        );

        if (action.type === "add-node") {
          const nodeId = uniqueId(action.node.id, takenIds);
          idMap.set(action.node.id, nodeId);

          flow.addNode({
            id: nodeId,
            type: CANVAS_NODE_TYPE,
            position: normalizePosition(action.node.position),
            data: {
              label: action.node.label,
              shape: action.node.shape,
              color: getColor(action.node.colorIndex),
            },
            style: normalizeSize(action.node.size),
          });

          appliedActions += 1;
          continue;
        }

        if (action.type === "move-node") {
          const resolvedNodeId = idMap.get(action.nodeId) ?? action.nodeId;

          if (!flow.getNode(resolvedNodeId)) {
            skippedActions += 1;
            continue;
          }

          flow.updateNode(resolvedNodeId, {
            position: normalizePosition(action.position),
          });

          appliedActions += 1;
          continue;
        }

        if (action.type === "resize-node") {
          const resolvedNodeId = idMap.get(action.nodeId) ?? action.nodeId;

          if (!flow.getNode(resolvedNodeId)) {
            skippedActions += 1;
            continue;
          }

          flow.updateNode(resolvedNodeId, {
            style: normalizeSize(action.size),
          });

          appliedActions += 1;
          continue;
        }

        if (action.type === "update-node-data") {
          const resolvedNodeId = idMap.get(action.nodeId) ?? action.nodeId;
          const currentNode = flow.getNode(resolvedNodeId);

          if (!currentNode) {
            skippedActions += 1;
            continue;
          }

          flow.updateNodeData(resolvedNodeId, (data) => ({
            ...data,
            ...(action.label ? { label: action.label } : {}),
            ...(action.shape ? { shape: action.shape } : {}),
            ...(action.colorIndex !== undefined
              ? { color: getColor(action.colorIndex) }
              : {}),
          }));

          if (action.shape) {
            flow.updateNode(resolvedNodeId, {
              style: {
                ...(currentNode.style ?? {}),
                ...getShapeSize(action.shape),
              },
            });
          }

          appliedActions += 1;
          continue;
        }

        if (action.type === "delete-node") {
          const resolvedNodeId = idMap.get(action.nodeId) ?? action.nodeId;

          if (!flow.getNode(resolvedNodeId)) {
            skippedActions += 1;
            continue;
          }

          const connectedEdgeIds = flow.edges
            .filter((edge) => edge.source === resolvedNodeId || edge.target === resolvedNodeId)
            .map((edge) => edge.id);

          flow.removeEdges(connectedEdgeIds);
          flow.removeNode(resolvedNodeId);

          appliedActions += 1;
          continue;
        }

        if (action.type === "add-edge") {
          const source = idMap.get(action.edge.source) ?? action.edge.source;
          const target = idMap.get(action.edge.target) ?? action.edge.target;

          if (!flow.getNode(source) || !flow.getNode(target)) {
            skippedActions += 1;
            continue;
          }

          const edgeId = uniqueId(action.edge.id, takenIds);
          idMap.set(action.edge.id, edgeId);

          flow.addEdge({
            id: edgeId,
            type: CANVAS_EDGE_TYPE,
            source,
            target,
            sourceHandle: action.edge.sourceHandle,
            targetHandle: action.edge.targetHandle,
            data: {
              label: action.edge.label,
              showArrow: action.edge.showArrow ?? true,
              pathStyle: action.edge.pathStyle ?? "sigmoid",
            },
          });

          appliedActions += 1;
          continue;
        }

        if (action.type === "delete-edge") {
          const resolvedEdgeId = idMap.get(action.edgeId) ?? action.edgeId;

          if (!flow.getEdge(resolvedEdgeId)) {
            skippedActions += 1;
            continue;
          }

          flow.removeEdge(resolvedEdgeId);
          appliedActions += 1;
        }
      }
    });

    await emitStatus(
      client,
      roomId,
      runId,
      projectId,
      "complete",
      "Architecture update complete.",
    );

    await client.broadcastEvent(roomId, {
      type: "design-agent/result",
      runId,
      projectId,
      appliedActions,
      skippedActions,
      timestamp: roomEventTime(),
    });

    return { appliedActions, skippedActions };
  } finally {
    await setAgentPresence(
      client,
      roomId,
      { cursor: null, thinking: false },
      2,
    ).catch(() => undefined);
  }
};

export const designAgent = task({
  id: "design-agent",
  run: async (payload: DesignAgentPayload) => {
    const client = getLiveblocksClient();
    const roomId = payload.roomId.trim();
    const projectId = payload.projectId?.trim() || roomId;
    const runId = payload.runId?.trim() || `design-${roomId}`;
    const prompt = payload.prompt.trim();

    if (!roomId || !prompt) {
      throw new Error("Design agent payload is missing a roomId or prompt");
    }

    try {
      await client.getOrCreateRoom(roomId, {
        defaultAccesses: ["room:write"],
      });

      await setAgentPresence(
        client,
        roomId,
        { cursor: { x: 120, y: 120 }, thinking: true },
        30,
      );

      let canvas: FlowSnapshot = { nodes: [], edges: [] };

      await mutateFlow<CanvasNode, CanvasEdge>({ client, roomId }, (flow) => {
        canvas = flow.toJSON();
      });

      await emitStatus(
        client,
        roomId,
        runId,
        projectId,
        "processing",
        "Generating the canvas update plan.",
      );

      const planResult = await generateObject({
        model: google("gemini-2.0-flash"),
        schema: designPlanSchema,
        temperature: 0.2,
        prompt: buildPrompt(prompt, buildCanvasSummary(canvas.nodes, canvas.edges)),
      });

      await emitStatus(
        client,
        roomId,
        runId,
        projectId,
        "processing",
        "Applying the generated design to the shared canvas.",
      );

      const result = await applyPlan(roomId, runId, projectId, planResult.object);

      return {
        roomId,
        projectId,
        runId,
        ...result,
      };
    } catch (error) {
      await emitStatus(
        client,
        roomId,
        runId,
        projectId,
        "error",
        error instanceof Error
          ? `Design update failed: ${error.message}`
          : "Design update failed.",
      ).catch(() => undefined);

      throw error;
    } finally {
      await setAgentPresence(
        client,
        roomId,
        { cursor: null, thinking: false },
        2,
      ).catch(() => undefined);
    }
  },
});
