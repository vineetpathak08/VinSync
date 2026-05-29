import { auth } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";

interface RenameProjectBody {
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

const getProject = async (projectId: string) => {
  if (!projectId) {
    return null;
  }

  return prisma.project.findUnique({ where: { id: projectId } });
};

const ensureOwner = (ownerId: string, userId: string) => ownerId === userId;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await parseJsonBody(request)) as RenameProjectBody | null;
  const name = normalizeProjectName(body?.name);

  if (!name) {
    return NextResponse.json(
      { error: "Invalid project name" },
      { status: 400 },
    );
  }

  const project = await getProject(projectId);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (!ensureOwner(project.ownerId, userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updatedProject = await prisma.project.update({
    where: { id: project.id },
    data: { name },
  });

  return NextResponse.json({ project: updatedProject });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await getProject(projectId);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (!ensureOwner(project.ownerId, userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.project.delete({ where: { id: project.id } });

  return NextResponse.json({ deleted: true });
}
