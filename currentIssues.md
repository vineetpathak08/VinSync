after the changes u made this error pops up in terminal.

The "middleware" file convention is deprecated. Please use "proxy" instead. Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
⨯ The file "./middleware.ts" must export a function, either as a default export or as a named "middleware" export.
This function is what Next.js runs for every request handled by this middleware.

Why this happens:
- The file exists but doesn't export a function.
- The export is not a function (e.g., an object or constant).
- There's a syntax error preventing the export from being recognized.

To fix it:
- Ensure this file has either a default or "middleware" function export.

Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
⚠ Next.js can't recognize the exported `config` field in "/middleware", it may be re-exported from another file. The default config will be used instead.
Unhandled Rejection: Error: Both middleware file "./middleware.ts" and proxy file "./proxy.ts" are detected. Please use "./proxy.ts" only. Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
    at ignore-listed frames


why is there an middleware.ts file when i already mention that clerk will be handeled through proxy.ts file

