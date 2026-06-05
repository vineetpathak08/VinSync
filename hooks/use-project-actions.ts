"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import type { ProjectSummary } from "@/types/project";

type DialogType = "create" | "rename" | "delete" | null;

type CreateIntent = "scratch" | "template";

type CreateStage = "choose" | "form";

interface DialogState {
  type: DialogType;
  project: ProjectSummary | null;
}

const toSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const createShortSuffix = () => {
  const values = new Uint32Array(1);
  globalThis.crypto.getRandomValues(values);
  return values[0].toString(36).slice(0, 5).padStart(5, "0");
};

export function useProjectActions() {
  const router = useRouter();
  const pathname = usePathname();
  const [dialogState, setDialogState] = useState<DialogState>({
    type: null,
    project: null,
  });
  const [createName, setCreateName] = useState("");
  const [renameName, setRenameName] = useState("");
  const [createSuffix, setCreateSuffix] = useState("");
  const [createIntent, setCreateIntent] = useState<CreateIntent>("scratch");
  const [createStage, setCreateStage] = useState<CreateStage>("choose");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createSlug = useMemo(() => toSlug(createName), [createName]);
  const roomIdPreview = useMemo(() => {
    const base = createSlug || "new-project";
    const suffix = createSuffix || "00000";
    return `${base}-${suffix}`;
  }, [createSlug, createSuffix]);

  const activeProjectId = useMemo(() => {
    if (!pathname?.startsWith("/editor/")) {
      return null;
    }

    const [, , projectId] = pathname.split("/");
    return projectId || null;
  }, [pathname]);

  const closeDialog = useCallback(() => {
    setDialogState({ type: null, project: null });
    setIsSubmitting(false);
    setCreateIntent("scratch");
    setCreateStage("choose");
  }, []);

  const openCreate = useCallback(() => {
    setDialogState({ type: "create", project: null });
    setCreateName("");
    setRenameName("");
    setCreateSuffix(createShortSuffix());
    setCreateIntent("scratch");
    setCreateStage("choose");
    setIsSubmitting(false);
  }, []);

  const chooseCreateIntent = useCallback((intent: CreateIntent) => {
    setCreateIntent(intent);
    setCreateStage("form");
    setCreateName("");
    setCreateSuffix(createShortSuffix());
    setIsSubmitting(false);
  }, []);

  const backToCreateChoice = useCallback(() => {
    setCreateStage("choose");
    setCreateIntent("scratch");
    setCreateName("");
    setCreateSuffix(createShortSuffix());
    setIsSubmitting(false);
  }, []);

  const openRename = useCallback((project: ProjectSummary) => {
    setDialogState({ type: "rename", project });
    setRenameName(project.name);
    setIsSubmitting(false);
  }, []);

  const openDelete = useCallback((project: ProjectSummary) => {
    setDialogState({ type: "delete", project });
    setIsSubmitting(false);
  }, []);

  const handleCreateSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmedName = createName.trim();

      if (!trimmedName) {
        return;
      }

      const base = createSlug || "new-project";
      const suffix = createSuffix || createShortSuffix();
      const roomId = `${base}-${suffix}`;

      setIsSubmitting(true);
      setCreateSuffix(suffix);

      try {
        const response = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmedName, roomId }),
        });

        if (!response.ok) {
          setIsSubmitting(false);
          return;
        }

        const data = (await response.json()) as { project?: { id: string } };
        const projectId = data.project?.id ?? roomId;
        closeDialog();
        router.push(
          createIntent === "template"
            ? `/editor/${projectId}?templates=1`
            : `/editor/${projectId}`,
        );
      } catch {
        setIsSubmitting(false);
      }
    },
    [closeDialog, createIntent, createName, createSlug, createSuffix, router],
  );

  const handleRenameSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmedName = renameName.trim();
      const project = dialogState.project;

      if (!project || !trimmedName) {
        return;
      }

      setIsSubmitting(true);

      try {
        const response = await fetch(`/api/projects/${project.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmedName }),
        });

        if (!response.ok) {
          setIsSubmitting(false);
          return;
        }

        closeDialog();
        router.refresh();
      } catch {
        setIsSubmitting(false);
      }
    },
    [closeDialog, dialogState.project, renameName, router],
  );

  const handleDeleteConfirm = useCallback(async () => {
    const project = dialogState.project;

    if (!project) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setIsSubmitting(false);
        return;
      }

      closeDialog();

      if (activeProjectId === project.id) {
        router.push("/editor");
      } else {
        router.refresh();
      }
    } catch {
      setIsSubmitting(false);
    }
  }, [activeProjectId, closeDialog, dialogState.project, router]);

  return {
    dialogState,
    createName,
    setCreateName,
    createIntent,
    createStage,
    chooseCreateIntent,
    backToCreateChoice,
    renameName,
    setRenameName,
    createSlug,
    roomIdPreview,
    isSubmitting,
    closeDialog,
    openCreate,
    openRename,
    openDelete,
    handleCreateSubmit,
    handleRenameSubmit,
    handleDeleteConfirm,
  };
}
