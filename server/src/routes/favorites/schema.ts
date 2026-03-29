import { z } from "@hono/zod-openapi";

export const FavoriteSchema = z.object({
  userId: z.string(),
  slug: z.string(),
  server: z.string(),
  updatedAt: z.coerce.string(),
  createdAt: z.coerce.string(),
});
