import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Vercel Cron target — refresh the long-lived token before it expires.
 * Scheduled in vercel.json (e.g. weekly). See .claude/rules/token-lifecycle.md.
 *
 * TODO:
 *  1. Read the token + expires_at from `ig_tokens`.
 *  2. If within ~10 days of expiry → refreshLongLivedToken() → upsert new token + expires_at.
 *  3. On failure → POST ALERT_WEBHOOK_URL. NEVER fail silently — a dead token = a dead launch.
 */
export async function GET(req: Request) {
  // Protect the route: Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`.
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // TODO: refresh-if-near-expiry logic.
  return new NextResponse("TODO: implement token refresh", { status: 501 });
}
