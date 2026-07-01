"use client";

import type { ComponentType, ReactNode } from "react";
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Share2,
  Layout,
  Check,
  Clock3,
  CloudOff,
  Loader2,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import {
  useEditorSaveStatus,
  type CanvasSaveStatus,
} from "@/components/editor/editor-save-status";
import { cn } from "@/lib/utils";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onSidebarToggle: () => void;
  title?: ReactNode;
  showShareButton?: boolean;
  onShareClick?: () => void;
  showAiToggle?: boolean;
  isAiSidebarOpen?: boolean;
  onAiToggle?: () => void;
  showTemplatesButton?: boolean;
  onTemplatesClick?: () => void;
  rightSlot?: ReactNode;
  className?: string;
}

export function EditorNavbar({
  isSidebarOpen,
  onSidebarToggle,
  title,
  showShareButton = false,
  onShareClick,
  showAiToggle = false,
  isAiSidebarOpen = false,
  onAiToggle,
  showTemplatesButton = false,
  onTemplatesClick,
  rightSlot,
  className,
}: EditorNavbarProps) {
  const SidebarIcon = isSidebarOpen ? PanelLeftClose : PanelLeftOpen;
  const AiIcon = isAiSidebarOpen ? PanelRightClose : PanelRightOpen;
  const { saveStatus } = useEditorSaveStatus();

  const saveLabelMap: Record<CanvasSaveStatus, string> = {
    idle: "Ready",
    saving: "Saving",
    saved: "Saved",
    error: "Error",
  };

  const saveIconMap: Record<CanvasSaveStatus, ComponentType<{ className?: string }>> = {
    idle: Clock3,
    saving: Loader2,
    saved: Check,
    error: CloudOff,
  };

  const SaveIcon = saveIconMap[saveStatus];

  return (
    <header
      className={cn(
        "grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-surface-border bg-surface px-4",
        className,
      )}
    >
      <div className="flex min-w-0 items-center">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={
            isSidebarOpen ? "Close project sidebar" : "Open project sidebar"
          }
          aria-pressed={isSidebarOpen}
          onClick={onSidebarToggle}
        >
          <SidebarIcon className="h-5 w-5" aria-hidden="true" />
        </Button>
      </div>

      <div className="min-w-0 text-sm font-medium text-copy-secondary">
        {title}
      </div>

      <div className="flex min-w-0 items-center justify-end gap-2">
        {showShareButton ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Share project"
            aria-haspopup="dialog"
            onClick={onShareClick}
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        ) : null}
        {showAiToggle && onAiToggle ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={
              isAiSidebarOpen ? "Close AI sidebar" : "Open AI sidebar"
            }
            aria-pressed={isAiSidebarOpen}
            onClick={onAiToggle}
          >
            <AiIcon className="h-5 w-5" aria-hidden="true" />
          </Button>
        ) : null}
        {showTemplatesButton && onTemplatesClick ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Starter templates"
            onClick={onTemplatesClick}
            className="gap-2 px-3"
          >
            <Layout className="h-4 w-4" aria-hidden="true" />
            <span>Templates</span>
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={`Canvas save status: ${saveLabelMap[saveStatus]}`}
          className="gap-2 px-3"
        >
          <SaveIcon
            className={cn(
              "h-4 w-4",
              saveStatus === "saving" && "animate-spin",
              saveStatus === "saved" && "text-state-success",
              saveStatus === "error" && "text-state-error",
              saveStatus === "idle" && "text-copy-muted",
            )}
            aria-hidden="true"
          />
          <span>Save</span>
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.18em]",
              saveStatus === "saving" &&
                "border-brand/40 bg-accent-dim text-brand",
              saveStatus === "saved" &&
                "border-state-success/40 bg-state-success/10 text-state-success",
              saveStatus === "error" &&
                "border-state-error/40 bg-state-error/10 text-state-error",
              saveStatus === "idle" &&
                "border-surface-border bg-surface text-copy-muted",
            )}
          >
            {saveLabelMap[saveStatus]}
          </span>
        </Button>
        {rightSlot}
        <UserButton />
      </div>
    </header>
  );
}
