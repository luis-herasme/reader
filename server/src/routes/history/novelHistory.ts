import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import type { AppEnv } from "../../lib/appFactory";
import { prisma } from "../../db";
import { authMiddleware } from "../../auth/authMiddleware";
import { HistorySchema } from "./schema";

export const novelHistoryRoute = createRoute({
  method: "get",
  path: "/api/history/novel",
  middleware: [authMiddleware],
  request: {
    query: z.object({
      slug: z.string(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(HistorySchema),
      "Chapter history for a novel",
    ),
  },
});

export const novelHistoryHandler: RouteHandler<
  typeof novelHistoryRoute,
  AppEnv
> = async (c) => {
  const { slug } = c.req.valid("query");
  const user = c.get("user")!;

  const chapters = await prisma.history.findMany({
    where: { userId: user.id, slug },
  });

  return c.json(chapters, HttpStatusCodes.OK);
};
