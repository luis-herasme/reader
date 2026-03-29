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
      slug: z.string(),
      server: z.string(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(FavoriteSchema, "Favorite deleted"),
  },
});

export const deleteFavoriteHandler: RouteHandler<
  typeof deleteFavoriteRoute,
  AppEnv
> = async (c) => {
  const { slug, server } = c.req.valid("query");
  const user = c.get("user")!;

  const favorite = await prisma.favorite.delete({
    where: {
      userId_slug_server: { slug, server, userId: user.id },
    },
  });

  return c.json(favorite, HttpStatusCodes.OK);
};
