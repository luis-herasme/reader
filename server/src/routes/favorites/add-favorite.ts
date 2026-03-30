import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import type { AppEnv } from "../../lib/app-factory";
import { prisma } from "../../db";
import { authMiddleware } from "../../auth/auth-middleware";
import { FavoriteSchema } from "./schema";

export const addFavoriteRoute = createRoute({
  method: "post",
  path: "/api/favorites",
  middleware: [authMiddleware],
  request: {
    body: jsonContentRequired(
      z.object({
        bookId: z.string().uuid(),
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
> = async (context) => {
  const { bookId } = context.req.valid("json");
  const user = context.get("user")!;

  const favorite = await prisma.favorite.upsert({
    where: {
      userId_bookId: { bookId, userId: user.id },
    },
    create: { bookId, userId: user.id },
    update: {},
  });

  return context.json(favorite, HttpStatusCodes.OK);
};
