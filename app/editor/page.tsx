import { EditorLayout } from "@/components/editor/editor-layout";

export default function EditorPage() {
  return (
    <EditorLayout>
      <div className="flex h-full min-h-[calc(100vh-3.5rem)] items-center justify-center bg-base">
        <p className="text-sm text-copy-muted">Canvas workspace</p>
      </div>
    </EditorLayout>
  );
}
