# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Canvas enhancements

## Current Goal

- Implement autosave and loading for collaborative canvas snapshots using Vercel Blob.

## Completed

- Design system and UI primitive setup from `context/feature-specs/01-design-system.md`.
- Installed and configured shadcn/ui with Radix-based primitives.
- Added Button, Card, Dialog, Input, Tabs, Textarea, and ScrollArea components under `components/ui/`.
- Installed `lucide-react`.
- Added `lib/utils.ts` with the reusable `cn()` class merging helper.
- Updated global CSS theme tokens to the documented dark-only VinSync palette and shadcn-compatible variables.
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
- Added a cached Prisma client singleton with Accelerate/adapter branching in `lib/prisma.ts`.
- Project API routes from `context/feature-specs/06-project-apis.md`.
- Added `GET /api/projects` and `POST /api/projects` for owner-scoped list/create.
- Added `PATCH /api/projects/[projectId]` and `DELETE /api/projects/[projectId]` with owner checks and 401/403 handling.
- Editor workspace shell from `context/feature-specs/08-editor-workspace-shell.md`.
- Added `AccessDenied` for unauthorized or missing workspaces.
- Added `lib/project-access.ts` helpers for Clerk identity and project access checks.
- Added `/editor/[roomId]` server route with access checks and workspace placeholders.
- Updated editor layout to support project titles, share/AI actions, and an AI sidebar placeholder.
- Added `components/editor/ai-sidebar.tsx` and wired it into `EditorLayout` and `app/editor/[roomId]/page.tsx` (UI only, per `context/feature-specs/20-ai-sidebar-shell.md`).
- Highlighted the active workspace in the project sidebar.
- Share dialog from `context/feature-specs/09-share-dialog.md`.
- Added share dialog UI with invite, list, remove, and copy link flows.
- Added project collaborator API routes with Clerk user enrichment.
- Liveblocks setup from `context/feature-specs/10-liveblocks-setup.md`.
- Added Liveblocks Presence/UserMeta typing, cached server client, and cursor color helper.
- Added `POST /api/liveblocks-auth` with Clerk auth, project access checks, room creation, and session metadata.
- Base canvas from `context/feature-specs/11-base-canvas.md`.
- Replaced the workspace placeholder with a Liveblocks-backed React Flow canvas.
- Added Liveblocks-synced nodes and edges with the React Flow MiniMap and dotted background.
- Shape panel from `context/feature-specs/12-shape-panel.md`.
- Added the floating shape toolbar with draggable shape payloads and drop-to-create nodes.
- Node shape rendering and drag preview from `context/feature-specs/13-node-shape.md`.
- Replaced placeholder nodes with CSS/SVG shape rendering and added drag ghost preview.
- Node color palette foundation from `context/feature-specs/15-node-color-toolbar.md`.
- Edge behavior implementation from `context/feature-specs/16-edge-behavior.md`.
  - Right-click connections now create sigmoidal edges; left-click connections create straight edges.
  - Click-to-click connection behavior implemented: edges attach to the exact clicked handle IDs and the routing mode is persisted on the edge (`pathStyle`) so the shape survives refresh, undo/redo, and collaboration.
- Floating control bar (zoom + undo/redo) and keyboard shortcuts from `context/feature-specs/17-canvas-ergonomics.md.md`.
- Floating control bar (zoom + undo/redo) and keyboard shortcuts from `context/feature-specs/17-canvas-ergonomics.md.md`.
- Canvas ergonomics implemented: floating control bar and keyboard shortcuts wired to React Flow and Liveblocks history.
- Edge behavior foundation from `context/feature-specs/16-edge-behavior.md`.
- Canvas edge renderer stability update.
  - Replaced the edge label portal path with React Flow's viewport portal and guarded label rendering behind finite geometry checks to prevent foreignObject and NaN coordinate warnings.
- Canvas edge routing stabilization.
  - Self-connections now render as explicit loop curves and all non-self edges use curved routing that avoids straight-line fallbacks.
- Canvas autosave and blob-backed loading.
  - Added `PUT /api/projects/[projectId]/canvas` and `GET /api/projects/[projectId]/canvas` with Prisma-backed project metadata and Vercel Blob storage for canvas JSON.
  - Added a debounced canvas autosave hook, project-scoped hydration guard, and editor save-status indicator in the navbar.
  - Saved canvas state now skips hydration when the room already has active nodes or edges.

## In Progress

- None.

## Next Up

- Resume the floating node color toolbar and paired text/background color updates for canvas nodes.

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Design foundation uses shadcn/ui generated primitives in `components/ui/`; project-specific styling should compose them outside generated files.

## Session Notes

- Checked the Trigger.dev CLI failure and found the repo was missing a root `trigger.config.ts` and a task directory scaffold.
- Added a root Trigger.dev config that reads `TRIGGER_PROJECT_REF` and points `dirs` at `./trigger`.
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
- Added `lib/prisma.ts` Prisma client singleton with Accelerate or pg adapter selection.
- Implemented Project API routes for list/create/rename/delete with Clerk auth, ownership checks, and predictable responses.
- Implemented the `/editor/[roomId]` workspace shell with server-side access checks and layout placeholders.
- Implemented share dialog UI, collaborator API routes, and Clerk user enrichment for collaborator display.
- Implemented Liveblocks server client caching, auth route with access checks, and typed presence metadata.
- Started base canvas implementation from `context/feature-specs/11-base-canvas.md` after reading the required project context, local Next.js 16 Server/Client Component docs, and Liveblocks React Flow guidance.
- Installed missing Liveblocks server dependency, aligned identifyUser usage, and made Liveblocks client creation lazy to avoid build-time env failures.
- Updated the canvas surface styling with a dotted grid and bordered frame to match the requested white-dot canvas look.
- Initialized Trigger.dev with project ref `proj_mrcctcirtzvdffleznob`, creating `trigger.config.ts` and the local `trigger/` directory.
- Pinned `@trigger.dev/sdk` and `@trigger.dev/build` to exact `4.4.6` versions so the Trigger.dev CLI can run without the version-mismatch guard.
- Added a minimal `trigger/hello.ts` task so the Trigger.dev dev server has a discoverable task file.
- Verified `npx trigger.dev@latest dev` reaches the ready state with the local worker online.
- Added the shape panel, drag-and-drop payloads, and a basic canvas node renderer for `context/feature-specs/12-shape-panel.md`.
- Fixed React Flow nodeTypes typing to wrap `CanvasNodeRenderer` with a `NodeProps`-compatible component.
- Implemented custom canvas edges, four-side node handles, and inline edge label editing with a clean build validation pass.
- Hardened the edge renderer so label overlays no longer emit foreignObject or NaN coordinate warnings in the editor room.
- Updated edge routing so self-loops render as circular curves and normal edges no longer fall back to straight lines.
