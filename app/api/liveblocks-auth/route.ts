import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  getCurrentClerkIdentity,
  getProjectByAccess,
} from "@/lib/project-access";
import { getCursorColorForUser, getLiveblocksClient } from "@/lib/liveblocks";

const parseJsonBody = async (request: Request): Promise<unknown | null> => {
  try {
    return await request.json();
  } catch {
    return null;
  }
};

const normalizeRoomId = (input: unknown): string => {
  if (typeof input !== "string") {
    return "";
  }

  return input.trim();
};

const getRoomIdFromBody = (body: unknown): string => {
  if (!body || typeof body !== "object") {
    return "";
  }

  const payload = body as Record<string, unknown>;
  const room = normalizeRoomId(payload.room);

  if (room) {
    return room;
  }

  const projectId = normalizeRoomId(payload.projectId);

  if (projectId) {
    return projectId;
  }

  return normalizeRoomId(payload.roomId);
};

const getDisplayName = (
  user: Awaited<ReturnType<typeof currentUser>>,
  fallbackEmail: string | null,
) => {
  if (!user) {
    return fallbackEmail || "Anonymous";
  }

  const fallbackName = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    user.fullName ||
    fallbackName ||
    user.username ||
    fallbackEmail ||
    "Anonymous"
  );
};

export async function POST(request: Request) {
  const identity = await getCurrentClerkIdentity();

  if (!identity.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await parseJsonBody(request);
  const roomId = getRoomIdFromBody(body);

  if (!roomId) {
    return NextResponse.json({ error: "Missing project id" }, { status: 400 });
  }

  const project = await getProjectByAccess(roomId, identity);

  if (!project) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const user = await currentUser();
  const name = getDisplayName(user, identity.primaryEmail);
  const avatar = user?.imageUrl ?? undefined;
  const color = getCursorColorForUser(identity.userId);

  const liveblocksClient = getLiveblocksClient();

  try {
    await liveblocksClient.getOrCreateRoom(roomId, {
      defaultAccesses: ["room:write"],
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to create Liveblocks room" },
      { status: 500 },
    );
  }

  const { status, body: responseBody } = await liveblocksClient.identifyUser(
    identity.userId,
    {
      userInfo: {
        name,
        avatar: avatar ?? "",
        color,
      },
    },
  );

  return new Response(responseBody, {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
