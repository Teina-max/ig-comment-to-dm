import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Health check — the first thing the maintenance agent reads when something breaks.
 * See docs/MAINTENANCE.md. Returns JSON so an agent (or an uptime monitor) can parse it.
 *
 * TODO: fill in the real checks against Supabase `ig_tokens`:
 *  - token present?           (missing → bootstrap never ran)
 *  - token expires_at in future, with margin? (expired/near → cron should refresh)
 *  - Supabase reachable?      (infra down)
 * Return 200 only when all green; 503 otherwise so monitors can alert.
 */
export async function GET() {
  // TODO: query ig_tokens + ping Supabase, compute real status.
  const checks = {
    tokenPresent: null as boolean | null,
    tokenValid: null as boolean | null, // expires_at in the future with margin
    supabaseReachable: null as boolean | null,
  };

  const allGreen = Object.values(checks).every((v) => v === true);
  return NextResponse.json(
    { status: allGreen ? "ok" : "unknown", checks, note: "TODO: implement checks" },
    { status: allGreen ? 200 : 503 },
  );
}
