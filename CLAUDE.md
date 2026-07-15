# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

RealDeals: a Next.js (App Router) + TypeScript app. One codebase serves both the UI and server-side logic — there is no separate backend service. Postgres + Auth via Supabase. Deployed on Vercel via auto-deploy from `main`. Later phases call the Anthropic API directly from backend routes (no third-party plugin layer).

## Commands

```bash
npm run dev      # start dev server (Turbopack, default since Next 16)
npm run build    # production build
npm run start    # run the production build
npm run lint     # eslint (flat config, eslint.config.mjs)
npx tsc --noEmit # typecheck — there is no separate `npm run typecheck` script
```

There is no test runner configured yet. If tests are added, wire a `test` script and document how to run a single test here.

## Next.js version note (important)

This project is on **Next.js 16**, which has breaking changes from the Next.js most training data describes. Before writing App Router code (route handlers, params/searchParams, image metadata, caching, proxy), check `node_modules/next/dist/docs/` — it ships the version-matched docs. Two changes that matter most here:

- **`middleware.ts` is gone.** It's renamed to `src/proxy.ts`, exporting a `proxy` function (not `middleware`). This repo's proxy file already exists at [src/proxy.ts](src/proxy.ts) — don't recreate a `middleware.ts`.
- **`cookies()`, `headers()`, `params`, `searchParams` are async-only** — no synchronous fallback.

`AGENTS.md` in the repo root reinforces this for any agent working here.

## Architecture

**Auth flow.** Supabase Auth issues a session stored in cookies. Three integration points, each with a different cookie-write capability:

- [src/proxy.ts](src/proxy.ts) — runs on every request (matcher excludes static assets), calls `supabase.auth.getUser()` to refresh expired tokens and rewrite the session cookie. This is an *optimistic* check only, per Next.js's own guidance — it centralizes token refresh, not authorization.
- [src/lib/supabase/server.ts](src/lib/supabase/server.ts) — `createClient()` for use in Server Components, Route Handlers, and Server Actions. Reads cookies via `next/headers`; must be called fresh per request (not hoisted to module scope).
- [src/lib/supabase/client.ts](src/lib/supabase/client.ts) — `createClient()` for Client Components (`'use client'`).

**Authorization.** [src/lib/supabase/auth.ts](src/lib/supabase/auth.ts) exports `requireUser()`, which every mutating Route Handler / Server Action must call and check before touching data — see [src/app/api/profile/route.ts](src/app/api/profile/route.ts) for the pattern. This is non-negotiable per project requirements: permission checks happen server-side on every mutation, never inferred from what the UI shows or hides. The proxy's optimistic cookie check is not a substitute for this.

**Environment variables.** See [.env.local.example](.env.local.example) for the full list. `NEXT_PUBLIC_*` vars are exposed to the browser; `SUPABASE_SERVICE_ROLE_KEY` and `ANTHROPIC_API_KEY` are server-only and must never be prefixed `NEXT_PUBLIC_` or referenced from a Client Component.

**Deployment.** Vercel auto-deploys on push to `main`. No CI config exists yet beyond Vercel's own build step (`npm run build`).

## Known environment mismatch

`@supabase/supabase-js` (and its sub-dependencies) now declare `engines.node >= 22`, but local Node is 20.19.5. It currently installs and runs with a deprecation warning only, but if Supabase drops Node 20 support in a future release this will start failing outright. Upgrade local Node and set the Vercel project's Node.js version accordingly when convenient.
