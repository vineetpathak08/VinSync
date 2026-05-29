"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, MailPlus, UserMinus } from "lucide-react";

import { EditorDialogPattern } from "@/components/editor/editor-dialog-pattern";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useShareActions } from "@/hooks/use-share-actions";

interface ShareDialogProps {
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const toInitial = (value: string) =>
  value.trim().charAt(0).toUpperCase() || "?";

export function ShareDialog({
  projectId,
  projectName,
  isOpen,
  onOpenChange,
}: ShareDialogProps) {
  const {
    collaborators,
    isOwner,
    isLoading,
    inviteEmail,
    setInviteEmail,
    isInviting,
    removingEmail,
    error,
    canInvite,
    handleInvite,
    handleRemove,
  } = useShareActions(projectId, isOpen);
  const [projectLink, setProjectLink] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    setProjectLink(`${window.location.origin}/editor/${projectId}`);
  }, [isOpen, projectId]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    if (!projectLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(projectLink);
      setIsCopied(true);

      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }

      copyTimeoutRef.current = setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch {
      setIsCopied(false);
    }
  };

  const collaboratorCount = useMemo(
    () => collaborators.length,
    [collaborators],
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl border-0 bg-transparent p-0 shadow-none ring-0">
        <DialogTitle className="sr-only">Share project</DialogTitle>
        <DialogDescription className="sr-only">
          Manage access for {projectName}.
        </DialogDescription>
        <EditorDialogPattern
          title={`Share ${projectName}`}
          description="Invite collaborators and share the workspace link."
          footer={
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          }
        >
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-surface-border bg-subtle/60 px-3 py-2">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-copy-faint">
                  Project link
                </p>
                <p className="truncate text-sm text-copy-secondary">
                  {projectLink || `/editor/${projectId}`}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
              >
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                {isCopied ? "Copied!" : "Copy link"}
              </Button>
            </div>

            {isOwner ? (
              <form className="grid gap-3" onSubmit={handleInvite}>
                <div className="grid gap-2">
                  <label
                    className="text-xs font-medium uppercase tracking-wide text-copy-faint"
                    htmlFor="invite-email"
                  >
                    Invite by email
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      id="invite-email"
                      type="email"
                      placeholder="collaborator@example.com"
                      value={inviteEmail}
                      onChange={(event) => setInviteEmail(event.target.value)}
                    />
                    <Button
                      type="submit"
                      className="sm:w-32"
                      disabled={!canInvite}
                    >
                      <MailPlus className="h-3.5 w-3.5" aria-hidden="true" />
                      {isInviting ? "Sending..." : "Invite"}
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="rounded-2xl border border-surface-border-subtle bg-base/70 px-3 py-2 text-xs text-copy-muted">
                Only project owners can invite or remove collaborators.
              </div>
            )}

            <div className="grid gap-3">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-copy-faint">
                <span>Collaborators</span>
                <span className="text-copy-muted">
                  {isLoading ? "Loading..." : `${collaboratorCount} total`}
                </span>
              </div>

              {error ? (
                <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-copy-secondary">
                  {error}
                </div>
              ) : null}

              {collaboratorCount === 0 && !isLoading ? (
                <div className="flex min-h-20 items-center justify-center rounded-2xl border border-dashed border-surface-border-subtle bg-base/60 px-4 text-center text-sm text-copy-muted">
                  No collaborators yet.
                </div>
              ) : (
                <div className="grid gap-2">
                  {collaborators.map((collaborator) => {
                    const displayName =
                      collaborator.displayName || collaborator.email;
                    const isRemoving = removingEmail === collaborator.email;

                    return (
                      <div
                        key={collaborator.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-surface-border bg-surface/60 px-3 py-2"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          {collaborator.avatarUrl ? (
                            <img
                              src={collaborator.avatarUrl}
                              alt={displayName}
                              className="h-9 w-9 rounded-full border border-surface-border object-cover"
                            />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-surface-border bg-subtle text-xs font-semibold text-copy-secondary">
                              {toInitial(displayName)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm text-copy-primary">
                              {displayName}
                            </p>
                            {collaborator.displayName ? (
                              <p className="truncate text-xs text-copy-muted">
                                {collaborator.email}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        {isOwner ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            aria-label={`Remove ${displayName}`}
                            disabled={isRemoving}
                            onClick={() => handleRemove(collaborator.email)}
                          >
                            <UserMinus className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </EditorDialogPattern>
      </DialogContent>
    </Dialog>
  );
}
