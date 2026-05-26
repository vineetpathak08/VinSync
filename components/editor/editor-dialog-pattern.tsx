import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface EditorDialogPatternProps {
  title: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  className?: string
}

export function EditorDialogPattern({
  title,
  description,
  children,
  footer,
  className,
}: EditorDialogPatternProps) {
  return (
    <section
      className={cn(
        "grid gap-5 rounded-3xl border border-surface-border bg-elevated p-5 text-copy-primary shadow-2xl",
        className
      )}
    >
      <div className="grid gap-2">
        <h2 className="text-base font-semibold leading-none">{title}</h2>
        {description ? (
          <p className="text-sm leading-5 text-copy-muted">{description}</p>
        ) : null}
      </div>

      {children}

      {footer ? (
        <div className="flex flex-col-reverse gap-2 border-t border-surface-border pt-4 sm:flex-row sm:justify-end">
          {footer}
        </div>
      ) : null}
    </section>
  )
}
