import type { CanvasEdge, CanvasNode } from "@/types/canvas";
import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  NODE_COLORS,
} from "@/types/canvas";

export type CanvasTemplate = {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
};

export type CanvasTemplateImport = {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
};

export function instantiateCanvasTemplate(
  template: CanvasTemplate,
  seed: string,
): CanvasTemplateImport {
  const idMap: Record<string, string> = {};

  const nodes = template.nodes.map((node, index) => {
    const newId = `${seed}-n-${index}`;
    idMap[node.id] = newId;

    return {
      ...node,
      id: newId,
    };
  });

  const edges = template.edges.map((edge, index) => ({
    ...edge,
    id: `${seed}-e-${index}`,
    source: idMap[edge.source] ?? edge.source,
    target: idMap[edge.target] ?? edge.target,
  }));

  return { nodes, edges };
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: "microservices",
    name: "Microservices",
    description:
      "A small microservice architecture with API gateway and services.",
    nodes: [
      {
        id: "gw",
        type: CANVAS_NODE_TYPE,
        position: { x: 400, y: 60 },
        data: { label: "API Gateway", color: NODE_COLORS[1], shape: "pill" },
        style: { width: 220, height: 72 },
      },
      {
        id: "svc-a",
        type: CANVAS_NODE_TYPE,
        position: { x: 160, y: 220 },
        data: { label: "Service A", color: NODE_COLORS[2], shape: "rectangle" },
        style: { width: 180, height: 110 },
      },
      {
        id: "svc-b",
        type: CANVAS_NODE_TYPE,
        position: { x: 400, y: 220 },
        data: { label: "Service B", color: NODE_COLORS[3], shape: "rectangle" },
        style: { width: 180, height: 110 },
      },
      {
        id: "db",
        type: CANVAS_NODE_TYPE,
        position: { x: 640, y: 220 },
        data: { label: "Database", color: NODE_COLORS[4], shape: "cylinder" },
        style: { width: 180, height: 120 },
      },
    ],
    edges: [
      {
        id: "e1",
        source: "gw",
        target: "svc-a",
        type: CANVAS_EDGE_TYPE,
        data: { label: "HTTP" },
      },
      {
        id: "e2",
        source: "gw",
        target: "svc-b",
        type: CANVAS_EDGE_TYPE,
        data: { label: "HTTP" },
      },
      {
        id: "e3",
        source: "svc-b",
        target: "db",
        type: CANVAS_EDGE_TYPE,
        data: { label: "Reads/Writes" },
      },
    ],
  },

  {
    id: "cicd",
    name: "CI/CD Pipeline",
    description:
      "Simple CI/CD pipeline flow with repo, build, test, deploy stages.",
    nodes: [
      {
        id: "repo",
        type: CANVAS_NODE_TYPE,
        position: { x: 160, y: 120 },
        data: {
          label: "Repository",
          color: NODE_COLORS[6],
          shape: "rectangle",
        },
        style: { width: 160, height: 90 },
      },
      {
        id: "build",
        type: CANVAS_NODE_TYPE,
        position: { x: 360, y: 120 },
        data: { label: "Build", color: NODE_COLORS[1], shape: "rectangle" },
        style: { width: 160, height: 90 },
      },
      {
        id: "test",
        type: CANVAS_NODE_TYPE,
        position: { x: 560, y: 120 },
        data: { label: "Tests", color: NODE_COLORS[7], shape: "rectangle" },
        style: { width: 160, height: 90 },
      },
      {
        id: "deploy",
        type: CANVAS_NODE_TYPE,
        position: { x: 760, y: 120 },
        data: { label: "Deploy", color: NODE_COLORS[0], shape: "rectangle" },
        style: { width: 160, height: 90 },
      },
    ],
    edges: [
      { id: "e1", source: "repo", target: "build", type: CANVAS_EDGE_TYPE },
      { id: "e2", source: "build", target: "test", type: CANVAS_EDGE_TYPE },
      { id: "e3", source: "test", target: "deploy", type: CANVAS_EDGE_TYPE },
    ],
  },

  {
    id: "event-driven",
    name: "Event-driven System",
    description:
      "Producers, event bus, and consumers communicating asynchronously.",
    nodes: [
      {
        id: "producer",
        type: CANVAS_NODE_TYPE,
        position: { x: 160, y: 140 },
        data: { label: "Producer", color: NODE_COLORS[5], shape: "rectangle" },
        style: { width: 180, height: 110 },
      },
      {
        id: "bus",
        type: CANVAS_NODE_TYPE,
        position: { x: 420, y: 140 },
        data: { label: "Event Bus", color: NODE_COLORS[1], shape: "pill" },
        style: { width: 220, height: 72 },
      },
      {
        id: "consumer-a",
        type: CANVAS_NODE_TYPE,
        position: { x: 680, y: 60 },
        data: {
          label: "Consumer A",
          color: NODE_COLORS[2],
          shape: "rectangle",
        },
        style: { width: 160, height: 90 },
      },
      {
        id: "consumer-b",
        type: CANVAS_NODE_TYPE,
        position: { x: 680, y: 220 },
        data: {
          label: "Consumer B",
          color: NODE_COLORS[3],
          shape: "rectangle",
        },
        style: { width: 160, height: 90 },
      },
    ],
    edges: [
      {
        id: "e1",
        source: "producer",
        target: "bus",
        type: CANVAS_EDGE_TYPE,
        data: { label: "events" },
      },
      {
        id: "e2",
        source: "bus",
        target: "consumer-a",
        type: CANVAS_EDGE_TYPE,
        data: { label: "subscribe" },
      },
      {
        id: "e3",
        source: "bus",
        target: "consumer-b",
        type: CANVAS_EDGE_TYPE,
        data: { label: "subscribe" },
      },
    ],
  },
];

export default CANVAS_TEMPLATES;
