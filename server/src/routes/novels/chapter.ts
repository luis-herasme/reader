import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import type { AppEnv } from "../../lib/appFactory";
import { prisma } from "../../db";
import { optionalAuthMiddleware } from "../../auth/authMiddleware";

const URL = process.env.DATA_URL;

const ChapterInput = z.object({
  novel: z.string(),
  chapter: z.string(),
  server: z.string(),
});

const ChapterOutput = z.object({
  content: z.string(),
  next: z.string().nullable(),
  prev: z.string().nullable(),
  sentenceIndex: z.number().nullable(),
});

export const chapterRoute = createRoute({
  method: "get",
  path: "/api/novels/chapter",
  middleware: [optionalAuthMiddleware],
  request: { query: ChapterInput },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(ChapterOutput, "Chapter content"),
  },
});

export const chapterHandler: RouteHandler<typeof chapterRoute, AppEnv> = async (
  c,
) => {
  const { server, novel, chapter } = c.req.valid("query");
  const response = await fetch(URL + `/${server}/chapter/${novel}/${chapter}`);
  if (!response.ok) {
    throw new Error("Failed to fetch chapter");
  }
  const result = await response.json();
  let sentenceIndex = null;

  const user = c.get("user");
  if (user) {
    const history = await prisma.history.findFirst({
      where: {
        userId: user.id,
        slug: novel,
        chapter,
      },
      select: { sentenceIndex: true },
      orderBy: { updatedAt: "desc" },
    });

    if (history) {
      sentenceIndex = history.sentenceIndex;
    }
  }

  return c.json({ ...result, sentenceIndex }, HttpStatusCodes.OK);
};
