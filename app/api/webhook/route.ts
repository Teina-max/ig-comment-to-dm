import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { commentChangeSchema, webhookBodySchema } from "../../../src/types";

// Meta needs the raw body for signature verification — disable any caching.
export const dynamic = "force-dynamic";

/**
 * GET = webhook verification handshake.
 * Meta sends hub.mode / hub.verify_token / hub.challenge.
 */
export function GET(req: Request) {
  // Fail closed: a missing verify token must never validate an empty token.
  const expected = process.env.META_VERIFY_TOKEN;
  if (!expected) return new NextResponse("Server misconfigured", { status: 500 });

  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && challenge && token && safeEqual(token, expected)) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

/**
 * POST = comment events.
 * TODO (see plan.md Phase 2-3):
 *  1. verify X-Hub-Signature-256 over RAW bytes (done below)
 *  2. for each comment: RESERVE comment_id first (unique constraint) for
 *     idempotency, THEN matchKeyword → sendPrivateReply → mark dm_sent.
 *     See ARCHITECTURE.md — never "check then send" (race-prone on retries).
 */
export async function POST(req: Request) {
  const raw = Buffer.from(await req.arrayBuffer()); // raw bytes, not decoded text
  const signature = req.headers.get("x-hub-signature-256");
  if (!verifySignature(raw, signature)) {
    return new NextResponse("Bad signature", { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(raw.toString("utf8"));
  } catch {
    return new NextResponse("Malformed JSON", { status: 400 });
  }

  const parsed = webhookBodySchema.safeParse(json);
  if (!parsed.success) {
    // Acknowledge shapes we don't handle with 200 so Meta stops retrying.
    return new NextResponse("Ignored", { status: 200 });
  }

  // Keep "comments" changes; ignore other fields (e.g. "messages") on purpose.
  // But a change that IS "comments" yet fails the shape = likely a Meta contract
  // change — surface it (log + TODO alert), don't drop it silently.
  const comments = parsed.data.entry.flatMap((e) =>
    e.changes.flatMap((c) => {
      const r = commentChangeSchema.safeParse(c);
      if (r.success) return [r.data.value];
      if ((c as { field?: string }).field === "comments") {
        console.error("comments change failed validation (Meta shape change?)", r.error.issues);
        // TODO: alert via ALERT_WEBHOOK_URL so a contract change isn't invisible.
      }
      return [];
    }),
  );

  // TODO: reserve → matchKeyword → sendPrivateReply → mark dm_sent.
  void comments;
  return new NextResponse("OK", { status: 200 });
}

function verifySignature(raw: Buffer, signature: string | null): boolean {
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
