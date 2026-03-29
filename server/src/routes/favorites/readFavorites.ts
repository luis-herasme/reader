import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import type { AppEnv } from "../../lib/appFactory";
import { prisma } from "../../db";
import { authMiddleware } from "../../auth/authMiddleware";
import { FavoriteSchema } from "./schema";

export const readFavoritesRoute = createRoute({
  method: "get",
  path: "/api/favorites",
  middleware: [authMiddleware],
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(FavoriteSchema),
      "List of favorites",
    ),
  },
});

export const readFavoritesHandler: RouteHandler<
  typeof readFavoritesRoute,
  AppEnv
> = async (c) => {
  const user = c.get("user")!;

  const favs = await prisma.favorite.findMany({
    where: { userId: user.id },
  });

  return c.json(favs, HttpStatusCodes.OK);
};
