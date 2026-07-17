import { tasks } from "@trigger.dev/sdk/v3";
import { NextResponse } from "next/server";

import type { designAgent } from "@/trigger/design-agent";
import { prisma } from "@/lib/prisma";
import { getCurrentClerkIdentity, getProjectByAccess } from "@/lib/project-access";

interface DesignRequestBody {
  prompt?: unknown;
  roomId?: unknown;
  projectId?: unknown;
}

const parseJsonBody = async (request: Request): Promise<unknown | null> => {
  try {
    return await request.json();
  } catch {
    return null;
  }
};

const normalizeText = (input: unknown): string => {
  if (typeof input !== "string") {
    return "";
  }

  return input.trim();
};

export async function POST(request: Request) {
  const identity = await getCurrentClerkIdentity();

  if (!identity.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await parseJsonBody(request)) as DesignRequestBody | null;
  const prompt = normalizeText(body?.prompt);
  const roomId = normalizeText(body?.roomId);
  const projectId = normalizeText(body?.projectId);

  if (!prompt || !roomId || !projectId) {
    return NextResponse.json(
      { error: "Missing prompt, roomId, or projectId" },
      { status: 400 },
    );
  }

  const project = await getProjectByAccess(projectId, identity);

  if (!project) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const run = await tasks.trigger<typeof designAgent>("design-agent", {
    prompt,
    roomId,
    projectId: project.id,
  });

  await prisma.taskRun.create({
    data: {
      runId: run.id,
      projectId: project.id,
      userId: identity.userId,
    },
  });

  return NextResponse.json({ runId: run.id }, { status: 201 });
}