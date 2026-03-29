import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import type { AppEnv } from "../../lib/appFactory";
import { prisma } from "../../db";
import { authMiddleware } from "../../auth/authMiddleware";
import { FavoriteSchema } from "./schema";

export const deleteFavoriteRoute = createRoute({
  method: "delete",
  path: "/api/favorites",
  middleware: [authMiddleware],
  request: {
    query: z.object({
      bookId: z.string().uuid(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(FavoriteSchema, "Favorite deleted"),
  },
});

export const deleteFavoriteHandler: RouteHandler<
  typeof deleteFavoriteRoute,
  AppEnv
> = async (context) => {
  const { bookId } = context.req.valid("query");
  const user = context.get("user")!;

  const favorite = await prisma.favorite.delete({
    where: {
      userId_bookId: { bookId, userId: user.id },
    },
  });

  return context.json(favorite, HttpStatusCodes.OK);
};
