import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import type { AppEnv } from "../../lib/app-factory";
import { prisma } from "../../db";
import { authMiddleware } from "../../auth/auth-middleware";
import { FavoriteWithBookSchema } from "./schema";

export const readFavoritesRoute = createRoute({
  method: "get",
  path: "/api/favorites",
  middleware: [authMiddleware],
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(FavoriteWithBookSchema),
      "List of favorites",
    ),
  },
});

export const readFavoritesHandler: RouteHandler<
  typeof readFavoritesRoute,
  AppEnv
> = async (context) => {
  const user = context.get("user")!;

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    include: {
      book: { select: { id: true, title: true, imageId: true } },
    },
  });

  return context.json(favorites, HttpStatusCodes.OK);
};
