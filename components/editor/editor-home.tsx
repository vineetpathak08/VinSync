"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useProjectDialogActions } from "@/components/editor/use-project-dialogs";

export function EditorHome() {
  const { openCreate } = useProjectDialogActions();

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] w-full items-center justify-center bg-base px-6">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="grid gap-2">
          <h1 className="text-2xl font-semibold text-copy-primary">
            Create a project or open an existing one
          </h1>
          <p className="text-sm text-copy-muted">
            Start a new architecture workspace, or choose a project from the
            sidebar.
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Project
        </Button>
      </div>
    </div>
  );
}
