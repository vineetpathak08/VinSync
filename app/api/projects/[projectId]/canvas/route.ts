import { get, put } from "@vercel/blob";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

import { normalizeCanvasSnapshot } from "@/lib/canvas-storage";
import { prisma } from "@/lib/prisma";

interface CanvasRouteParams {
  params: Promise<{ projectId: string }>;
}

interface ProjectAccessInfo {
  id: string;
  canvasJsonPath: string | null;
}

const blobReadWriteToken = process.env.BLOB_READ_WRITE_TOKEN;

const getPrimaryEmail = async (): Promise<string | null> => {
  const user = await currentUser();

  return (
    user?.emailAddresses.find(
      (email) => email.id === user.primaryEmailAddressId,
    )?.emailAddress ?? user?.emailAddresses[0]?.emailAddress ?? null
  );
};

const getAccessibleProject = async (
  projectId: string,
  userId: string,
  primaryEmail: string | null,
): Promise<ProjectAccessInfo | null> =>
  prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: userId },
        ...(primaryEmail
          ? [
              {
                collaborators: {
                  some: {
                    collaboratorEmail: primaryEmail,
                  },
                },
              },
            ]
          : []),
      ],
    },
    select: {
      id: true,
      canvasJsonPath: true,
    },
  });

export async function PUT(request: NextRequest, { params }: CanvasRouteParams) {
  const { projectId } = await params;
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const primaryEmail = await getPrimaryEmail();
  const project = await getAccessibleProject(projectId, userId, primaryEmail);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (!blobReadWriteToken) {
    return NextResponse.json(
      { error: "Blob storage is not configured" },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => null);
  const canvas = normalizeCanvasSnapshot(body);

  if (!canvas) {
    return NextResponse.json({ error: "Invalid canvas payload" }, { status: 400 });
  }

  const blob = await put(`canvas/${project.id}.json`, JSON.stringify(canvas), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json; charset=utf-8",
    token: blobReadWriteToken,
  });

  const updatedProject = await prisma.project.update({
    where: { id: project.id },
    data: {
      canvasJsonPath: blob.pathname,
    },
    select: {
      canvasJsonPath: true,
    },
  });

  return NextResponse.json({
    canvas,
    canvasJsonPath: updatedProject.canvasJsonPath,
  });
}

export async function GET(_request: NextRequest, { params }: CanvasRouteParams) {
  const { projectId } = await params;
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const primaryEmail = await getPrimaryEmail();
  const project = await getAccessibleProject(projectId, userId, primaryEmail);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (!project.canvasJsonPath) {
    return NextResponse.json(
      { error: "Saved canvas not found" },
      { status: 404 },
    );
  }

  const blob = await get(project.canvasJsonPath, {
    access: "private",
    token: blobReadWriteToken,
  }).catch(() => null);

  if (!blob || blob.statusCode !== 200) {
    return NextResponse.json(
      { error: "Saved canvas blob could not be loaded" },
      { status: 502 },
    );
  }

  const canvas = normalizeCanvasSnapshot(
    await new Response(blob.stream).json().catch(() => null),
  );

  if (!canvas) {
    return NextResponse.json(
      { error: "Saved canvas blob is invalid" },
      { status: 502 },
    );
  }

  return NextResponse.json({
    canvas,
    canvasJsonPath: project.canvasJsonPath,
  });
}