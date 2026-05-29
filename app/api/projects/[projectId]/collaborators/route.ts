import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { Prisma } from "@/app/generated/prisma/client";
import type { ProjectGetPayload } from "@/app/generated/prisma/models/Project";
import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";

interface CollaboratorListItem {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface InviteBody {
  email?: string;
}

const projectCollaboratorsSelect = {
  id: true,
  ownerId: true,
  collaborators: {
    orderBy: { createdAt: "asc" },
    select: { id: true, collaboratorEmail: true },
  },
} as const satisfies Prisma.ProjectSelect;

type ProjectCollaboratorsResult = ProjectGetPayload<{
  select: typeof projectCollaboratorsSelect;
}>;

const parseJsonBody = async (request: Request): Promise<unknown | null> => {
  try {
    return await request.json();
  } catch {
    return null;
  }
};

const normalizeEmail = (input: unknown): string => {
  if (typeof input !== "string") {
    return "";
  }

  return input.trim().toLowerCase();
};

const normalizeEmailString = (input: string): string =>
  input.trim().toLowerCase();

const getPrimaryEmail = (user: Awaited<ReturnType<typeof currentUser>>) =>
  user?.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId,
  )?.emailAddress ??
  user?.emailAddresses[0]?.emailAddress ??
  null;

const getClerkProfileMap = async (emails: string[]) => {
  const uniqueEmails = Array.from(
    new Set(emails.map((email) => normalizeEmailString(email))),
  ).filter(Boolean);

  if (uniqueEmails.length === 0) {
    return new Map<string, { displayName: string | null; avatarUrl: string | null }>();
  }

  const client = await clerkClient();
  const users = await client.users.getUserList({
    emailAddress: uniqueEmails,
    limit: uniqueEmails.length,
  });

  const profileMap = new Map<
    string,
    { displayName: string | null; avatarUrl: string | null }
  >();

  for (const user of users.data) {
    const primaryEmail = getPrimaryEmail(user);

    if (!primaryEmail) {
      continue;
    }

    const fallbackName = [user.firstName, user.lastName]
      .filter(Boolean)
      .join(" ");
    const displayName = user.fullName || fallbackName || user.username || null;

    profileMap.set(normalizeEmailString(primaryEmail), {
      displayName,
      avatarUrl: user.imageUrl ?? null,
    });
  }

  return profileMap;
};

const formatCollaborators = async (
  entries: { id: string; collaboratorEmail: string }[],
): Promise<CollaboratorListItem[]> => {
  const emails = entries.map((entry) => entry.collaboratorEmail);
  const profileMap = await getClerkProfileMap(emails);

  return entries.map((entry) => {
    const normalized = normalizeEmailString(entry.collaboratorEmail);
    const profile = profileMap.get(normalized);

    return {
      id: entry.id,
      email: entry.collaboratorEmail,
      displayName: profile?.displayName ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
    };
  });
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await currentUser();
  const userEmails =
    user?.emailAddresses.map((email) => email.emailAddress) ?? [];
  const normalizedEmails = userEmails.map((email) =>
    normalizeEmailString(email),
  );

  const project: ProjectCollaboratorsResult | null =
    await prisma.project.findUnique({
    where: { id: projectId },
    select: projectCollaboratorsSelect,
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const isOwner = project.ownerId === userId;
  const hasAccess =
    isOwner ||
    project.collaborators.some((collaborator) =>
      normalizedEmails.includes(
        normalizeEmailString(collaborator.collaboratorEmail),
      ),
    );

  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const collaborators = await formatCollaborators(project.collaborators);

  return NextResponse.json({ collaborators, isOwner });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, ownerId: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.ownerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await parseJsonBody(request)) as InviteBody | null;
  const email = normalizeEmail(body?.email);

  if (!email) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const user = await currentUser();
  const ownerEmail = getPrimaryEmail(user);

  if (ownerEmail && normalizeEmailString(ownerEmail) === email) {
    return NextResponse.json(
      { error: "Owner already has access" },
      { status: 400 },
    );
  }

  try {
    const collaborator = await prisma.projectCollaborator.create({
      data: {
        projectId: project.id,
        collaboratorEmail: email,
      },
    });

    return NextResponse.json({ collaborator }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Collaborator already added" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Unable to invite collaborator" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, ownerId: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.ownerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await parseJsonBody(request)) as InviteBody | null;
  const email = normalizeEmail(body?.email);

  if (!email) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  try {
    await prisma.projectCollaborator.delete({
      where: {
        projectId_collaboratorEmail: {
          projectId: project.id,
          collaboratorEmail: email,
        },
      },
    });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Collaborator not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Unable to remove collaborator" },
      { status: 500 },
    );
  }
}
