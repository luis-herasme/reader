import { z } from "@hono/zod-openapi";

export const HistorySchema = z.object({
  userId: z.string(),
  slug: z.string(),
  chapter: z.string(),
  server: z.string(),
  sentenceIndex: z.number(),
  length: z.number(),
  updatedAt: z.coerce.string(),
  createdAt: z.coerce.string(),
});
