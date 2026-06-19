# Token lifecycle — the silent killer

The #1 reason a self-hosted comment-to-DM stops working: **the access token expired and nobody noticed.** Build refresh in from day one.

## Flow (Instagram Login)

1. OAuth gives a **short-lived** token (~1h).
2. Exchange it for a **long-lived** token (~60 days):
   `GET https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=<APP_SECRET>&access_token=<SHORT_LIVED>`
3. **Refresh** the long-lived token before it expires (valid after it's at least 24h old, must be refreshed before day 60):
   `GET https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=<LONG_LIVED>`

Each refresh returns a **new** 60-day token — persist it, replacing the old one.

## Implementation requirements

- Store the token + its `expires_at` in Supabase (table `ig_tokens`), never in env vars (env can't be rotated at runtime).
- A **Vercel Cron** (e.g. weekly) calls a `/api/cron/refresh-token` route that refreshes any token within ~10 days of expiry and updates `expires_at`.
- Protect the cron route with a secret (`CRON_SECRET`) — Vercel sends it in the `Authorization` header.
- **Alert on failure.** If a refresh fails, send yourself a notification (email/Telegram). A silently dead token = a dead launch. This is the difference between a toy and something you can rely on.

## Verify the actual endpoint/version

Confirm the exchange/refresh endpoints against the live Meta docs before coding — paths and the `graph.instagram.com` vs `graph.facebook.com` host have changed across versions.
