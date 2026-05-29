"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface CollaboratorProfile {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface CollaboratorResponse {
  id: string;
  email: string;
  displayName?: string | null;
  avatarUrl?: string | null;
}

interface CollaboratorListResponse {
  collaborators: CollaboratorResponse[];
  isOwner: boolean;
}

const normalizeEmail = (value: string) => value.trim().toLowerCase();

export function useShareActions(projectId: string | null, isOpen: boolean) {
  const [collaborators, setCollaborators] = useState<CollaboratorProfile[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastFetchId = useRef(0);

  const canInvite = Boolean(inviteEmail.trim() && !isInviting);

  const refresh = useCallback(async () => {
    if (!projectId) {
      return;
    }

    const fetchId = lastFetchId.current + 1;
    lastFetchId.current = fetchId;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/collaborators`,
      );

      if (!response.ok) {
        setError("Unable to load collaborators.");
        return;
      }

      const data = (await response.json()) as CollaboratorListResponse;

      if (lastFetchId.current !== fetchId) {
        return;
      }

      const normalized = data.collaborators.map((collaborator) => ({
        id: collaborator.id,
        email: collaborator.email,
        displayName: collaborator.displayName ?? null,
        avatarUrl: collaborator.avatarUrl ?? null,
      }));

      setCollaborators(normalized);
      setIsOwner(data.isOwner);
    } catch {
      setError("Unable to load collaborators.");
    } finally {
      if (lastFetchId.current === fetchId) {
        setIsLoading(false);
      }
    }
  }, [projectId]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setInviteEmail("");
    refresh();
  }, [isOpen, refresh]);

  const handleInvite = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!projectId) {
        return;
      }

      const email = normalizeEmail(inviteEmail);

      if (!email || isInviting) {
        return;
      }

      setIsInviting(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/projects/${projectId}/collaborators`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          },
        );

        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          setError(payload.error ?? "Unable to invite collaborator.");
          return;
        }

        setInviteEmail("");
        await refresh();
      } catch {
        setError("Unable to invite collaborator.");
      } finally {
        setIsInviting(false);
      }
    },
    [inviteEmail, isInviting, projectId, refresh],
  );

  const handleRemove = useCallback(
    async (email: string) => {
      if (!projectId || removingEmail) {
        return;
      }

      setRemovingEmail(email);
      setError(null);

      try {
        const response = await fetch(
          `/api/projects/${projectId}/collaborators`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          },
        );

        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          setError(payload.error ?? "Unable to remove collaborator.");
          return;
        }

        await refresh();
      } catch {
        setError("Unable to remove collaborator.");
      } finally {
        setRemovingEmail(null);
      }
    },
    [projectId, refresh, removingEmail],
  );

  return {
    collaborators,
    isOwner,
    isLoading,
    inviteEmail,
    setInviteEmail,
    isInviting,
    removingEmail,
    error,
    canInvite,
    refresh,
    handleInvite,
    handleRemove,
  };
}
