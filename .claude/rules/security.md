# Security rules

- **No secrets in code or git.** App secret, tokens, Supabase service key, cron secret → env vars only. `.env.local` is gitignored; `.env.example` documents the names with empty values.
- **Verify the webhook signature** (`X-Hub-Signature-256`) on every POST before trusting the payload. An unsigned/mismatched request is hostile — reject it.
- **RLS on every Supabase table.** The webhook/cron use the service role server-side only; never expose the service key to the client.
- **Constant-time comparison** for the verify token and signature (avoid timing leaks).
- **Validate payloads with zod** before use — never index into `entry[0].changes[0].value.text` without checking the shape.
- **Never log tokens or full payloads** containing PII (commenter usernames/ids). Log ids you need for debugging, not the whole object.
- **Rate-limit / throttle** outbound DMs to respect the 200/h cap and avoid Meta flagging the app as spam.
