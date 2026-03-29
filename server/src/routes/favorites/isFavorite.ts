import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import type { AppEnv } from "../../lib/appFactory";
import { prisma } from "../../db";
import { authMiddleware } from "../../auth/authMiddleware";

export const isFavoriteRoute = createRoute({
  method: "get",
  path: "/api/favorites/is-favorite",
  middleware: [authMiddleware],
  request: {
    query: z.object({
      slug: z.string(),
      server: z.string(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(z.boolean(), "Boolean favorite status"),
  },
});

export const isFavoriteHandler: RouteHandler<
  typeof isFavoriteRoute,
  AppEnv
> = async (c) => {
  const { slug, server } = c.req.valid("query");
  const user = c.get("user")!;

  const favorite = await prisma.favorite.findFirst({
    where: { userId: user.id, slug, server },
  });

  return c.json(Boolean(favorite), HttpStatusCodes.OK);
};
