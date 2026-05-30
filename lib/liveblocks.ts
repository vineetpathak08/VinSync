import "server-only";

import { Liveblocks } from "@liveblocks/node";

const LIVEBLOCKS_CURSOR_COLORS = [
  "#52A8FF",
  "#BF7AF0",
  "#FF990A",
  "#FF6166",
  "#F75F8F",
  "#62C073",
  "#0AC7B4",
  "#EDEDED",
];

const createLiveblocksClient = (secret: string) => new Liveblocks({ secret });

type LiveblocksClientInstance = ReturnType<typeof createLiveblocksClient>;

const globalForLiveblocks = globalThis as unknown as {
  liveblocks?: LiveblocksClientInstance;
};

export const getLiveblocksClient = () => {
  if (globalForLiveblocks.liveblocks) {
    return globalForLiveblocks.liveblocks;
  }

  const secret = process.env.LIVEBLOCKS_SECRET_KEY;

  if (!secret) {
    throw new Error("LIVEBLOCKS_SECRET_KEY is not set");
  }

  const client = createLiveblocksClient(secret);

  if (process.env.NODE_ENV !== "production") {
    globalForLiveblocks.liveblocks = client;
  }

  return client;
};

const hashUserId = (userId: string) => {
  let hash = 0;

  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash);
};

export const getCursorColorForUser = (userId: string) => {
  const hash = hashUserId(userId);
  const index = hash % LIVEBLOCKS_CURSOR_COLORS.length;

  return LIVEBLOCKS_CURSOR_COLORS[index];
};
