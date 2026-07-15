# Architecture Decision — Real Estate Deal & Transaction Management Platform

## Decision

Build on a **custom Next.js + Postgres stack**, with Claude doing the
implementation work directly (via the Claude Code extension in VS Code), rather
than a no-code or no-code/low-code hybrid platform.

## Why this over a no-code hybrid (Bubble + Xano)

The earlier version of this concept was built in Bubble alone and struggled
specifically with cascading, conditional financial logic — commission rules that
vary by role/deal type/event, JV expense allocation, and gross/net profit that has
to recalculate correctly as those inputs change. That's a rules-engine problem,
and Bubble's visual workflow model (built for UI-triggered actions, not
multi-condition financial rules) is the wrong tool for it.

A hybrid of Bubble (UI) + Xano (backend logic) would fix the immediate rules-engine
problem, but only partially addresses the reason this is being rebuilt: the
original client's concern that the platform can't scale to 100–300 companies and
can't adapt as AI becomes part of the product. Bubble remains the front end in
that scenario, still billed on workload units, still not built for embedding real
AI agents into the product. It pushes the ceiling further out; it doesn't remove
it.

Owning the stack outright removes it. No workload-unit billing, no platform
ceiling, and AI features (agents, retrieval, automations) are a normal engineering
task rather than a plugin workaround.

## The honest trade-off

No-code hybrid: faster to get a personally-editable first demo screen up, and
non-technical changes don't require touching a codebase. Custom code: changes go
through an actual codebase — but with Claude writing, testing, and deploying that
code directly, the traditional "no-code is faster" gap is much smaller than it
used to be, while the long-term ceiling problem disappears entirely instead of
being pushed further out. Given this is a deliberate, from-scratch rebuild (not a
quick validation throwaway), the long-term ceiling matters more than the
short-term convenience.

## Recommended stack

| Layer | Tool | Why |
|---|---|---|
| Application (front end + backend) | **Next.js** (App Router, TypeScript) | One codebase for UI and server-side logic — no separate platforms to keep in sync. |
| Database | **Postgres** via **Supabase** | Real relational database. JSONB columns handle per-company custom fields cleanly (Phase 2); a proper schema handles deal/commission/JV cascades cleanly. |
| Auth | **Supabase Auth** | Login handled by a standard library; role/permission checks enforced server-side on every request, never inferred from the UI alone. |
| AI / agent layer (later phases) | Direct **Anthropic API** calls from backend routes, optional pgvector for retrieval | Adding an AI assistant or agentic automation later is a normal code change. |
| Hosting | **Vercel** (app) + Supabase (managed Postgres) | Usage-based pricing that scales smoothly; no workload-unit throttling, no risk of the app going offline from a traffic spike. |

## Alternatives considered and rejected

- **Pure Bubble**: reintroduces the exact cascading-logic problem that made the
  original build difficult. Rejected.
- **Bubble + Xano hybrid**: fixes the logic problem, doesn't fix the platform
  ceiling or AI-adaptability concern that motivated the rebuild. Reasonable
  fallback if development speed becomes a hard constraint, but not the
  recommendation.
- **Fully custom code without AI assistance** (traditional hand-coded build via a
  hired developer): same long-term benefits as the recommended path, but slower
  and more expensive to reach MVP. The Claude-assisted version captures most of
  the benefit without that cost.
- **Google Antigravity** (agentic IDE): capable, but built Gemini-first — Claude
  access requires a separate bring-your-own API key rather than being the native
  path. Not the right fit for a Claude-first build.

## Development environment

- **VS Code + Claude Code extension** as the primary build environment — real
  file tree, integrated terminal, native git, and it's portable if a hired
  developer ever needs to join later.
- **GitHub** for version control, **Vercel** for hosting/deploy, **Supabase** for
  the database — all free-tier to start.
- Project context persists across sessions via `CLAUDE.md` at the repo root (see
  that file for current phase scope, data model, and conventions) plus Claude
  Code's automatic session memory.
