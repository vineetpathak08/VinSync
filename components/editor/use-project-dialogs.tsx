"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EditorDialogPattern } from "@/components/editor/editor-dialog-pattern";
import { useProjectActions } from "@/hooks/use-project-actions";
import type { ProjectSummary } from "@/types/project";
import { ArrowRight, Layout, Sparkles } from "lucide-react";

interface ProjectDialogActions {
  openCreate: () => void;
  openRename: (project: ProjectSummary) => void;
  openDelete: (project: ProjectSummary) => void;
}

const ProjectDialogContext = createContext<ProjectDialogActions | null>(null);

function ProjectDialogs({
  dialogState,
  createName,
  setCreateName,
  createIntent,
  createStage,
  chooseCreateIntent,
  backToCreateChoice,
  renameName,
  setRenameName,
  roomIdPreview,
  isSubmitting,
  closeDialog,
  handleCreateSubmit,
  handleRenameSubmit,
  handleDeleteConfirm,
}: ReturnType<typeof useProjectActions>) {
  const projectName = dialogState.project?.name;
  const createTitle =
    createIntent === "template"
      ? "Create project with a template"
      : "Create project";
  const createDescription =
    createIntent === "template"
      ? "We’ll open the starter template picker as soon as the new workspace is ready."
      : "Start a new architecture workspace.";

  return (
    <>
      <Dialog
        open={dialogState.type === "create"}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog();
          }
        }}
      >
        <DialogContent className="max-w-md border-0 bg-transparent p-0 shadow-none ring-0">
          <DialogTitle className="sr-only">Create project</DialogTitle>
          <DialogDescription className="sr-only">
            Choose whether to start from a blank canvas or an existing starter
            template.
          </DialogDescription>
          <EditorDialogPattern
            title={
              createStage === "choose" ? "Start a new project" : createTitle
            }
            description={
              createStage === "choose"
                ? "Pick a starting point for the new workspace."
                : createDescription
            }
            footer={
              createStage === "choose" ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={closeDialog}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={backToCreateChoice}
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={closeDialog}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    form="create-project"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating..." : "Create Project"}
                  </Button>
                </>
              )
            }
          >
            {createStage === "choose" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className="group grid h-full gap-3 rounded-2xl border border-surface-border bg-surface/70 p-4 text-left transition-colors hover:border-brand hover:bg-accent-dim"
                  onClick={() => chooseCreateIntent("scratch")}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-base/80 text-copy-secondary transition-colors group-hover:text-brand">
                    <Layout className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="grid gap-1">
                    <p className="text-sm font-semibold text-copy-primary">
                      Build from scratch
                    </p>
                    <p className="text-sm leading-5 text-copy-muted">
                      Start with a blank workspace and design the architecture
                      yourself.
                    </p>
                  </div>
                  <div className="mt-auto flex items-center gap-2 text-sm font-medium text-copy-secondary group-hover:text-brand">
                    Continue
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </div>
                </button>

                <button
                  type="button"
                  className="group grid h-full gap-3 rounded-2xl border border-surface-border bg-surface/70 p-4 text-left transition-colors hover:border-brand hover:bg-accent-dim"
                  onClick={() => chooseCreateIntent("template")}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-base/80 text-copy-secondary transition-colors group-hover:text-brand">
                    <Sparkles className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="grid gap-1">
                    <p className="text-sm font-semibold text-copy-primary">
                      Import existing template
                    </p>
                    <p className="text-sm leading-5 text-copy-muted">
                      Create the project first, then pick a starter diagram to
                      load.
                    </p>
                  </div>
                  <div className="mt-auto flex items-center gap-2 text-sm font-medium text-copy-secondary group-hover:text-brand">
                    Choose template
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </div>
                </button>
              </div>
            ) : (
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
                {createIntent === "template" ? (
                  <div className="rounded-2xl border border-brand/20 bg-brand/10 p-3 text-sm text-copy-secondary">
                    The workspace will open the starter template picker after
                    creation.
                  </div>
                ) : null}
              </form>
            )}
          </EditorDialogPattern>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogState.type === "rename"}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog();
          }
        }}
      >
        <DialogContent className="max-w-md border-0 bg-transparent p-0 shadow-none ring-0">
          <DialogTitle className="sr-only">Rename project</DialogTitle>
          <DialogDescription className="sr-only">
            {projectName
              ? `Current name: ${projectName}`
              : "Update the project name."}
          </DialogDescription>
          <EditorDialogPattern
            title="Rename project"
            description={
              projectName
                ? `Current name: ${projectName}`
                : "Update the project name."
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
                  type="submit"
                  form="rename-project"
                  disabled={isSubmitting}
                >
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
            closeDialog();
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
  );
}

export function ProjectDialogProvider({ children }: { children: ReactNode }) {
  const dialogState = useProjectActions();
  const actions = useMemo(
    () => ({
      openCreate: dialogState.openCreate,
      openRename: dialogState.openRename,
      openDelete: dialogState.openDelete,
    }),
    [dialogState.openCreate, dialogState.openDelete, dialogState.openRename],
  );

  return (
    <ProjectDialogContext.Provider value={actions}>
      {children}
      <ProjectDialogs {...dialogState} />
    </ProjectDialogContext.Provider>
  );
}

export function useProjectDialogActions() {
  const context = useContext(ProjectDialogContext);

  if (!context) {
    throw new Error(
      "useProjectDialogActions must be used within ProjectDialogProvider",
    );
  }

  return context;
}
