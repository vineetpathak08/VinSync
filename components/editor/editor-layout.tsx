"use client"

import type { ReactNode } from "react"
import { useState } from "react"

import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { cn } from "@/lib/utils"

interface EditorLayoutProps {
  children: ReactNode
  className?: string
}

export function EditorLayout({ children, className }: EditorLayoutProps) {
  const [isProjectSidebarOpen, setIsProjectSidebarOpen] = useState(false)

  return (
    <div className={cn("flex min-h-screen flex-col bg-base", className)}>
      <EditorNavbar
        isSidebarOpen={isProjectSidebarOpen}
        onSidebarToggle={() => setIsProjectSidebarOpen((isOpen) => !isOpen)}
        centerSlot={<span>VinSync</span>}
      />
      <ProjectSidebar
        isOpen={isProjectSidebarOpen}
        onClose={() => setIsProjectSidebarOpen(false)}
      />
      <main className="relative min-h-0 flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
