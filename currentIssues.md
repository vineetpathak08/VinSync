this is the erro that i m running into duing build process after the current changes

PS C:\Vineet folder\Projects\ghost-ai> npm run build

> ghost-ai@0.1.0 prebuild
> prisma generate

Loaded Prisma config from prisma.config.ts.

Prisma schema loaded from prisma.

✔ Generated Prisma Client (7.8.0) to .\app\generated\prisma in 52ms


> ghost-ai@0.1.0 build
> next build

▲ Next.js 16.2.4 (Turbopack)
- Environments: .env.local, .env

  Creating an optimized production build ...
✓ Compiled successfully in 3.4s
  Running TypeScript  .Failed to type check.

./app/api/projects/[projectId]/collaborators/route.ts:141:33
Type error: Parameter 'collaborator' implicitly has an 'any' type.

  139 |   const hasAccess =
  140 |     isOwner ||
> 141 |     project.collaborators.some((collaborator) =>
      |                                 ^
  142 |       normalizedEmails.includes(
  143 |         normalizeEmailString(collaborator.collaboratorEmail),
  144 |       ),
Next.js build worker exited with code: 1 and signal: null