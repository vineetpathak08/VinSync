"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CanvasSaveStatus = "idle" | "saving" | "saved" | "error";

interface EditorSaveStatusContextValue {
  saveStatus: CanvasSaveStatus;
  setSaveStatus: (status: CanvasSaveStatus) => void;
}

const EditorSaveStatusContext =
  createContext<EditorSaveStatusContextValue | null>(null);

export function EditorSaveStatusProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [saveStatus, setSaveStatus] = useState<CanvasSaveStatus>("idle");

  const value = useMemo(
    () => ({ saveStatus, setSaveStatus }),
    [saveStatus],
  );

  return (
    <EditorSaveStatusContext.Provider value={value}>
      {children}
    </EditorSaveStatusContext.Provider>
  );
}

export function useEditorSaveStatus() {
  const context = useContext(EditorSaveStatusContext);

  if (!context) {
    throw new Error("useEditorSaveStatus must be used within a provider");
  }

  return context;
}