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
      slug: z.string(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.union([z.string(), z.number()]),
      "Last read chapter number",
    ),
  },
});

export const getNovelChapterHandler: RouteHandler<
  typeof getNovelChapterRoute,
  AppEnv
> = async (c) => {
  const { slug } = c.req.valid("query");
  const user = c.get("user")!;

  const history = await prisma.history.findFirst({
    where: { userId: user.id, slug },
    orderBy: { updatedAt: "desc" },
  });

  return c.json(history ? history.chapter : 0, HttpStatusCodes.OK);
};
