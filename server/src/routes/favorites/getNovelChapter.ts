import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import type { AppEnv } from "../../lib/appFactory";
import { prisma } from "../../db";
import { authMiddleware } from "../../auth/authMiddleware";

export const getNovelChapterRoute = createRoute({
  method: "get",
  path: "/api/favorites/novel-chapter",
  middleware: [authMiddleware],
  request: {
    query: z.object({
      bookId: z.string().uuid(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ chapterId: z.string().nullable() }),
      "Last read chapter ID",
    ),
  },
});

export const getNovelChapterHandler: RouteHandler<
  typeof getNovelChapterRoute,
  AppEnv
> = async (context) => {
  const { bookId } = context.req.valid("query");
  const user = context.get("user")!;

  const history = await prisma.history.findFirst({
    where: { userId: user.id, bookId },
    orderBy: { updatedAt: "desc" },
  });

  return context.json(
    { chapterId: history ? history.chapterId : null },
    HttpStatusCodes.OK,
  );
};
