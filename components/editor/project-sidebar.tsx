"use client"

import { Pencil, Plus, Trash2, X } from "lucide-react"

import { useProjectDialogActions, type ProjectSummary } from "@/components/editor/use-project-dialogs"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

interface ProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

const mockOwnedProjects: ProjectSummary[] = [
  {
    id: "project-01",
    name: "Core Platform Refresh",
    slug: "core-platform-refresh",
    isOwner: true,
  },
  {
    id: "project-02",
    name: "Realtime Observability",
    slug: "realtime-observability",
    isOwner: true,
  },
]

const mockSharedProjects: ProjectSummary[] = [
  {
    id: "project-03",
    name: "Billing Workflow",
    slug: "billing-workflow",
    isOwner: false,
  },
]

function EmptyProjectState() {
  return (
    <div className="flex h-full min-h-48 items-center justify-center rounded-2xl border border-dashed border-surface-border-subtle bg-elevated/60 px-6 text-center">
      <p className="text-sm text-copy-muted">No projects to show yet.</p>
    </div>
  )
}

export function ProjectSidebar({
  isOpen,
  onClose,
  className,
}: ProjectSidebarProps) {
  const { openCreate, openRename, openDelete } = useProjectDialogActions()
  const ownedProjects = mockOwnedProjects
  const sharedProjects = mockSharedProjects

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label="Close project sidebar"
          className="fixed inset-0 z-30 bg-base/70 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      ) : null}
      <aside
        aria-label="Projects"
        aria-hidden={!isOpen}
        className={cn(
          "fixed bottom-4 left-4 top-16 z-40 flex w-[min(20rem,calc(100vw-2rem))] flex-col rounded-2xl border border-sidebar-border bg-sidebar p-4 shadow-2xl backdrop-blur transition-transform duration-200 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-[calc(100%+2rem)] pointer-events-none",
          className
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="truncate text-sm font-semibold text-copy-primary">
            Projects
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Close project sidebar"
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <Tabs defaultValue="my-projects" className="min-h-0 flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-projects">My Projects</TabsTrigger>
            <TabsTrigger value="shared">Shared</TabsTrigger>
          </TabsList>
          <TabsContent value="my-projects" className="mt-3 min-h-0">
            {ownedProjects.length === 0 ? (
              <EmptyProjectState />
            ) : (
              <div className="grid gap-2">
                {ownedProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-surface-border bg-surface/60 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-copy-primary">
                        {project.name}
                      </p>
                      <p className="text-xs text-copy-muted">/{project.slug}</p>
                    </div>
                    {project.isOwner ? (
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Rename ${project.name}`}
                          onClick={() => openRename(project)}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Delete ${project.name}`}
                          onClick={() => openDelete(project)}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="shared" className="mt-3 min-h-0">
            {sharedProjects.length === 0 ? (
              <EmptyProjectState />
            ) : (
              <div className="grid gap-2">
                {sharedProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-surface-border bg-surface/60 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-copy-primary">
                        {project.name}
                      </p>
                      <p className="text-xs text-copy-muted">/{project.slug}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Button type="button" className="mt-4 w-full" onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Project
        </Button>
      </aside>
    </>
  )
}
