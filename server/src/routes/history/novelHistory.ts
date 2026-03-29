import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import type { AppEnv } from "../../lib/appFactory";
import { prisma } from "../../db";
import { authMiddleware } from "../../auth/authMiddleware";
import { HistoryWithChapterSchema } from "./schema";

export const novelHistoryRoute = createRoute({
  method: "get",
  path: "/api/history/novel",
  middleware: [authMiddleware],
  request: {
    query: z.object({
      bookId: z.string().uuid(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(HistoryWithChapterSchema),
      "Chapter history for a novel",
    ),
  },
});

export const novelHistoryHandler: RouteHandler<
  typeof novelHistoryRoute,
  AppEnv
> = async (context) => {
  const { bookId } = context.req.valid("query");
  const user = context.get("user")!;

  const chapters = await prisma.history.findMany({
    where: { userId: user.id, bookId },
    include: {
      chapter: { select: { id: true, title: true, number: true } },
    },
  });

  return context.json(chapters, HttpStatusCodes.OK);
};
