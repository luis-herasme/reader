import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import type { AppEnv } from "../lib/appFactory";
import { prisma } from "../db";
import { optionalAuthMiddleware } from "../auth/authMiddleware";

const URL = process.env.DATA_URL;

// --- Search ---

const SearchInput = z.object({
  search: z.string(),
  page: z.coerce.number().min(0).int(),
  server: z.string(),
});

const SearchOutput = z.object({
  results: z.array(
    z.object({
      name: z.string(),
      image: z.string(),
      slug: z.string(),
    })
  ),
  next: z.boolean(),
});

export const searchRoute = createRoute({
  method: "get",
  path: "/api/novels/search",
  request: { query: SearchInput },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(SearchOutput, "Search results"),
  },
});

export const searchHandler: RouteHandler<typeof searchRoute, AppEnv> = async (c) => {
  const { search, page, server } = c.req.valid("query");
  const response = await fetch(URL + `/${server}/search/${search}/${page}`);
  return c.json(await response.json(), HttpStatusCodes.OK);
};

// --- Chapters ---

const ChaptersInput = z.object({
  slug: z.string(),
  server: z.string(),
});

const ChaptersOutput = z.array(
  z.object({
    title: z.string(),
    slug: z.string(),
  })
);

export const chaptersRoute = createRoute({
  method: "get",
  path: "/api/novels/chapters",
  request: { query: ChaptersInput },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(ChaptersOutput, "Chapter list"),
  },
});

export const chaptersHandler: RouteHandler<typeof chaptersRoute, AppEnv> = async (c) => {
  const { slug, server } = c.req.valid("query");
  const response = await fetch(URL + `/${server}/chapters/${slug}`);
  return c.json(await response.json(), HttpStatusCodes.OK);
};

// --- Chapter ---

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

export const chapterHandler: RouteHandler<typeof chapterRoute, AppEnv> = async (c) => {
  const { server, novel, chapter } = c.req.valid("query");
  const response = await fetch(
    URL + `/${server}/chapter/${novel}/${chapter}`
  );
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
