this is the error that i m running into duing build process after the current changes

PS C:\Vineet folder\Projects\ghost-ai> npm run build

> ghost-ai@0.1.0 prebuild
> prisma generate

Loaded Prisma config from prisma.config.ts.

Prisma schema loaded from prisma.

✔ Generated Prisma Client (7.8.0) to .\app\generated\prisma in 53ms


> ghost-ai@0.1.0 build
> next build

▲ Next.js 16.2.4 (Turbopack)
- Environments: .env.local, .env

  Creating an optimized production build ...

> Build error occurred
Error: Turbopack build failed with 1 errors:
./lib/liveblocks.ts:3:1
Module not found: Can't resolve '@liveblocks/node'
  1 | import "server-only";
  2 |
> 3 | import { Liveblocks } from "@liveblocks/node";
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  4 |
  5 | const LIVEBLOCKS_CURSOR_COLORS = [
  6 |   "#52A8FF",



Import trace:
  App Route:
    ./lib/liveblocks.ts
    ./app/api/liveblocks-auth/route.ts

https://nextjs.org/docs/messages/module-not-found


    at <unknown> (./lib/liveblocks.ts:3:1)
    at <unknown> (https://nextjs.org/docs/messages/module-not-found)