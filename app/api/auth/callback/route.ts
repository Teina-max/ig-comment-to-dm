import { NextResponse } from "next/server";

/**
 * OAuth callback — THE token bootstrap (this is what gets the first token into
 * the DB; without it the whole thing never runs).
 *
 * Flow (verify against live docs — see .claude/rules/token-lifecycle.md):
 *  1. User authorizes via the Instagram Login dialog → Meta redirects here with `?code=`.
 *  2. Exchange `code` → short-lived token (POST to the IG oauth/access_token endpoint).
 *  3. exchangeForLongLivedToken(shortLived) → ~60-day token.
 *  4. Upsert it into `ig_tokens` with `expires_at`. The webhook/cron read it from there.
 *
 * One-off: you run this once to seed the token. The cron keeps it fresh afterwards.
 * Alternative if you prefer no callback: a local seed script that does steps 2-4.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (!code) return new NextResponse("Missing code", { status: 400 });

  // TODO: exchange code → short-lived → long-lived (meta-client), upsert ig_tokens.
  return new NextResponse(
    "TODO: implement token bootstrap (see .claude/rules/token-lifecycle.md)",
    { status: 501 },
  );
}
