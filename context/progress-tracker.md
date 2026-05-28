# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Editor home wiring complete

## Current Goal

- Validate build and select the next feature unit.

## Completed

- Design system and UI primitive setup from `context/feature-specs/01-design-system.md`.
- Installed and configured shadcn/ui with Radix-based primitives.
- Added Button, Card, Dialog, Input, Tabs, Textarea, and ScrollArea components under `components/ui/`.
- Installed `lucide-react`.
- Added `lib/utils.ts` with the reusable `cn()` class merging helper.
- Updated global CSS theme tokens to the documented dark-only Ghost AI palette and shadcn-compatible variables.
- Editor chrome foundation from `context/feature-specs/02-editor-chrome.md`.
- Added reusable editor navbar with left/center/right sections and sidebar toggle state icons.
- Added floating project sidebar shell with shadcn tabs, empty states, close control, slide-in behavior, and New Project action.
- Added reusable editor dialog layout pattern with title, description, body, and footer action slots using existing theme tokens.
- Wired the editor chrome into the home route through a reusable `EditorLayout` shell.
- Auth integration from `context/feature-specs/03-auth.md`.
- Wrapped the app in `ClerkProvider` using the Clerk dark theme with CSS variable overrides.
- Added protected-first `proxy.ts` routing with public auth paths and home redirect.
- Built sign-in and sign-up pages with the two-panel layout and Clerk components.
- Redirected `/` based on auth state and moved the editor shell to `/editor`.
- Added Clerk `UserButton` to the editor navbar.
- Built the editor home empty state and project dialogs from `context/feature-specs/04-project-dialogs.md`.
- Prisma schema and data layer from `context/feature-specs/05-prisma.md`.
- Added `Project` and `ProjectCollaborator` models with enums, relations, and indexes.
- Created and applied the first Prisma migration for `Project`, `ProjectCollaborator`, and `ProjectStatus`.
- Added a cached Prisma client singleton with Accelerate/adapter branching in `lib/prisma.ts`.
- Project API routes from `context/feature-specs/06-project-apis.md`.
- Added `GET /api/projects` and `POST /api/projects` for owner-scoped list/create.
- Added `PATCH /api/projects/[projectId]` and `DELETE /api/projects/[projectId]` with owner checks and 401/403 handling.
- Wired editor home sidebar and dialogs to real project data from `context/feature-specs/07-wire-editor-home.md`.
- Added server-side project list helper for owned/shared projects.
- Added project actions hook to create, rename, and delete projects via API calls.
- Updated editor home and sidebar to use real project data with room ID previews.
- Corrected Prisma 7 client instantiation for Accelerate URLs and direct Postgres adapters.
- Validated the editor home/project API build with `npm.cmd run build`.

## In Progress

- None.

## Next Up

- Validate build and select the next feature spec.

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Design foundation uses shadcn/ui generated primitives in `components/ui/`; project-specific styling should compose them outside generated files.

## Session Notes

- Started design system implementation by reading required project context and the design-system feature spec.
- Initialized shadcn/ui with the Radix Nova preset, CSS variables enabled, `components.json`, `components/ui/button.tsx`, and `lib/utils.ts`.
- Added requested shadcn/ui primitives: Button, Card, Dialog, Input, Tabs, Textarea, and ScrollArea; verified `lucide-react` is installed.
- Validation passed with `npm.cmd run lint` and `npm.cmd run build`; build required network access for Next font fetching.
- Started editor chrome implementation by reading the required project context, local Next.js 16 app docs for Server and Client Components / project structure, and `context/feature-specs/02-editor-chrome.md`.
- Added `components/editor/editor-navbar.tsx`, `components/editor/project-sidebar.tsx`, and `components/editor/editor-dialog-pattern.tsx` as project-specific editor chrome components.
- Validation passed with `npm.cmd run lint` and `npm.cmd run build`; build required network access for Next font fetching.
- Added `components/editor/editor-layout.tsx` to compose the editor navbar and floating project sidebar with local sidebar state.
- Updated `app/page.tsx` to render the editor layout around the placeholder canvas workspace.
- Validation passed with `npm.cmd run lint` and `npm.cmd run build`; build required network access for Next font fetching.
- Implemented Clerk auth wiring with `ClerkProvider`, `proxy.ts`, and auth redirects.
- Built sign-in and sign-up pages per the two-panel spec using Clerk components.
- Moved the editor layout to `/editor` and added the Clerk user menu to the navbar.
- Added Prisma multi-file schema models for projects and collaborators.
- Applied Prisma migration `20260528111943_init_project_models` to create the project tables and status enum in Postgres.
- Added `lib/prisma.ts` Prisma client singleton with Accelerate or pg adapter selection.
- Implemented Project API routes for list/create/rename/delete with Clerk auth, ownership checks, and predictable responses.
- Fixed the Prisma 7 Accelerate branch to use `accelerateUrl`, typed the development singleton cache to the factory return type, and restored strict project-summary mapping types.
- Validation passed with `npm.cmd run build`; build required network access for Next font fetching.
- Resolved the missing `public.Project` runtime error; Prisma migration status is up to date and `npm.cmd run build` passes with network access for Next font fetching.
