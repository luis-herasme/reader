import { z } from "@hono/zod-openapi";

export const FavoriteSchema = z.object({
  userId: z.string(),
  bookId: z.string(),
  updatedAt: z.coerce.string(),
  createdAt: z.coerce.string(),
});

export const FavoriteWithBookSchema = z.object({
  userId: z.string(),
  bookId: z.string(),
  updatedAt: z.coerce.string(),
  createdAt: z.coerce.string(),
  book: z.object({
    id: z.string(),
    title: z.string(),
    imageId: z.string().nullable(),
  }),
});
