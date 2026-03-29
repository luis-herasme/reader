import { createRoute } from "@hono/zod-openapi";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import type { AppEnv } from "../../lib/appFactory";
import { googleLogin } from "../../auth/google";

export const googleLoginRoute = createRoute({
  method: "get",
  path: "/api/auth/google/login",
  responses: {
    [HttpStatusCodes.MOVED_TEMPORARILY]: {
      description: "Redirect to Google OAuth",
    },
  },
});

export const googleLoginHandler: RouteHandler<
  typeof googleLoginRoute,
  AppEnv
> = async (c) => {
  return googleLogin(c);
};
