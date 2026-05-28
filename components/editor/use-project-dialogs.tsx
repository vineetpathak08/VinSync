"use client"

import type { ReactNode } from "react"
import { createContext, useContext, useMemo } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { EditorDialogPattern } from "@/components/editor/editor-dialog-pattern"
import { useProjectActions } from "@/hooks/use-project-actions"
import type { ProjectSummary } from "@/types/project"

interface ProjectDialogActions {
  openCreate: () => void
  openRename: (project: ProjectSummary) => void
  openDelete: (project: ProjectSummary) => void
}

const ProjectDialogContext = createContext<ProjectDialogActions | null>(null)

function ProjectDialogs({
  dialogState,
  createName,
  setCreateName,
  renameName,
  setRenameName,
  roomIdPreview,
  isSubmitting,
  closeDialog,
  handleCreateSubmit,
  handleRenameSubmit,
  handleDeleteConfirm,
}: ReturnType<typeof useProjectActions>) {
  const projectName = dialogState.project?.name

  return (
    <>
      <Dialog
        open={dialogState.type === "create"}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog()
          }
        }}
      >
        <DialogContent className="max-w-md border-0 bg-transparent p-0 shadow-none ring-0">
          <DialogTitle className="sr-only">Create project</DialogTitle>
          <DialogDescription className="sr-only">
            Start a new architecture workspace.
          </DialogDescription>
          <EditorDialogPattern
            title="Create project"
            description="Start a new architecture workspace."
            footer={
              <>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={closeDialog}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" form="create-project" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Project"}
                </Button>
              </>
            }
          >
            <form
              id="create-project"
              className="grid gap-4"
              onSubmit={handleCreateSubmit}
            >
              <div className="grid gap-2">
                <label
                  className="text-xs font-medium uppercase tracking-wide text-copy-faint"
                  htmlFor="project-name"
                >
                  Project name
                </label>
                <Input
                  id="project-name"
                  placeholder="Architecture workspace"
                  value={createName}
                  onChange={(event) => setCreateName(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-copy-faint">
                  Room ID
                </p>
                <div className="rounded-xl border border-surface-border bg-subtle/70 px-3 py-2 text-xs text-copy-muted">
                  <span className="text-copy-primary">{roomIdPreview}</span>
                </div>
              </div>
            </form>
          </EditorDialogPattern>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogState.type === "rename"}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog()
          }
        }}
      >
        <DialogContent className="max-w-md border-0 bg-transparent p-0 shadow-none ring-0">
          <DialogTitle className="sr-only">Rename project</DialogTitle>
          <DialogDescription className="sr-only">
            {projectName ? `Current name: ${projectName}` : "Update the project name."}
          </DialogDescription>
          <EditorDialogPattern
            title="Rename project"
            description={
              projectName ? `Current name: ${projectName}` : "Update the project name."
            }
            footer={
              <>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={closeDialog}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" form="rename-project" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </>
            }
          >
            <form
              id="rename-project"
              className="grid gap-4"
              onSubmit={handleRenameSubmit}
            >
              <div className="grid gap-2">
                <label
                  className="text-xs font-medium uppercase tracking-wide text-copy-faint"
                  htmlFor="rename-project-name"
                >
                  Project name
                </label>
                <Input
                  id="rename-project-name"
                  value={renameName}
                  onChange={(event) => setRenameName(event.target.value)}
                  autoFocus
                />
              </div>
            </form>
          </EditorDialogPattern>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogState.type === "delete"}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog()
          }
        }}
      >
        <DialogContent className="max-w-md border-0 bg-transparent p-0 shadow-none ring-0">
          <DialogTitle className="sr-only">Delete project</DialogTitle>
          <DialogDescription className="sr-only">
            {projectName
              ? `This will permanently delete ${projectName}.`
              : "This action cannot be undone."}
          </DialogDescription>
          <EditorDialogPattern
            title="Delete project"
            description={
              projectName
                ? `This will permanently delete ${projectName}.`
                : "This action cannot be undone."
            }
            footer={
              <>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={closeDialog}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Deleting..." : "Delete Project"}
                </Button>
              </>
            }
          >
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-copy-secondary">
              This action cannot be undone.
            </div>
          </EditorDialogPattern>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function ProjectDialogProvider({ children }: { children: ReactNode }) {
  const dialogState = useProjectActions()
  const actions = useMemo(
    () => ({
      openCreate: dialogState.openCreate,
      openRename: dialogState.openRename,
      openDelete: dialogState.openDelete,
    }),
    [dialogState.openCreate, dialogState.openDelete, dialogState.openRename]
  )

  return (
    <ProjectDialogContext.Provider value={actions}>
      {children}
      <ProjectDialogs {...dialogState} />
    </ProjectDialogContext.Provider>
  )
}

export function useProjectDialogActions() {
  const context = useContext(ProjectDialogContext)

  if (!context) {
    throw new Error("useProjectDialogActions must be used within ProjectDialogProvider")
  }

  return context
}
