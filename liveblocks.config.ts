// Liveblocks presence typing for the app

export type Presence = {
  cursor: { x: number; y: number } | null;
  thinking: boolean;
};

declare module "@liveblocks/react" {
  interface LiveblocksPresence extends Presence {}
}
