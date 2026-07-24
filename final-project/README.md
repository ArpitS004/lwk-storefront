# LWK Storefront

A standard React + Vite + TypeScript + Tailwind CSS storefront with an
Express API, structured as a single deployable Vercel project (static
frontend + one serverless function). This was converted from a Replit
pnpm-workspace project — see "What changed" below.

## Stack

- **Frontend**: React 19, Vite 7, TypeScript, Tailwind CSS v4, shadcn/ui
  (Radix primitives), TanStack Query, wouter
- **API**: Express 5, Drizzle ORM, Postgres (`pg`), Zod validation
- **Deploy target**: Vercel (frontend as static output, API as a Vercel
  Function via `api/index.ts`)

## Project layout

```
src/            React app (Vite root)
public/         Static assets served as-is
attached_assets/  Images referenced via the @assets/* alias
api/
  index.ts      Vercel serverless entry — exports the Express app
  _lib/         Express app, routes, db, and validation schemas
                (the _lib prefix tells Vercel this isn't a separate function)
```

This is a single npm package — no pnpm workspace, no `workspace:*` or
`catalog:` dependency protocols. Frontend and backend share the same
`package.json`, `tsconfig.json`, and `node_modules`.

## Getting started

```bash
pnpm install
cp .env.example .env   # then fill in DATABASE_URL
pnpm dev
```

`pnpm dev` runs the Vite dev server (port 5173) and a local Express server
(port 8787) together; Vite proxies `/api/*` to the local Express server, so
the frontend always calls a relative `/api/...` path in both dev and
production — no separate API URL to configure.

Other commands:

```bash
pnpm build     # production build to dist/
pnpm preview   # serve the production build locally
pnpm typecheck # tsc --noEmit across src/ and api/
pnpm db:push   # push the Drizzle schema to DATABASE_URL
```

## Database

Any standard Postgres connection string works (Neon, Supabase, Railway,
RDS, local Postgres, etc.) — the app uses the plain `pg` driver via
Drizzle, not a provider-specific client. If you're using a serverless
Postgres provider like Neon, use its **pooled** connection string for
`DATABASE_URL` in production, since Vercel Functions open short-lived
connections per invocation.

Set `DATABASE_URL` in a local `.env` file for development, and as an
environment variable in your Vercel project settings for production.

## Deploying to Vercel

1. Push this repo to GitHub (or GitLab/Bitbucket).
2. Import it in Vercel. Framework preset: **Vite**. No other settings
   should need to change — `vercel.json` in this repo already configures
   the build command, output directory, and the rewrites that route
   `/api/*` to the serverless function and everything else to the SPA.
3. Add the `DATABASE_URL` environment variable in the Vercel project
   settings (Production, Preview, and Development as needed).
4. Deploy. The frontend and API are served from the same domain, so no
   CORS configuration or separate API URL is required.

## What changed from the original Replit project

- Removed all `@replit/*` packages and Vite plugins (runtime error overlay,
  cartographer, dev banner), the `.replit` / `.replit-artifact` files, and
  the Replit connectors SDK dependency.
- Removed the pnpm workspace: what were three packages
  (`artifacts/lwk`, `artifacts/api-server`, plus the shared `lib/*`
  packages) are now one package, with `workspace:*` imports replaced by
  either a `@/lib/api-client` path alias (frontend) or plain relative
  imports (`api/_lib/...`).
- Removed every `catalog:` version reference — all dependencies are now
  pinned to explicit semver ranges in `package.json`.
- Removed the platform-exclusion overrides in the old
  `pnpm-workspace.yaml` that deleted the `darwin-arm64`, `darwin-x64`, and
  `win32-*` native binaries for `esbuild`, `rollup`, `lightningcss`, and
  `@tailwindcss/oxide` (they were hardcoded to `linux-x64` only, which is
  why the project couldn't build on Apple Silicon or Windows). There's no
  `pnpm-workspace.yaml` at all now — with a single package there's nothing
  for it to configure.
- Added `pnpm.onlyBuiltDependencies` in `package.json` so pnpm is allowed
  to run the native build/install scripts `lightningcss`, `esbuild`, and
  `@tailwindcss/oxide` need on every platform (pnpm blocks these by
  default unless explicitly allow-listed).
- Replaced the Express server's `app.listen()` entrypoint (which needs a
  long-running process) with `api/index.ts`, a Vercel serverless function
  that exports the same Express `app` directly — Vercel's Node runtime
  accepts an Express app as a request handler. The old `app.listen()`
  entrypoint still exists as `api/_lib/local-server.ts`, used only by
  `pnpm dev:api` for local development.
- `vite.config.ts` no longer throws if `PORT` / `BASE_PATH` env vars are
  unset (the original required both just to run `vite build`), and no
  longer imports any `@replit/*` plugins.
