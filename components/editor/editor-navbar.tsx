"use client";

import type { ReactNode } from "react";
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Share2,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
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
  rightSlot,
  className,
}: EditorNavbarProps) {
  const SidebarIcon = isSidebarOpen ? PanelLeftClose : PanelLeftOpen;
  const AiIcon = isAiSidebarOpen ? PanelRightClose : PanelRightOpen;

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
        {rightSlot}
        <UserButton />
      </div>
    </header>
  );
}
