import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import type { AppEnv } from "../../lib/appFactory";
import { prisma } from "../../db";
import { authMiddleware } from "../../auth/authMiddleware";
import { HistorySchema } from "./schema";

export const readHistoryRoute = createRoute({
  method: "get",
  path: "/api/history",
  middleware: [authMiddleware],
  request: {
    query: z.object({
      slug: z.string(),
      chapter: z.string(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      HistorySchema.nullable(),
      "History entry",
    ),
  },
});

export const readHistoryHandler: RouteHandler<
  typeof readHistoryRoute,
  AppEnv
> = async (c) => {
  const { slug, chapter } = c.req.valid("query");
  const user = c.get("user")!;

  const entry = await prisma.history.findFirst({
    where: { userId: user.id, slug, chapter },
  });

  return c.json(entry, HttpStatusCodes.OK);
};
