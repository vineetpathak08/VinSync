import { redirect } from "next/navigation";

import { LiveblocksCanvas } from "@/components/canvas/liveblocks-canvas";
import { AccessDenied } from "@/components/editor/access-denied";
import { EditorLayout } from "@/components/editor/editor-layout";
import { getProjectSidebarData } from "@/lib/project-data";
import {
  getCurrentClerkIdentity,
  getProjectByAccess,
} from "@/lib/project-access";

interface EditorRoomPageProps {
  params: Promise<{
    roomId: string;
  }>;
  searchParams?: Promise<{
    template?: string;
    templates?: string;
  }>;
}

export default async function EditorRoomPage({
  params,
  searchParams,
}: EditorRoomPageProps) {
  const { roomId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const identity = await getCurrentClerkIdentity();

  if (!identity.userId) {
    redirect("/sign-in");
  }

  const project = await getProjectByAccess(roomId, identity);

  if (!project) {
    return <AccessDenied />;
  }

  const { ownedProjects, sharedProjects } = await getProjectSidebarData();

  return (
    <EditorLayout
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
      activeProjectId={project.id}
      navbarTitle={project.name}
      startWithTemplatesOpen={resolvedSearchParams?.templates === "1"}
      showShareButton
      shareProjectId={project.id}
      shareProjectName={project.name}
      showAiToggle
      rightSidebar={
        <div className="flex h-full flex-col gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-copy-faint">
              AI assistant
            </p>
            <p className="text-sm text-copy-muted">
              AI chat tools will appear here soon.
            </p>
          </div>
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-surface-border-subtle bg-base/60 px-4 text-center text-sm text-copy-muted">
            AI sidebar placeholder
          </div>
        </div>
      }
    >
      <LiveblocksCanvas
        roomId={project.id}
        initialTemplateId={resolvedSearchParams?.template}
      />
    </EditorLayout>
  );
}
