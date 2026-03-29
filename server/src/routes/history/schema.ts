import { z } from "@hono/zod-openapi";

export const HistorySchema = z.object({
  userId: z.string(),
  bookId: z.string(),
  chapterId: z.string(),
  sentenceIndex: z.number(),
  length: z.number(),
  updatedAt: z.coerce.string(),
  createdAt: z.coerce.string(),
});

export const HistoryWithBookSchema = z.object({
  userId: z.string(),
  bookId: z.string(),
  chapterId: z.string(),
  sentenceIndex: z.number(),
  length: z.number(),
  updatedAt: z.coerce.string(),
  createdAt: z.coerce.string(),
  book: z.object({
    id: z.string(),
    title: z.string(),
    imageId: z.string().nullable(),
  }),
  chapter: z.object({
    id: z.string(),
    title: z.string(),
    number: z.number(),
  }),
});

export const HistoryWithChapterSchema = z.object({
  userId: z.string(),
  bookId: z.string(),
  chapterId: z.string(),
  sentenceIndex: z.number(),
  length: z.number(),
  updatedAt: z.coerce.string(),
  createdAt: z.coerce.string(),
  chapter: z.object({
    id: z.string(),
    title: z.string(),
    number: z.number(),
  }),
});
