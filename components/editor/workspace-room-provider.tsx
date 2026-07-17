"use client";

import type { ReactNode } from "react";
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";

interface WorkspaceRoomProviderProps {
  children: ReactNode;
  roomId: string;
  fallback?: ReactNode;
}

export function WorkspaceRoomProvider({
  children,
  roomId,
  fallback,
}: WorkspaceRoomProviderProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialPresence={{ cursor: null, thinking: false }}
      >
        <ClientSideSuspense fallback={fallback ?? null}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
