# Implementation plan

Bite-sized tasks for the agent. Do them in order. After each: `bun run build` must pass and no secret is hardcoded. Check the box when done. Steps marked 👤 are **manual user actions** — stop and point the user to `docs/SETUP-META.md`.

## Current scaffold state (as of 2026-06-29)

This kit ships with part of the skeleton **already implemented and reviewed** — the rest is left as explicit `TODO` markers in the code. Quick recap for whoever picks this up.

**Already done (boxes checked below):**
- Webhook verification handshake `GET /api/webhook` (constant-time compare).
- `POST /api/webhook`: raw-body read + `X-Hub-Signature-256` verification + zod-parse of the envelope (the keep/ignore split for `comments` vs other fields is wired).
- Zod schemas (`src/types.ts`) and the service-role Supabase client (`src/lib/supabase.ts`).
- `sendPrivateReply()` — the DM HTTP call (endpoint/version still to reconfirm against live docs).
- `matchKeyword()` — logic written (case-insensitive, accent-folding, whole-word) but **not yet unit-tested**.
- Security floors in place: OAuth callback `state` (CSRF) guard, cron `CRON_SECRET` guard.

**Not done yet (the functional core):**
- **Phase 0 is missing**: no `bun install`, no `tsconfig.json` / `next.config` / `vercel.json` → the app does not build yet. **Start here.**
- Supabase migrations (`ig_tokens`, `keyword_rules`, `leads` + RLS + unique index on `comment_id`).
- POST handler body: reserve-first → `matchKeyword` → `sendPrivateReply` → set `dm_sent`.
- Token bootstrap (code→long-lived exchange), refresh cron logic, alerting, real `/healthz` checks, and the test suite.

## Phase 0 — Scaffold

- [ ] Init Next.js 16 (App Router, TS strict) with Bun. Keep the provided `package.json` deps; `bun install`.
- [ ] Add `tsconfig.json` (strict), `next.config.js`, base App Router files.
- [x] Wire `src/lib/supabase.ts` (server client, service role from env).

## Phase 1 — Webhook verification (no Meta account needed yet)

- [x] Implement `GET /api/webhook`: return `hub.challenge` when `hub.verify_token === META_VERIFY_TOKEN`, else 403. Constant-time compare.
- [ ] Unit test the handshake.

## Phase 2 — Comment event handling (testable with mocked payloads)

- [x] In `src/types.ts`: zod schema for the `comments` webhook payload; export inferred types.
- [x] `POST /api/webhook`: read **raw** body, verify `X-Hub-Signature-256` (HMAC-SHA256 with app secret, constant-time), then zod-parse.
- [ ] `src/lib/keyword-matcher.ts`: pure `matchKeyword(text, rules)` → rule | null (case-insensitive, trim, whole-word). Unit test it hard — this is pure logic, cover edge cases.
- [ ] **Reserve-first** (idempotency): `INSERT` the `comment_id` into `leads` (unique constraint). On conflict → another invocation owns it, stop. Only the winner calls `sendPrivateReply` (mock in tests), then sets `dm_sent`. Never "check then send". See ARCHITECTURE.md.

## Phase 3 — Meta client + Supabase schema

- [ ] Supabase migrations: `ig_tokens`, `keyword_rules`, `leads` with RLS. Unique index on `leads.comment_id`.
- [ ] `src/lib/meta-client.ts`:
  - [x] `sendPrivateReply(commentId, text)` → POST `<ig-user-id>/messages` with `{ recipient: { comment_id }, message: { text } }`. **Verify endpoint/version against live docs.**
  - [ ] `exchangeForLongLivedToken(shortLived)` and `refreshLongLivedToken(current)`.
- [ ] **Token bootstrap** — implement `app/api/auth/callback/route.ts`: exchange `code` → short-lived → long-lived → upsert `ig_tokens`. This is what gets the FIRST token into the DB; without it nothing runs. (Or a one-off local seed script doing the same steps.)
- [ ] Rate limit: send inline for normal volume. If virality is likely, design a durable queue table + cron drain that respects ~200/h — NOT an in-memory throttle (serverless invocations are isolated).

## Phase 4 — Token refresh cron

- [ ] `GET /api/cron/refresh-token`: guard with `CRON_SECRET` (Authorization header). Refresh if within ~10 days of `expires_at`; persist new token + `expires_at`.
- [ ] `vercel.json`: schedule the cron (e.g. weekly).
- [ ] On refresh failure → POST `ALERT_WEBHOOK_URL`. Do not fail silently.

## Phase 4.5 — Observability & self-healing (REQUIRED — this is a maintained service)

This service is operated by the user's agent, not a dev. It must surface its own failures and be diagnosable. See `docs/MAINTENANCE.md` + `.claude/rules/maintenance.md`.

- [ ] `GET /api/healthz`: real checks (token present, `expires_at` in future with margin, Supabase reachable). 200 all-green, 503 otherwise.
- [ ] **Alerting** to `ALERT_WEBHOOK_URL` on: token refresh failure, repeated send failure, signature-failure spike, `comments` change that fails the schema. Each alert says what to do (open agent / escalate).
- [ ] Structured logging on webhook + cron + send (ids you need to debug, never tokens/PII).
- [ ] Retry-with-backoff on transient send failures (respect ~200/h).

## Phase 5 — Deploy + Meta wiring (manual)

- [ ] Deploy to Vercel. Set all env vars (from `.env.example`) in the Vercel dashboard.
- [ ] 👤 User: follow `docs/SETUP-META.md` steps 1–4 (create app, add Instagram product, set webhook URL = the Vercel URL, subscribe to `comments`).
- [ ] Seed one row in `keyword_rules` (e.g. `GUIDE` → resource link).
- [ ] **E2E dev test**: comment the keyword under the user's own post → confirm the DM arrives. (Dev mode works for accounts with a role on the app.)

## Phase 6 — Go to the public (manual gate)

- [ ] Generate a simple hosted privacy policy page (the agent can build `/privacy`).
- [ ] 👤 User: submit **App Review** for `instagram_business_manage_messages` + `instagram_business_manage_comments` (demo video + privacy URL). See `docs/SETUP-META.md` step 5.
- [ ] 👤 User: switch the app to **Live** once approved.

## Optional / later

- [ ] Tiny admin page to manage `keyword_rules` (instead of editing Supabase directly).
- [ ] Handle `messages` field for a follow-up DM sequence.
- [ ] Dashboard of captured leads.
