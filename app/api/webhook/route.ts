import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { webhookBodySchema } from "../../../src/types";

// Meta needs the raw body for signature verification — disable any caching.
export const dynamic = "force-dynamic";

/**
 * GET = webhook verification handshake.
 * Meta sends hub.mode / hub.verify_token / hub.challenge.
 */
export function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const expected = process.env.META_VERIFY_TOKEN ?? "";
  if (mode === "subscribe" && challenge && safeEqual(token ?? "", expected)) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

/**
 * POST = comment events.
 * TODO (see plan.md Phase 2-3):
 *  1. verify X-Hub-Signature-256 against the RAW body (done below)
 *  2. zod-parse, extract comment events
 *  3. matchKeyword against active rules (Supabase)
 *  4. sendPrivateReply + log lead (dedup on comment_id)
 * Always return 200 fast so Meta doesn't retry; do work async if needed.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-hub-signature-256");
  if (!verifySignature(raw, signature)) {
    return new NextResponse("Bad signature", { status: 401 });
  }

  const parsed = webhookBodySchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    return new NextResponse("Bad payload", { status: 400 });
  }

  // TODO: for each entry.changes[].value → matchKeyword → sendPrivateReply → log.
  return new NextResponse("OK", { status: 200 });
}

function verifySignature(raw: string, signature: string | null): boolean {
  const secret = process.env.META_APP_SECRET;
  if (!secret || !signature) return false;
  const expected = "sha256=" + createHmac("sha256", secret).update(raw).digest("hex");
  return safeEqual(signature, expected);
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
