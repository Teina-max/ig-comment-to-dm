import { z } from "zod";

/**
 * Instagram "comments" webhook payload (Instagram Login model).
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

export const webhookBodySchema = z.object({
  object: z.literal("instagram"),
  entry: z.array(
    z.object({
      id: z.string(),
      time: z.number().optional(),
      changes: z.array(commentChangeSchema),
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
