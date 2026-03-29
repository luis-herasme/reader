import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import type { AppEnv } from "../../lib/appFactory";
import { prisma } from "../../db";
import { authMiddleware } from "../../auth/authMiddleware";
import { HistoryWithBookSchema } from "./schema";

export const getNovelsRoute = createRoute({
  method: "get",
  path: "/api/history/novels",
  middleware: [authMiddleware],
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(HistoryWithBookSchema),
      "List of novels with history",
    ),
  },
});

export const getNovelsHandler: RouteHandler<
  typeof getNovelsRoute,
  AppEnv
> = async (context) => {
  const user = context.get("user")!;

  const histories = await prisma.history.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    distinct: ["bookId"],
    include: {
      book: { select: { id: true, title: true, imageId: true } },
    },
  });

  return context.json(histories, HttpStatusCodes.OK);
};
