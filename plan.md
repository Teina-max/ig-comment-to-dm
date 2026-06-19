# Implementation plan

Bite-sized tasks for the agent. Do them in order. After each: `bun run build` must pass and no secret is hardcoded. Check the box when done. Steps marked 👤 are **manual user actions** — stop and point the user to `docs/SETUP-META.md`.

## Phase 0 — Scaffold

- [ ] Init Next.js 16 (App Router, TS strict) with Bun. Keep the provided `package.json` deps; `bun install`.
- [ ] Add `tsconfig.json` (strict), `next.config.js`, base App Router files.
- [ ] Wire `src/lib/supabase.ts` (server client, service role from env).

## Phase 1 — Webhook verification (no Meta account needed yet)

- [ ] Implement `GET /api/webhook`: return `hub.challenge` when `hub.verify_token === META_VERIFY_TOKEN`, else 403. Constant-time compare.
- [ ] Unit test the handshake.

## Phase 2 — Comment event handling (testable with mocked payloads)

- [ ] In `src/types.ts`: zod schema for the `comments` webhook payload; export inferred types.
- [ ] `POST /api/webhook`: read **raw** body, verify `X-Hub-Signature-256` (HMAC-SHA256 with app secret, constant-time), then zod-parse.
- [ ] `src/lib/keyword-matcher.ts`: pure `matchKeyword(text, rules)` → rule | null (case-insensitive, trim, whole-word). Unit test it hard — this is pure logic, cover edge cases.
- [ ] **Reserve-first** (idempotency): `INSERT` the `comment_id` into `leads` (unique constraint). On conflict → another invocation owns it, stop. Only the winner calls `sendPrivateReply` (mock in tests), then sets `dm_sent`. Never "check then send". See ARCHITECTURE.md.

## Phase 3 — Meta client + Supabase schema

- [ ] Supabase migrations: `ig_tokens`, `keyword_rules`, `leads` with RLS. Unique index on `leads.comment_id`.
- [ ] `src/lib/meta-client.ts`:
  - [ ] `sendPrivateReply(commentId, text)` → POST `<ig-user-id>/messages` with `{ recipient: { comment_id }, message: { text } }`. **Verify endpoint/version against live docs.**
  - [ ] `exchangeForLongLivedToken(shortLived)` and `refreshLongLivedToken(current)`.
- [ ] **Token bootstrap** — implement `app/api/auth/callback/route.ts`: exchange `code` → short-lived → long-lived → upsert `ig_tokens`. This is what gets the FIRST token into the DB; without it nothing runs. (Or a one-off local seed script doing the same steps.)
- [ ] Rate limit: send inline for normal volume. If virality is likely, design a durable queue table + cron drain that respects ~200/h — NOT an in-memory throttle (serverless invocations are isolated).

## Phase 4 — Token refresh cron

- [ ] `GET /api/cron/refresh-token`: guard with `CRON_SECRET` (Authorization header). Refresh if within ~10 days of `expires_at`; persist new token + `expires_at`.
- [ ] `vercel.json`: schedule the cron (e.g. weekly).
- [ ] On refresh failure → POST `ALERT_WEBHOOK_URL`. Do not fail silently.

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
