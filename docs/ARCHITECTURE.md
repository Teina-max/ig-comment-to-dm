# Architecture

> Reflects the "Instagram API with Instagram Login" model. **Verify endpoints/version against live docs before coding** — see links at the bottom.

## Flow

```
Follower comments "GUIDE" under a reel
   │
   ▼   Meta delivers a webhook POST (field: "comments") to /api/webhook
[ app/api/webhook/route.ts ]
   │ 1. read RAW bytes, verify X-Hub-Signature-256 (HMAC-SHA256, app secret)
   │ 2. zod-parse envelope, pick out "comments" changes (ignore the rest)
   │ 3. RESERVE commentId in `leads` (unique insert) — idempotency guard, see below
   │ 4. matchKeyword(text) against active rules (Supabase: keyword_rules)
   │ 5. if match → sendPrivateReply → mark the lead dm_sent
   ▼
[ src/lib/meta-client.ts ] → POST graph.instagram.com/<v>/<ig-user-id>/messages
                              { recipient: { comment_id }, message: { text } }
```

## Components

| File | Responsibility |
|---|---|
| `app/api/webhook/route.ts` | `GET` = verification handshake; `POST` = comment event handler |
| `app/api/auth/callback/route.ts` | OAuth callback — **token bootstrap**: seeds the first long-lived token into `ig_tokens` |
| `app/api/cron/refresh-token/route.ts` | Vercel Cron target — refresh long-lived token before expiry |
| `src/lib/meta-client.ts` | All Meta API calls: send private reply, token exchange/refresh |
| `src/lib/keyword-matcher.ts` | Pure function: comment text → matched rule (or null) |
| `src/lib/supabase.ts` | Server-side Supabase client (service role) |
| `src/types.ts` | Shared types + zod schemas for webhook payloads |

## Data model (Supabase)

```
ig_tokens      ( id, access_token, expires_at, updated_at )          -- single row, the long-lived token
keyword_rules  ( id, keyword, response_text, resource_url, active )  -- the "GUIDE → link" mappings
leads          ( id, comment_id, from_username, rule_id, dm_sent, created_at )  -- log + dedup
```

RLS on all three. Webhook + cron run server-side with the service role; nothing client-facing needs these.

## Idempotency (reserve-first, not check-then-send)

Meta can redeliver a webhook, and two retries can arrive concurrently. "Check `leads`, then send" is race-prone — both reads miss, both send. Instead **reserve first**:

1. `INSERT` the `comment_id` into `leads` (it has a UNIQUE constraint). If the insert hits a conflict, another invocation already owns this comment → stop.
2. Only the invocation that won the insert proceeds to `sendPrivateReply`.
3. On success, update the row (`dm_sent = true`). On failure, leave it for inspection / a retry policy.

This way the unique constraint is the lock, not a prior read.

## Rate limiting (durable, not in-memory)

The ~200/h cap is per account. An in-memory throttle does NOT work on Vercel — each serverless invocation is isolated, so they can't share a counter. For low/normal volume, sending inline and returning 200 after the send is fine. If a reel can go viral, enqueue sends in a table and drain them with a cron/worker that respects the cap. Pick the simple path first; add the queue when volume demands it.

## Dev vs prod

- **Dev mode** (no App Review): everything above works for accounts with a role on the app. Build and test the full chain here first — mock the outbound Meta call in unit tests, hit the real one with your own account for the E2E check.
- **Prod**: needs App Review + Live mode (see `docs/SETUP-META.md`). No code difference — same token, same endpoints.

## Reference docs (verify before coding)

- Instagram Platform overview: https://developers.facebook.com/docs/instagram-platform
- Messaging / private replies: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api
- Webhooks: https://developers.facebook.com/docs/instagram-platform/webhooks
- Long-lived tokens: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/get-started
