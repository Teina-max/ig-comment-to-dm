/**
 * All Meta / Instagram Graph API calls live here.
 *
 * ⚠️ FAST-MOVING API. Before trusting any path/version/scope below, verify
 * against the live docs (see docs/ARCHITECTURE.md). These are placeholders that
 * reflect the "Instagram API with Instagram Login" model — confirm them.
 */

const VERSION = process.env.META_API_VERSION ?? "v23.0";
const GRAPH = `https://graph.instagram.com/${VERSION}`;

/**
 * Send a private-reply DM in response to a comment.
 * One reply per comment, within 7 days, ~200/h/account.
 *
 * TODO: read the long-lived token from the `ig_tokens` table (src/lib/supabase),
 * not from env. Throttle to respect the rate limit. Handle/log Meta error bodies.
 */
export async function sendPrivateReply(
  commentId: string,
  text: string,
  accessToken: string,
): Promise<void> {
  const res = await fetch(`${GRAPH}/me/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      recipient: { comment_id: commentId },
      message: { text },
    }),
  });
  if (!res.ok) {
    // Fail loud — don't swallow. Don't log the token.
    throw new Error(`sendPrivateReply failed: ${res.status} ${await res.text()}`);
  }
}

/**
 * Exchange a short-lived token for a long-lived one (~60 days).
 * TODO: verify endpoint + params against live docs, persist result to ig_tokens.
 */
export async function exchangeForLongLivedToken(
  _shortLivedToken: string,
): Promise<{ accessToken: string; expiresInSec: number }> {
  throw new Error("TODO: implement long-lived token exchange (see token-lifecycle rule)");
}

/**
 * Refresh a long-lived token before it expires. Returns a NEW 60-day token.
 * TODO: verify endpoint, persist new token + expires_at, alert on failure.
 */
export async function refreshLongLivedToken(
  _currentToken: string,
): Promise<{ accessToken: string; expiresInSec: number }> {
  throw new Error("TODO: implement long-lived token refresh (see token-lifecycle rule)");
}
