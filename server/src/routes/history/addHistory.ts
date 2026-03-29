import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import type { AppEnv } from "../../lib/appFactory";
import { prisma } from "../../db";
import { authMiddleware } from "../../auth/authMiddleware";
import { HistorySchema } from "./schema";

export const addHistoryRoute = createRoute({
  method: "post",
  path: "/api/history",
  middleware: [authMiddleware],
  request: {
    body: jsonContentRequired(
      z.object({
        slug: z.string(),
        chapter: z.string(),
        server: z.string(),
        sentenceIndex: z.number(),
        length: z.number(),
      }),
      "History entry to add",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(HistorySchema, "History entry added"),
  },
});

export const addHistoryHandler: RouteHandler<
  typeof addHistoryRoute,
  AppEnv
> = async (c) => {
  const { slug, server, chapter, sentenceIndex, length } = c.req.valid("json");
  const user = c.get("user")!;

  const entry = await prisma.history.upsert({
    where: {
      userId_slug_chapter_server: {
        slug,
        chapter,
        server,
        userId: user.id,
      },
    },
    create: { slug, chapter, server, sentenceIndex, length, userId: user.id },
    update: { length, sentenceIndex },
  });

  return c.json(entry, HttpStatusCodes.OK);
};
