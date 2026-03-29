import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import type { AppEnv } from "../../lib/appFactory";
import { optionalAuthMiddleware } from "../../auth/authMiddleware";

export const isAuthenticatedRoute = createRoute({
  method: "get",
  path: "/api/auth/is-authenticated",
  middleware: [optionalAuthMiddleware],
  responses: {
    [HttpStatusCodes.OK]: jsonContent(z.boolean(), "Authentication status"),
  },
});

export const isAuthenticatedHandler: RouteHandler<
  typeof isAuthenticatedRoute,
  AppEnv
> = async (c) => {
  const user = c.get("user");
  const session = c.get("session");
  return c.json(Boolean(user && session), HttpStatusCodes.OK);
};
