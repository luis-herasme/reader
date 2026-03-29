import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import type { AppEnv } from "../../lib/appFactory";
import { prisma } from "../../db";
import { authMiddleware } from "../../auth/authMiddleware";
import { HistorySchema } from "./schema";

export const readHistoryRoute = createRoute({
  method: "get",
  path: "/api/history",
  middleware: [authMiddleware],
  request: {
    query: z.object({
      chapterId: z.string().uuid(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      HistorySchema.nullable(),
      "History entry",
    ),
  },
});

export const readHistoryHandler: RouteHandler<
  typeof readHistoryRoute,
  AppEnv
> = async (context) => {
  const { chapterId } = context.req.valid("query");
  const user = context.get("user")!;

  const entry = await prisma.history.findUnique({
    where: { userId_chapterId: { userId: user.id, chapterId } },
  });

  return context.json(entry, HttpStatusCodes.OK);
};
