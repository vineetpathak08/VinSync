import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-stretch bg-base px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-surface-border bg-surface lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="hidden flex-col justify-between gap-10 bg-subtle p-10 lg:flex">
          <div className="flex items-center gap-3 text-sm font-medium text-copy-primary">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-surface-border bg-base text-brand">
              GA
            </span>
            Ghost AI
          </div>

          <div className="space-y-4">
            <p className="text-xl font-semibold text-copy-primary">
              Build the architecture your team agrees on.
            </p>
            <p className="text-sm text-copy-muted">
              Capture systems, refine with AI, and share a single source of
              truth.
            </p>
          </div>

          <ul className="space-y-2 text-sm text-copy-muted">
            <li>Invite teammates to co-design in minutes.</li>
            <li>Keep specs aligned with the canvas.</li>
            <li>Move from idea to plan with clarity.</li>
          </ul>
        </section>

        <section className="flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-[420px]">
            <SignUp
              routing="path"
              path="/sign-up"
              signInUrl="/sign-in"
              forceRedirectUrl="/editor"
              fallbackRedirectUrl="/editor"
            />
          </div>
        </section>
      </div>
    </main>
  );
}
