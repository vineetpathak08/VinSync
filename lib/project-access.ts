import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import type { Project } from "@/app/generated/prisma/client";

export interface ClerkIdentity {
  userId: string | null;
  primaryEmail: string | null;
}

export async function getCurrentClerkIdentity(): Promise<ClerkIdentity> {
  const { userId } = await auth();

  if (!userId) {
    return { userId: null, primaryEmail: null };
  }

  const user = await currentUser();
  const primaryEmail =
    user?.emailAddresses.find(
      (email) => email.id === user.primaryEmailAddressId,
    )?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress ??
    null;

  return { userId, primaryEmail };
}

type ProjectAccessInfo = Pick<Project, "id" | "name">;

export async function getProjectByAccess(
  projectId: string,
  identity: ClerkIdentity,
): Promise<ProjectAccessInfo | null> {
  if (!identity.userId) {
    return null;
  }

  const collaboratorFilter = identity.primaryEmail
    ? {
        collaborators: {
          some: {
            collaboratorEmail: identity.primaryEmail,
          },
        },
      }
    : null;

  return prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: identity.userId },
        ...(collaboratorFilter ? [collaboratorFilter] : []),
      ],
    },
    select: { id: true, name: true },
  });
}
