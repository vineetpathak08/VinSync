"use client";

import Link from "next/link";
import { Pencil, Plus, Trash2, X } from "lucide-react";

import { useProjectDialogActions } from "@/components/editor/use-project-dialogs";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { ProjectSummary } from "@/types/project";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  ownedProjects: ProjectSummary[];
  sharedProjects: ProjectSummary[];
  activeProjectId?: string | null;
  className?: string;
}

function EmptyProjectState() {
  return (
    <div className="flex h-full min-h-48 items-center justify-center rounded-2xl border border-dashed border-surface-border-subtle bg-elevated/60 px-6 text-center">
      <p className="text-sm text-copy-muted">No projects to show yet.</p>
    </div>
  );
}

export function ProjectSidebar({
  isOpen,
  onClose,
  ownedProjects,
  sharedProjects,
  activeProjectId,
  className,
}: ProjectSidebarProps) {
  const { openCreate, openRename, openDelete } = useProjectDialogActions();

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
          isOpen
            ? "translate-x-0"
            : "-translate-x-[calc(100%+2rem)] pointer-events-none",
          className,
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
                {ownedProjects.map((project) => {
                  const isActive = project.id === activeProjectId;

                  return (
                    <div
                      key={project.id}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-xl border px-3 py-2",
                        isActive
                          ? "border-brand bg-accent-dim"
                          : "border-surface-border bg-surface/60",
                      )}
                    >
                      <Link
                        href={`/editor/${project.id}`}
                        className="min-w-0 flex-1"
                        aria-current={isActive ? "page" : undefined}
                      >
                        <p
                          className={cn(
                            "truncate text-sm font-medium",
                            isActive ? "text-brand" : "text-copy-primary",
                          )}
                        >
                          {project.name}
                        </p>
                        <p
                          className={cn(
                            "text-xs",
                            isActive
                              ? "text-copy-secondary"
                              : "text-copy-muted",
                          )}
                        >
                          /{project.slug}
                        </p>
                      </Link>
                      {project.isOwner ? (
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            aria-label={`Rename ${project.name}`}
                            onClick={() => openRename(project)}
                          >
                            <Pencil
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            aria-label={`Delete ${project.name}`}
                            onClick={() => openDelete(project)}
                          >
                            <Trash2
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
          <TabsContent value="shared" className="mt-3 min-h-0">
            {sharedProjects.length === 0 ? (
              <EmptyProjectState />
            ) : (
              <div className="grid gap-2">
                {sharedProjects.map((project) => {
                  const isActive = project.id === activeProjectId;

                  return (
                    <div
                      key={project.id}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-xl border px-3 py-2",
                        isActive
                          ? "border-brand bg-accent-dim"
                          : "border-surface-border bg-surface/60",
                      )}
                    >
                      <Link
                        href={`/editor/${project.id}`}
                        className="min-w-0 flex-1"
                        aria-current={isActive ? "page" : undefined}
                      >
                        <p
                          className={cn(
                            "truncate text-sm font-medium",
                            isActive ? "text-brand" : "text-copy-primary",
                          )}
                        >
                          {project.name}
                        </p>
                        <p
                          className={cn(
                            "text-xs",
                            isActive
                              ? "text-copy-secondary"
                              : "text-copy-muted",
                          )}
                        >
                          /{project.slug}
                        </p>
                      </Link>
                    </div>
                  );
                })}
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
  );
}
