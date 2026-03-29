import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import type { AppEnv } from "../../lib/appFactory";
import { prisma } from "../../db";
import { authMiddleware } from "../../auth/authMiddleware";

export const clearNovelHistoryRoute = createRoute({
  method: "delete",
  path: "/api/history/novel",
  middleware: [authMiddleware],
  request: {
    query: z.object({
      bookId: z.string().uuid(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ count: z.number() }),
      "Novel history cleared",
    ),
  },
});

export const clearNovelHistoryHandler: RouteHandler<
  typeof clearNovelHistoryRoute,
  AppEnv
> = async (context) => {
  const { bookId } = context.req.valid("query");
  const user = context.get("user")!;

  const result = await prisma.history.deleteMany({
    where: { userId: user.id, bookId },
  });

  return context.json(result, HttpStatusCodes.OK);
};
