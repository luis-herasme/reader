import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import type { AppEnv } from "../../lib/app-factory";
import { prisma } from "../../db";
import { authMiddleware } from "../../auth/auth-middleware";

export const isFavoriteRoute = createRoute({
  method: "get",
  path: "/api/favorites/is-favorite",
  middleware: [authMiddleware],
  request: {
    query: z.object({
      bookId: z.string().uuid(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(z.boolean(), "Boolean favorite status"),
  },
});

export const isFavoriteHandler: RouteHandler<
  typeof isFavoriteRoute,
  AppEnv
> = async (context) => {
  const { bookId } = context.req.valid("query");
  const user = context.get("user")!;

  const favorite = await prisma.favorite.findUnique({
    where: { userId_bookId: { userId: user.id, bookId } },
  });

  return context.json(Boolean(favorite), HttpStatusCodes.OK);
};
