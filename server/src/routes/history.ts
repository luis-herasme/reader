import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import type { AppEnv } from "../lib/appFactory";
import { prisma } from "../db";
import { authMiddleware } from "../auth/authMiddleware";

const HistorySchema = z.object({
  userId: z.string(),
  slug: z.string(),
  chapter: z.string(),
  server: z.string(),
  sentenceIndex: z.number(),
  length: z.number(),
  updatedAt: z.coerce.string(),
  createdAt: z.coerce.string(),
});

// --- Get Novels ---

export const getNovelsRoute = createRoute({
  method: "get",
  path: "/api/history/novels",
  middleware: [authMiddleware],
  responses: {
    [HttpStatusCodes.OK]: jsonContent(z.array(HistorySchema), "List of novels with history"),
  },
});

export const getNovelsHandler: RouteHandler<typeof getNovelsRoute, AppEnv> = async (c) => {
  const user = c.get("user")!;

  return c.json(
    await prisma.history.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      distinct: ["slug"],
    }),
    HttpStatusCodes.OK
  );
};

// --- Novel History ---

export const novelHistoryRoute = createRoute({
  method: "get",
  path: "/api/history/novel",
  middleware: [authMiddleware],
  request: {
    query: z.object({
      slug: z.string(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(z.array(HistorySchema), "Chapter history for a novel"),
  },
});

export const novelHistoryHandler: RouteHandler<typeof novelHistoryRoute, AppEnv> = async (c) => {
  const { slug } = c.req.valid("query");
  const user = c.get("user")!;

  const chapters = await prisma.history.findMany({
    where: { userId: user.id, slug },
  });

  return c.json(chapters, HttpStatusCodes.OK);
};

// --- Add ---

export const addHistoryRoute = createRoute({
  method: "post",
  path: "/api/history",
  middleware: [authMiddleware],
  request: {
    body: jsonContentRequired(z.object({
      slug: z.string(),
      chapter: z.string(),
      server: z.string(),
      sentenceIndex: z.number(),
      length: z.number(),
    }), "History entry to add"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(HistorySchema, "History entry added"),
  },
});

export const addHistoryHandler: RouteHandler<typeof addHistoryRoute, AppEnv> = async (c) => {
  const { slug, server, chapter, sentenceIndex, length } = c.req.valid("json");
  const user = c.get("user")!;

  const entry = await prisma.history.upsert({
    where: {
      userId_slug_chapter_server: {
        slug, chapter, server, userId: user.id,
      },
    },
    create: { slug, chapter, server, sentenceIndex, length, userId: user.id },
    update: { length, sentenceIndex },
  });

  return c.json(entry, HttpStatusCodes.OK);
};

// --- Clear Novel History ---

export const clearNovelHistoryRoute = createRoute({
  method: "delete",
  path: "/api/history/novel",
  middleware: [authMiddleware],
  request: {
    query: z.object({
      slug: z.string(),
      server: z.string(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(z.object({ count: z.number() }), "Novel history cleared"),
  },
});

export const clearNovelHistoryHandler: RouteHandler<typeof clearNovelHistoryRoute, AppEnv> = async (c) => {
  const { slug, server } = c.req.valid("query");
  const user = c.get("user")!;

  const result = await prisma.history.deleteMany({
    where: { userId: user.id, server, slug },
  });

  return c.json(result, HttpStatusCodes.OK);
};

// --- Read ---

export const readHistoryRoute = createRoute({
  method: "get",
  path: "/api/history",
  middleware: [authMiddleware],
  request: {
    query: z.object({
      slug: z.string(),
      chapter: z.string(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(HistorySchema.nullable(), "History entry"),
  },
});

export const readHistoryHandler: RouteHandler<typeof readHistoryRoute, AppEnv> = async (c) => {
  const { slug, chapter } = c.req.valid("query");
  const user = c.get("user")!;

  const entry = await prisma.history.findFirst({
    where: { userId: user.id, slug, chapter },
  });

  return c.json(entry, HttpStatusCodes.OK);
};
