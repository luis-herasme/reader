import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import type { AppEnv } from "../../lib/appFactory";
import { prisma } from "../../db";
import { authMiddleware } from "../../auth/authMiddleware";
import { FavoriteSchema } from "./schema";

export const addFavoriteRoute = createRoute({
  method: "post",
  path: "/api/favorites",
  middleware: [authMiddleware],
  request: {
    body: jsonContentRequired(
      z.object({
        slug: z.string(),
        server: z.string(),
      }),
      "Favorite to add",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(FavoriteSchema, "Favorite added"),
  },
});

export const addFavoriteHandler: RouteHandler<
  typeof addFavoriteRoute,
  AppEnv
> = async (c) => {
  const { slug, server } = c.req.valid("json");
  const user = c.get("user")!;

  const favorite = await prisma.favorite.upsert({
    where: {
      userId_slug_server: { slug, server, userId: user.id },
    },
    create: { slug, server, userId: user.id },
    update: {},
  });

  return c.json(favorite, HttpStatusCodes.OK);
};
