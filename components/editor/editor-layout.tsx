"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ShareDialog } from "@/components/editor/share-dialog";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { ProjectDialogProvider } from "@/components/editor/use-project-dialogs";
import { cn } from "@/lib/utils";
import type { ProjectSummary } from "@/types/project";

interface EditorLayoutProps {
  children: ReactNode;
  ownedProjects: ProjectSummary[];
  sharedProjects: ProjectSummary[];
  navbarTitle?: ReactNode;
  showShareButton?: boolean;
  shareProjectId?: string | null;
  shareProjectName?: string;
  showAiToggle?: boolean;
  rightSidebar?: ReactNode;
  activeProjectId?: string | null;
  className?: string;
}

export function EditorLayout({
  children,
  ownedProjects,
  sharedProjects,
  navbarTitle,
  showShareButton = false,
  shareProjectId,
  shareProjectName,
  showAiToggle = false,
  rightSidebar,
  activeProjectId,
  className,
}: EditorLayoutProps) {
  const [isProjectSidebarOpen, setIsProjectSidebarOpen] = useState(false);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(Boolean(rightSidebar));
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  return (
    <ProjectDialogProvider>
      <div className={cn("flex min-h-screen flex-col bg-base", className)}>
        <EditorNavbar
          isSidebarOpen={isProjectSidebarOpen}
          onSidebarToggle={() => setIsProjectSidebarOpen((isOpen) => !isOpen)}
          title={navbarTitle}
          showShareButton={showShareButton && Boolean(shareProjectId)}
          onShareClick={() => setIsShareDialogOpen(true)}
          showAiToggle={showAiToggle && Boolean(rightSidebar)}
          isAiSidebarOpen={isAiSidebarOpen}
          onAiToggle={
            rightSidebar
              ? () => setIsAiSidebarOpen((isOpen) => !isOpen)
              : undefined
          }
        />
        <ProjectSidebar
          isOpen={isProjectSidebarOpen}
          onClose={() => setIsProjectSidebarOpen(false)}
          ownedProjects={ownedProjects}
          sharedProjects={sharedProjects}
          activeProjectId={activeProjectId}
        />
        <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1">
            <div className="flex min-h-0 min-w-0 flex-1">{children}</div>
            {rightSidebar && isAiSidebarOpen ? (
              <aside className="hidden h-full w-80 shrink-0 flex-col border-l border-surface-border bg-surface px-4 py-5 lg:flex">
                {rightSidebar}
              </aside>
            ) : null}
          </div>
        </main>
        {shareProjectId && shareProjectName ? (
          <ShareDialog
            projectId={shareProjectId}
            projectName={shareProjectName}
            isOpen={isShareDialogOpen}
            onOpenChange={setIsShareDialogOpen}
          />
        ) : null}
      </div>
    </ProjectDialogProvider>
  );
}
