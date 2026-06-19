# CLAUDE.md — IG Comment-to-DM

Instructions for the Claude Code agent building this project. Read this, `docs/ARCHITECTURE.md`, and `plan.md` before writing code.

## What this is

A self-hosted replacement for ManyChat's "comment a keyword → get a DM" flow, for **one** Instagram Professional account. A follower comments a keyword under a reel; a webhook fires; we send a private-reply DM containing a free resource link.

## Stack (do not swap without asking the user)

- **Next.js 16** App Router, TypeScript strict, ESM.
- **Bun** as package manager and dev runtime (`bun install`, `bun run dev`). Never `npm`.
- **Supabase** for persistence (tokens, keyword rules, lead log). RLS on every table.
- **Vercel** for hosting (webhook route + cron). Stay inside free tiers.

## Conventions

- `camelCase` for vars/functions, `PascalCase` for types.
- No secrets in code — everything via env vars (see `.env.example`). Never log a token.
- Validate every external input at the boundary (webhook payloads, Meta API responses) with `zod`.
- Fail fast: surface errors, don't swallow them in silent fallbacks.
- Keep files focused: one responsibility per file, split past ~200 lines.

## The single most important rule

**This is a fast-moving Meta API.** Endpoint paths, API version (`v23.0`+), and permission names change. The snippets in this repo reflect the "Instagram API with Instagram Login" model and may be stale. **Before implementing any Meta call, verify the current endpoint, version, and permission scope against the live Meta docs** linked in `docs/ARCHITECTURE.md`. Do not trust the placeholder code blindly.

## What you (the agent) CANNOT do — tell the user instead

These steps are manual clickops in the Meta dashboard. When the plan reaches them, **stop and tell the user to follow `docs/SETUP-META.md`**:

- Creating the Meta app, switching the IG account to Professional.
- Linking permissions, configuring the webhook subscription in the dashboard.
- **App Review submission** (required to DM the public). This is the hard gate.
- Pasting the resulting credentials into `.env.local` / Vercel env.

Build everything that can be tested in **development mode** first (the app can only DM accounts that have a role on the app until App Review passes). Don't block the whole build on App Review.

## Definition of done per task

Each task in `plan.md` is done when: code compiles (`bun run build`), inputs are validated, no secret is hardcoded, and the behaviour is verified locally (webhook GET verification returns the challenge; a simulated `comments` POST triggers a private-reply call — mock the Meta endpoint in dev).
