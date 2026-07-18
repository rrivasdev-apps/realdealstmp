# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

RealDeals: a real estate deal & transaction management platform. Fresh, independently-owned rebuild of a deal-to-close / wholesale-and-flip management concept — not a port of any prior implementation, rebuilt from a feature study and phased roadmap. Reference docs (in [docs/](docs/)):

- [docs/mvp-study.md](docs/mvp-study.md) — full feature set and phased roadmap
- [docs/architecture-decision.md](docs/architecture-decision.md) — why this stack was chosen over a no-code hybrid
- [docs/market-opportunity.md](docs/market-opportunity.md) — business context behind the rebuild
- [docs/data-model.md](docs/data-model.md) — full reverse-engineered data model (all phases), reconstructed from the original app's screens; the schema in this file is the Phase 0 subset drawn from it
- [docs/reference/](docs/reference/) — per-section UI/UX walkthroughs of the original app (voice-transcribed by Rafael, one doc per section as they're supplied). These describe *functional* structure and data flows only — the original app's screenshots referenced inside are not the target look; RealDeals' UI should be modern and well-designed, built fresh

**Stack.** Next.js (App Router), TypeScript throughout — one codebase serves both the UI and server-side logic, no separate backend service. Postgres + Auth via Supabase. Deployed on Vercel via auto-deploy from `main`. Later phases call the Anthropic API directly from backend routes (no third-party plugin layer).

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

**Authorization.** [src/lib/supabase/auth.ts](src/lib/supabase/auth.ts) exports `requireUser()`, which every mutating Route Handler / Server Action must call and check before touching data — see [src/app/api/profile/route.ts](src/app/api/profile/route.ts) for the pattern. `requireProfile()` additionally loads the caller's `company_id`/`role` (most routes need it to scope queries/writes); `requireAdmin()` layers a `role === 'admin'` check on top, for routes like `/api/team/invite`. This is non-negotiable per project requirements: permission checks happen server-side on every mutation, never inferred from what the UI shows or hides. The proxy's optimistic cookie check is not a substitute for this. RLS policies (scoped via the `is_company_member()` Postgres function) are defense in depth underneath these checks, not a replacement for them — see `supabase/migrations/`.

**Environment variables.** See [.env.local.example](.env.local.example) for the full list. `NEXT_PUBLIC_*` vars are exposed to the browser; `SUPABASE_SERVICE_ROLE_KEY` and `ANTHROPIC_API_KEY` are server-only and must never be prefixed `NEXT_PUBLIC_` or referenced from a Client Component.

**Deployment.** Vercel project `realdealstmp` (scope `rerss-projects`), live at https://realdealstmp.vercel.app, auto-deploys on push to `main`. No CI config exists yet beyond Vercel's own build step (`npm run build`).

## Current phase: Phase 2 (Operations)

**Phase 0 (MVP) and Phase 1 (Financial Engine) are both complete and live.**
Phase 0 shipped the Deal Whiteboard (now at `/deals`), the KPI Dashboard
(`/dashboard`), Contact Hub, multi-tenant signup/invite, and the simple
`projected_sales_price - contract_price` profit calc. Phase 1 added on top of
that: the BC contract and Offers, JV expense allocation, the full gross/net
profit cascade (`calculateProfitCascade` in `src/lib/deals/profit.ts`), the
role-based commission engine (`commission_types`/`employee_roles`/
`deal_employees`/`payments`, `src/lib/deals/commissions.ts`), the Deal
Checklist system, and monthly/quarterly/yearly KPI reporting
(`src/lib/deals/kpi.ts`). See `supabase/migrations/` for the full schema as
it stands now — the "Data model" section below is the original Phase 0
starting point, not the current full schema.

Scope now — nothing beyond this list until Phase 2 is validated:

- **Employee Sentinel**: fuller roles/permissions than today's `admin`/
  `member` split, plus payroll. `employee_roles` already exists (pulled
  forward early to support commissions) — this phase extends it, doesn't
  start it from scratch.
- **Transaction Guardian**: the event-triggered automation engine (named step
  ownership on deal-lifecycle events).
- **Per-company custom fields**: the `custom_fields` JSONB column on `deals`
  already exists (added in Phase 0 for exactly this) — this phase adds the
  Settings UI to define and edit them.
- **Full Settings module**: today's Settings page only covers commission
  types/employee roles/checklist items/reason lists; this phase makes it the
  place every company-scoped lookup (`markets`, `deal_types`,
  `lead_sources`, etc.) gets a real UI instead of the Supabase table editor.

Do not build Phase 3 features early, even if they seem easy to add "while
we're in there." The point of each phase is to validate its slice before the
next one starts.

## Data model — Phase 0 starting point (see `supabase/migrations/` for the current full schema)

Refined from real screenshots of the original app — see [docs/data-model.md](docs/data-model.md) for the full reverse-engineered model (all phases) and the reasoning behind these field names. Deals are structured around an **AB contract** (wholesaler buying from the seller) in Phase 0; the **BC contract** (wholesaler selling/assigning to the end buyer/investor) is added in Phase 1 along with Offers.

```
companies                      -- the tenant boundary; created by /api/signup, everything else belongs to one
  id, name, created_at

profiles                       -- one row per auth.users row, created by the handle_new_user trigger
  id                            -- = auth.users.id
  company_id                    -- FK -> companies
  name, email
  role                          -- 'admin' | 'member'
  created_at

deals
  id
  company_id                   -- FK -> companies
  address
  market_id                    -- FK -> markets (company-scoped)
  property_type_id             -- FK -> property_types (global lookup)
  contract_price
  original_contract_price
  contract_date
  closing_date
  original_closing_date
  actual_closing_date
  due_diligence_expiration
  original_due_diligence_date
  projected_sales_price
  original_projected_sales_price
  deal_type_id                 -- FK -> deal_types (company-scoped)
  status_id                    -- FK -> deal_statuses (For Sale | Pending Sale | Closed | On Hold | Cancelled; global lookup)
  lead_source_id                -- FK -> lead_sources (company-scoped)
  custom_fields                -- JSONB, empty in Phase 0, used from Phase 2 on
  created_at

contacts
  id
  company_id
  name
  investor_llc_id              -- FK -> investor_llcs, nullable (Phase 3, leave column, don't build the linking UI yet)
  notes

contact_types (global lookup)
  id, name                     -- Investor, Realtor, Lender, Vendor, Seller, Mortgage Company, etc.

contact_contact_types (join)
  contact_id, contact_type_id  -- many-to-many: a contact can be multiple types

contact_phone_numbers
  id, contact_id, type_id, phone   -- unbounded child table, not fixed columns; type_id -> phone_types (global lookup)

contact_emails
  id, contact_id, type_id, email   -- type_id -> email_types (global lookup)
```

`markets`, `deal_types`, and `lead_sources` are company-scoped lookup tables (`company_id` + `name`), seeded with generic defaults per company at signup time by `/api/signup`. `deal_statuses`, `contact_types`, `property_types`, `phone_types`, and `email_types` are global, fixed lookups seeded once by migration. None of these have a Settings UI yet — that's Phase 2; for now they're only editable via SQL/the Supabase table editor.

Custom fields per company (Settings module) are Phase 2 — the `custom_fields` JSONB column above exists from the start so it's not a breaking migration later, but don't build any UI for it yet. The original app instead added ad-hoc named columns directly to the deal ("Test 1," "Test Text C," "Test NumA" are visible in its screens) — don't repeat that; anything that isn't a firm Phase 0 field belongs in `custom_fields`, not a new column.

## Business rules to encode carefully

- The "original vs. current" value pattern recurs across the whole model (original contract price vs. actual, original closing date vs. actual, etc. — see [docs/data-model.md](docs/data-model.md)). The rule for Phase 0: `closing_date` reflects the current expected/actual closing date and is recalculated server-side whenever the deal is renegotiated; `original_closing_date` and `original_contract_price` are set once at intake and never touched again. Never let the client compute and send the "current" values directly.
- Profit calculation logic lives in one shared server-side function, not duplicated across routes. This matters more once Phase 1 adds commissions and JV expenses — get the pattern right now with the simple formula so it's easy to extend.

## Roadmap

1. ~~**Phase 1 — Financial engine**: role-based commission rules, JV expense allocation, cascading gross/net profit, monthly/quarterly/yearly KPI reporting.~~ **Done.**
2. **Phase 2 — Operations** *(current)*: Employee Sentinel (roles, permissions, payroll), Transaction Guardian automation engine (event-triggered, named step ownership), per-company custom fields, full Settings module.
3. **Phase 3 — Platform**: multi-tenant licensing, API layer, automation marketplace between companies.

## Conventions

- TypeScript everywhere, strict mode on.
- API routes under `src/app/api/`; one responsibility per route.
- Every mutating route re-checks permissions server-side — the trigger for an action (a button, a form field changing) can live in the UI, but the authorization decision and the business-rule side effects never do.
- Commit small, deploy often — Phase 0 should be live on Vercel early, with real or test deal data, before Phase 1 work starts.
- When a calculation is genuinely conditional (commission rules, profit rollups), write it as a single well-tested function others call, not logic repeated inline wherever it's needed.

## Node version

Node **24+** is pinned via `engines` in [package.json](package.json) and `.nvmrc`, matching the Vercel project's Node.js Version setting (`realdealstmp`, scope `rerss-projects`). Run `nvm use` before working in this repo. (`@supabase/supabase-js` only requires `>=22`; 24 was chosen to match what Vercel already had set rather than pin behind it.)
