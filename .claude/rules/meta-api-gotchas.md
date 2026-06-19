# Meta / Instagram API gotchas

## Always verify against live docs first

This API changes often. Before coding any call, confirm the current version + endpoint + scope names at:
- Instagram Platform (Instagram Login): https://developers.facebook.com/docs/instagram-platform
- Private Replies / messaging: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api
- Webhooks (comments field): https://developers.facebook.com/docs/instagram-platform/webhooks

## Webhook verification (GET)

Meta sends `hub.mode=subscribe`, `hub.verify_token`, `hub.challenge`. Respond `200` with the **raw `hub.challenge` value** as the body **only if** `hub.verify_token` equals your configured `META_VERIFY_TOKEN`. Otherwise `403`.

## Webhook payload (POST) — verify the signature

Meta signs the raw body with `X-Hub-Signature-256: sha256=<hmac>`. Compute HMAC-SHA256 of the **raw, unparsed** request body using your app secret and constant-time compare. Reject mismatches. (Next.js: read the RAW bytes via `await req.arrayBuffer()` and HMAC those — do NOT HMAC decoded or re-serialized text, the bytes must match exactly.)

A `comments` event looks like: `entry[].changes[]` with `field: "comments"` and `value` containing `id` (comment id), `text`, `from { id, username }`, `media { id }`.

## Private reply (the DM)

- One private reply **per comment**, within a **7-day** window. A second attempt on the same comment fails.
- Rate limit ~**200 messages/hour/account**. Queue/throttle if a reel goes viral.
- `recipient` is `{ comment_id }` (NOT a user id) — this is what makes it a comment-triggered private reply.
- Non-followers receive it in "Message Requests", followers in the main inbox. Expect lower open rates from non-followers.

## Access modes

- **Development mode**: the app can only message accounts that have a **role** on the app (admin/dev/tester). Use this to build and test end-to-end without App Review.
- **Live + Advanced Access**: required to message the **public**. Gated behind **App Review**. No code path around it.

## Compliance

Official API only triggers from a **user-initiated action** (their comment). No cold outreach. Don't try to broaden beyond the comment trigger — it violates Meta's terms and gets the app banned.
