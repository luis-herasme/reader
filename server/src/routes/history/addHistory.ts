import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import type { AppEnv } from "../../lib/appFactory";
import { prisma } from "../../db";
import { authMiddleware } from "../../auth/authMiddleware";
import { HistorySchema } from "./schema";

const AddHistoryInput = z.object({
  bookId: z.string().uuid(),
  chapterId: z.string().uuid(),
  sentenceIndex: z.number(),
  length: z.number(),
});

export const addHistoryRoute = createRoute({
  method: "post",
  path: "/api/history",
  middleware: [authMiddleware],
  request: {
    body: jsonContentRequired(AddHistoryInput, "History entry to add"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(HistorySchema, "History entry added"),
  },
});

export const addHistoryHandler: RouteHandler<
  typeof addHistoryRoute,
  AppEnv
> = async (context) => {
  const { bookId, chapterId, sentenceIndex, length } = context.req.valid("json");
  const user = context.get("user")!;

  const entry = await prisma.history.upsert({
    where: {
      userId_chapterId: {
        userId: user.id,
        chapterId,
      },
    },
    create: { bookId, chapterId, sentenceIndex, length, userId: user.id },
    update: { sentenceIndex, length },
  });

  return context.json(entry, HttpStatusCodes.OK);
};
