import Link from "next/link";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AccessDenied() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-6">
      <div className="flex max-w-md flex-col items-center gap-4 rounded-3xl border border-surface-border bg-surface/70 px-6 py-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-surface-border bg-base text-brand">
          <Lock className="h-6 w-6" aria-hidden="true" />
        </span>
        <div className="space-y-2">
          <h1 className="text-lg font-semibold text-copy-primary">
            Access denied
          </h1>
          <p className="text-sm text-copy-muted">
            You do not have access to this workspace yet.
          </p>
        </div>
        <Button asChild className="mt-2">
          <Link href="/editor">Back to editor</Link>
        </Button>
      </div>
    </div>
  );
}
