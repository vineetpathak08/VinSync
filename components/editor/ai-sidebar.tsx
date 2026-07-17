"use client";

import React, { useRef, useState } from "react";
import { FileText, Loader2, MessageSquare, Send, X } from "lucide-react";
import { useFeedMessages, useOthersMapped } from "@liveblocks/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  AI_STATUS_FEED_ID,
  isAiGenerationActive,
  parseAiStatusFeedMessage,
} from "@/types/tasks";

type AiSidebarProps = {
  onClose?: () => void;
};

export default function AiSidebar({ onClose }: AiSidebarProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { messages } = useFeedMessages(AI_STATUS_FEED_ID);
  const thinkingPresence = useOthersMapped((other) =>
    Boolean(other.presence.thinking),
  );
  const latestStatus = [...(messages ?? [])]
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((message) => parseAiStatusFeedMessage(message.data))
    .find((message) => message !== null);
  const hasThinkingPresence = thinkingPresence.some((entry) => {
    if (Array.isArray(entry)) {
      return Boolean(entry[1]);
    }

    return Boolean(entry);
  });
  const isGenerating =
    hasThinkingPresence ||
    (latestStatus ? isAiGenerationActive(latestStatus.phase) : false);

  function resizeTextarea() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const height = Math.min(Math.max(el.scrollHeight, 72), 160);
    el.style.height = `${height}px`;
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    resizeTextarea();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isGenerating && value.trim()) {
        console.log("send:", value);
        setValue("");
        resizeTextarea();
      }
    }
  }

  return (
    <div className="flex h-full w-80 max-w-xs flex-col border-l border-surface-border bg-base/95 shadow-lg">
      <div className="flex items-start gap-3 border-b border-surface-border px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-subtle text-accent-text">
            <MessageSquare className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-primary-text">
            AI Workspace
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-text">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                isGenerating ? "bg-ai" : "bg-state-success",
              )}
            />
            <span>{isGenerating ? "Vin AI is thinking" : "Vin AI is idle"}</span>
          </div>
        </div>
        <div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close AI sidebar"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-3 py-3">
        <Tabs defaultValue="architect">
          <TabsList className="w-full" aria-label="AI tabs">
            <TabsTrigger
              value="architect"
              className="data-[state=active]:bg-accent data-[state=active]:text-accent"
            >
              AI Architect
            </TabsTrigger>
            <TabsTrigger
              value="specs"
              className="data-[state=active]:bg-accent data-[state=active]:text-accent"
            >
              Specs
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="architect"
            className="flex h-[calc(100%-148px)] flex-col"
          >
            <div className="flex-1 overflow-y-auto px-1">
              <div className="flex h-full flex-col items-center justify-center gap-3 py-8">
                {latestStatus?.text ? (
                  <div className="w-full rounded-xl border border-surface-border bg-elevated px-3 py-2 text-sm text-copy-secondary">
                    <div className="flex items-center gap-2 text-xs font-medium uppercase text-copy-muted">
                      {isGenerating ? (
                        <Loader2
                          className="h-3.5 w-3.5 animate-spin text-ai-text"
                          aria-hidden="true"
                        />
                      ) : (
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            latestStatus.phase === "error"
                              ? "bg-state-error"
                              : "bg-state-success",
                          )}
                        />
                      )}
                      Latest AI status
                    </div>
                    <div className="mt-1 text-copy-primary">
                      {latestStatus.text}
                    </div>
                  </div>
                ) : null}
                <div className="flex flex-col items-center gap-2">
                  <div className="rounded-2xl bg-elevated p-4 text-center">
                    <MessageSquare className="mx-auto mb-2 h-6 w-6 text-accent-text" />
                    <div className="text-sm font-medium text-copy-primary">
                      Ask Vin AI
                    </div>
                    <div className="mt-1 text-xs text-copy-muted">
                      Get architecture guidance and starter templates
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
                    {[
                      "Design an e-commerce backend",
                      "Create a chat app architecture",
                      "Build a CI/CD pipeline",
                    ].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setValue(chip)}
                        className={cn(
                          "rounded-full px-3 py-1 text-sm bg-subtle text-accent-text",
                        )}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-surface-border px-3 py-3">
              <div className="flex w-full gap-2">
                <Textarea
                  ref={textareaRef}
                  className="min-h-[72px] max-h-[160px] resize-none text-white placeholder:text-white/50"
                  placeholder="Ask something to Vin AI..."
                  value={value}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  disabled={isGenerating}
                />
                <Button
                  className="whitespace-nowrap bg-accent text-white"
                  disabled={isGenerating || !value.trim()}
                  onClick={() => {
                    if (!isGenerating && value.trim()) {
                      console.log("send:", value);
                      setValue("");
                      resizeTextarea();
                    }
                  }}
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Send className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span>Send</span>
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="specs"
            className="flex h-[calc(100%-64px)] flex-col gap-3"
          >
            <div className="px-1">
              <Button className="mb-3 bg-accent text-white">
                Generate Spec
              </Button>
              <div className="rounded-lg border border-surface-border bg-elevated p-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-base/60 p-2">
                    <FileText className="h-5 w-5 text-accent-text" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-copy-primary">
                      Demo Spec
                    </div>
                    <div className="text-xs text-copy-muted">
                      Short snippet of a generated spec goes here.
                    </div>
                  </div>
                  <div>
                    <Button variant="ghost" size="icon" disabled>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
