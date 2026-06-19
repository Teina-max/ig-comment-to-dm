import { NextResponse } from "next/server";

/**
 * OAuth callback — THE token bootstrap (this is what gets the first token into
 * the DB; without it the whole thing never runs).
 *
 * Flow (verify against live docs — see .claude/rules/token-lifecycle.md):
 *  1. User authorizes via the Instagram Login dialog → Meta redirects here with `?code=` and `?state=`.
 *  2. Exchange `code` → short-lived token (POST to the IG oauth/access_token endpoint).
 *  3. exchangeForLongLivedToken(shortLived) → ~60-day token.
 *  4. Upsert it into `ig_tokens` with `expires_at`. The webhook/cron read it from there.
 *
 * One-off: you run this once to seed the token. The cron keeps it fresh afterwards.
 * Alternative if you prefer no callback: a local seed script that does steps 2-4.
 *
 * ⚠️ SECURITY: this route writes the account's long-lived token. It MUST be guarded,
 * or anyone hitting it could overwrite ig_tokens with an attacker-authorized account.
 * - Verify `state` (anti-CSRF) against the value you generated when starting the flow.
 *   A per-flow random state in a signed cookie is the real fix; the OAUTH_STATE env
 *   below is the floor for a one-off seed.
 * - Lock the route once a token already exists (one-off seed), or put it behind admin auth.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const expectedState = process.env.OAUTH_STATE;
  if (!expectedState || state !== expectedState) {
    return new NextResponse("Invalid state", { status: 403 });
  }
  if (!code) return new NextResponse("Missing code", { status: 400 });

  // TODO: exchange code → short-lived → long-lived (meta-client), upsert ig_tokens.
  return new NextResponse(
    "TODO: implement token bootstrap (see .claude/rules/token-lifecycle.md)",
    { status: 501 },
  );
}
