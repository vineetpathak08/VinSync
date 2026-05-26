"use client"

import { Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

interface ProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
  onNewProject?: () => void
  className?: string
}

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
  onNewProject,
  className,
}: ProjectSidebarProps) {
  return (
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
          <EmptyProjectState />
        </TabsContent>
        <TabsContent value="shared" className="mt-3 min-h-0">
          <EmptyProjectState />
        </TabsContent>
      </Tabs>

      <Button
        type="button"
        className="mt-4 w-full"
        onClick={onNewProject}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        New Project
      </Button>
    </aside>
  )
}
