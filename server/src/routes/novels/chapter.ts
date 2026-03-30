import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import type { AppEnv } from "../../lib/app-factory";
import { ErrorSchema } from "../../lib/error-schema";
import { prisma } from "../../db";
import { optionalAuthMiddleware } from "../../auth/auth-middleware";

const ChapterInput = z.object({
  chapterId: z.string().uuid(),
});

const ChapterOutput = z.object({
  bookId: z.string(),
  bookTitle: z.string(),
  chapterTitle: z.string(),
  content: z.string(),
  nextChapterId: z.string().nullable(),
  previousChapterId: z.string().nullable(),
  sentenceIndex: z.number().nullable(),
});

export const chapterRoute = createRoute({
  method: "get",
  path: "/api/novels/chapter",
  middleware: [optionalAuthMiddleware],
  request: { query: ChapterInput },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(ChapterOutput, "Chapter content"),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(ErrorSchema, "Chapter not found"),
  },
});

export const chapterHandler: RouteHandler<typeof chapterRoute, AppEnv> = async (
  context,
) => {
  const { chapterId } = context.req.valid("query");

  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: { book: { select: { id: true, title: true } } },
  });

  if (!chapter) {
    return context.json(
      { error: "Chapter not found" },
      HttpStatusCodes.NOT_FOUND,
    );
  }

  const [nextChapter, previousChapter] = await Promise.all([
    prisma.chapter.findFirst({
      where: { bookId: chapter.bookId, number: chapter.number + 1 },
      select: { id: true },
    }),
    prisma.chapter.findFirst({
      where: { bookId: chapter.bookId, number: chapter.number - 1 },
      select: { id: true },
    }),
  ]);

  let sentenceIndex: number | null = null;
  const user = context.get("user");
  if (user) {
    const history = await prisma.history.findUnique({
      where: { userId_chapterId: { userId: user.id, chapterId } },
      select: { sentenceIndex: true },
    });

    if (history) {
      sentenceIndex = history.sentenceIndex;
    }
  }

  return context.json(
    {
      bookId: chapter.bookId,
      bookTitle: chapter.book.title,
      chapterTitle: chapter.title,
      content: chapter.content,
      nextChapterId: nextChapter?.id ?? null,
      previousChapterId: previousChapter?.id ?? null,
      sentenceIndex,
    },
    HttpStatusCodes.OK,
  );
};
