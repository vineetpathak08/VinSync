import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

interface CreateProjectBody {
  name?: string;
}

const parseJsonBody = async (request: Request): Promise<unknown | null> => {
  try {
    return await request.json();
  } catch {
    return null;
  }
};

const normalizeProjectName = (input: unknown): string => {
  if (typeof input !== "string") {
    return "";
  }

  return input.trim();
};

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await parseJsonBody(request)) as CreateProjectBody | null;
  const candidateName = normalizeProjectName(body?.name);
  const name = candidateName || "Untitled Project";

  const project = await prisma.project.create({
    data: {
      ownerId: userId,
      name,
    },
  });

  return NextResponse.json({ project }, { status: 201 });
}
