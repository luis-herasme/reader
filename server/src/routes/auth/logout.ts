import { createRoute } from "@hono/zod-openapi";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import type { AppEnv } from "../../lib/appFactory";
import { logout } from "../../auth/logout";

export const logoutRoute = createRoute({
  method: "get",
  path: "/api/auth/logout",
  responses: {
    [HttpStatusCodes.MOVED_TEMPORARILY]: { description: "Redirect to login" },
  },
});

export const logoutHandler: RouteHandler<typeof logoutRoute, AppEnv> = async (
  c,
) => {
  return logout(c);
};
