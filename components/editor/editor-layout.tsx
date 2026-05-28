"use client"

import type { ReactNode } from "react"
import { useState } from "react"

import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { ProjectDialogProvider } from "@/components/editor/use-project-dialogs"
import { cn } from "@/lib/utils"
import type { ProjectSummary } from "@/types/project"

interface EditorLayoutProps {
  children: ReactNode
  ownedProjects: ProjectSummary[]
  sharedProjects: ProjectSummary[]
  className?: string
}

export function EditorLayout({
  children,
  ownedProjects,
  sharedProjects,
  className,
}: EditorLayoutProps) {
  const [isProjectSidebarOpen, setIsProjectSidebarOpen] = useState(false)

  return (
    <ProjectDialogProvider>
      <div className={cn("flex min-h-screen flex-col bg-base", className)}>
        <EditorNavbar
          isSidebarOpen={isProjectSidebarOpen}
          onSidebarToggle={() => setIsProjectSidebarOpen((isOpen) => !isOpen)}
          centerSlot={<span>VinSync</span>}
        />
        <ProjectSidebar
          isOpen={isProjectSidebarOpen}
          onClose={() => setIsProjectSidebarOpen(false)}
          ownedProjects={ownedProjects}
          sharedProjects={sharedProjects}
        />
        <main className="relative min-h-0 flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </ProjectDialogProvider>
  )
}
