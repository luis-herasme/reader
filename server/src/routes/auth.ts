import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import type { AppEnv } from "../lib/appFactory";
import { optionalAuthMiddleware } from "../auth/authMiddleware";
import { googleLogin, googleCallback } from "../auth/google";
import { logout } from "../auth/logout";

// --- Is Authenticated ---

export const isAuthenticatedRoute = createRoute({
  method: "get",
  path: "/api/auth/is-authenticated",
  middleware: [optionalAuthMiddleware],
  responses: {
    [HttpStatusCodes.OK]: jsonContent(z.any(), "Authentication status"),
  },
});

export const isAuthenticatedHandler: RouteHandler<typeof isAuthenticatedRoute, AppEnv> = async (c) => {
  const user = c.get("user");
  const session = c.get("session");
  return c.json(Boolean(user && session), HttpStatusCodes.OK);
};

// --- Google Login ---

export const googleLoginRoute = createRoute({
  method: "get",
  path: "/api/auth/google/login",
  responses: {
    [HttpStatusCodes.MOVED_TEMPORARILY]: { description: "Redirect to Google OAuth" },
  },
});

export const googleLoginHandler: RouteHandler<typeof googleLoginRoute, AppEnv> = async (c) => {
  return googleLogin(c);
};

// --- Google Callback ---

export const googleCallbackRoute = createRoute({
  method: "get",
  path: "/api/auth/google/callback",
  responses: {
    [HttpStatusCodes.MOVED_TEMPORARILY]: { description: "OAuth callback redirect" },
  },
});

export const googleCallbackHandler: RouteHandler<typeof googleCallbackRoute, AppEnv> = async (c) => {
  return googleCallback(c);
};

// --- Logout ---

export const logoutRoute = createRoute({
  method: "get",
  path: "/api/auth/logout",
  responses: {
    [HttpStatusCodes.MOVED_TEMPORARILY]: { description: "Redirect to login" },
  },
});

export const logoutHandler: RouteHandler<typeof logoutRoute, AppEnv> = async (c) => {
  return logout(c);
};
