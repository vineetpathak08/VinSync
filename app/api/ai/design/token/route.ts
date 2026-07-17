import { auth as clerkAuth } from "@clerk/nextjs/server";
import { auth as triggerAuth } from "@trigger.dev/sdk/v3";
import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";

interface TokenRequestBody {
  runId?: unknown;
}

const parseJsonBody = async (request: Request): Promise<unknown | null> => {
  try {
    return await request.json();
  } catch {
    return null;
  }
};

const normalizeRunId = (input: unknown): string => {
  if (typeof input !== "string") {
    return "";
  }

  return input.trim();
};

export async function POST(request: NextRequest) {
  const { userId } = await clerkAuth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await parseJsonBody(request)) as TokenRequestBody | null;
  const runId = normalizeRunId(body?.runId);

  if (!runId) {
    return NextResponse.json({ error: "Missing runId" }, { status: 400 });
  }

  const taskRun = await prisma.taskRun.findUnique({
    where: { runId },
  });

  if (!taskRun) {
    return NextResponse.json({ error: "Task run not found" }, { status: 404 });
  }

  if (taskRun.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const publicToken = await triggerAuth.createPublicToken({
    scopes: {
      read: {
        runs: [runId],
      },
    },
  });

  return NextResponse.json({ token: publicToken });
}