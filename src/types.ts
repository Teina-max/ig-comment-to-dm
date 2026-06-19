import { z } from "zod";

/**
 * A single "comments" change. The route re-validates each change with this and
 * ignores anything that doesn't match (see route.ts).
 * Verify the exact shape against the live webhook docs — Meta adds/renames fields.
 * https://developers.facebook.com/docs/instagram-platform/webhooks
 */
export const commentChangeSchema = z.object({
  field: z.literal("comments"),
  value: z.object({
    id: z.string(), // comment id — used as recipient.comment_id
    text: z.string(),
    from: z.object({ id: z.string(), username: z.string().optional() }),
    media: z.object({ id: z.string() }).optional(),
  }),
});

/**
 * Top-level webhook envelope. `changes` is intentionally LOOSE: a mixed payload
 * (e.g. once you also subscribe to "messages") must still parse. The route picks
 * out the "comments" changes with commentChangeSchema and ignores the rest —
 * never reject the whole payload, or Meta retries it forever.
 */
export const webhookBodySchema = z.object({
  object: z.literal("instagram"),
  entry: z.array(
    z.object({
      id: z.string(),
      time: z.number().optional(),
      changes: z.array(z.object({ field: z.string() }).passthrough()),
    }),
  ),
});

export type WebhookBody = z.infer<typeof webhookBodySchema>;
export type CommentEvent = z.infer<typeof commentChangeSchema>["value"];

export type KeywordRule = {
  id: string;
  keyword: string;
  responseText: string;
  resourceUrl: string;
  active: boolean;
};
