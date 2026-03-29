import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import type { AppEnv } from "../../lib/appFactory";
import { prisma } from "../../db";

const ChaptersInput = z.object({
  bookId: z.string().uuid(),
  skip: z.coerce.number().min(0).int().default(0),
  take: z.coerce.number().min(1).max(100).int().default(100),
});

const ChapterItem = z.object({
  chapterId: z.string(),
  title: z.string(),
  number: z.number(),
});

const ChaptersOutput = z.object({
  chapters: z.array(ChapterItem),
  total: z.number(),
});

export const chaptersRoute = createRoute({
  method: "get",
  path: "/api/novels/chapters",
  request: { query: ChaptersInput },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(ChaptersOutput, "Chapter list"),
  },
});

export const chaptersHandler: RouteHandler<
  typeof chaptersRoute,
  AppEnv
> = async (context) => {
  const { bookId, skip, take } = context.req.valid("query");

  const [chapters, total] = await Promise.all([
    prisma.chapter.findMany({
      where: { bookId },
      skip,
      take,
      orderBy: { number: "asc" },
      select: { id: true, title: true, number: true },
    }),
    prisma.chapter.count({ where: { bookId } }),
  ]);

  const results = chapters.map((chapter) => ({
    chapterId: chapter.id,
    title: chapter.title,
    number: chapter.number,
  }));

  return context.json({ chapters: results, total }, HttpStatusCodes.OK);
};
