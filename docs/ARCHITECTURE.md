# Architecture

> Reflects the "Instagram API with Instagram Login" model. **Verify endpoints/version against live docs before coding** — see links at the bottom.

## Flow

```
Follower comments "GUIDE" under a reel
   │
   ▼   Meta delivers a webhook POST (field: "comments") to /api/webhook
[ app/api/webhook/route.ts ]
   │ 1. read RAW body, verify X-Hub-Signature-256 (HMAC-SHA256, app secret)
   │ 2. zod-parse payload → extract { commentId, text, fromId, mediaId }
   │ 3. matchKeyword(text) against active rules (Supabase: keyword_rules)
   │ 4. if match → sendPrivateReply(commentId, rule.responseText)
   │ 5. log the lead (Supabase: leads) — no PII beyond what you need
   ▼
[ src/lib/meta-client.ts ] → POST graph.instagram.com/<v>/me/messages
                              { recipient: { comment_id }, message: { text } }
```

## Components

| File | Responsibility |
|---|---|
| `app/api/webhook/route.ts` | `GET` = verification handshake; `POST` = comment event handler |
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

## Idempotency

Meta can redeliver a webhook. Before sending, check `leads` for an existing `comment_id` — one private reply per comment is allowed anyway, a duplicate send will fail. Dedup on `comment_id` (unique constraint).

## Dev vs prod

- **Dev mode** (no App Review): everything above works for accounts with a role on the app. Build and test the full chain here first — mock the outbound Meta call in unit tests, hit the real one with your own account for the E2E check.
- **Prod**: needs App Review + Live mode (see `docs/SETUP-META.md`). No code difference — same token, same endpoints.

## Reference docs (verify before coding)

- Instagram Platform overview: https://developers.facebook.com/docs/instagram-platform
- Messaging / private replies: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api
- Webhooks: https://developers.facebook.com/docs/instagram-platform/webhooks
- Long-lived tokens: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/get-started
