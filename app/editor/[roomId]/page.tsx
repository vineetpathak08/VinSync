import { redirect } from "next/navigation";

import { LiveblocksCanvas } from "@/components/canvas/liveblocks-canvas";
import { AccessDenied } from "@/components/editor/access-denied";
import { EditorLayout } from "@/components/editor/editor-layout";
import { getProjectSidebarData } from "@/lib/project-data";
import {
  getCurrentClerkIdentity,
  getProjectByAccess,
} from "@/lib/project-access";
import AiSidebar from "@/components/editor/ai-sidebar";

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
      rightSidebar={<AiSidebar />}
    >
      <LiveblocksCanvas
        roomId={project.id}
        initialTemplateId={resolvedSearchParams?.template}
      />
    </EditorLayout>
  );
}
