import "server-only"

import { auth, currentUser } from "@clerk/nextjs/server"

import { prisma } from "@/lib/prisma"
import type { Project } from "@/app/generated/prisma/client"
import type { ProjectSummary } from "@/types/project"

interface ProjectSidebarData {
  ownedProjects: ProjectSummary[]
  sharedProjects: ProjectSummary[]
}

type ProjectSummarySource = Pick<Project, "id" | "name">

const toProjectSummary = (
  project: ProjectSummarySource,
  isOwner: boolean
): ProjectSummary => ({
  id: project.id,
  name: project.name,
  slug: project.id,
  isOwner,
})

export async function getProjectSidebarData(): Promise<ProjectSidebarData> {
  const { userId } = await auth()

  if (!userId) {
    return { ownedProjects: [], sharedProjects: [] }
  }

  const user = await currentUser()
  const emails = user?.emailAddresses.map((email) => email.emailAddress) ?? []

  const ownedProjects = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  })

  if (emails.length === 0) {
    return {
      ownedProjects: ownedProjects.map((project: ProjectSummarySource) =>
        toProjectSummary(project, true)
      ),
      sharedProjects: [],
    }
  }

  const sharedProjects = await prisma.project.findMany({
    where: {
      ownerId: { not: userId },
      collaborators: {
        some: {
          collaboratorEmail: { in: emails },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return {
    ownedProjects: ownedProjects.map((project: ProjectSummarySource) =>
      toProjectSummary(project, true)
    ),
    sharedProjects: sharedProjects.map((project: ProjectSummarySource) =>
      toProjectSummary(project, false)
    ),
  }
}
