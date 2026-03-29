import { createRoute } from "@hono/zod-openapi";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import type { AppEnv } from "../../lib/appFactory";
import { googleCallback } from "../../auth/google";

export const googleCallbackRoute = createRoute({
  method: "get",
  path: "/api/auth/google/callback",
  responses: {
    [HttpStatusCodes.MOVED_TEMPORARILY]: {
      description: "OAuth callback redirect",
    },
  },
});

export const googleCallbackHandler: RouteHandler<
  typeof googleCallbackRoute,
  AppEnv
> = async (c) => {
  return googleCallback(c);
};
