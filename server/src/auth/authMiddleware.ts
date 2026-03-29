import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../lib/appFactory";
import { setAuthContext } from "./getAuthContext";

export const optionalAuthMiddleware = createMiddleware<AppEnv>(
  async (c, next) => {
    await setAuthContext(c);
    await next();
  },
);

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  await setAuthContext(c);

  if (!c.get("user") || !c.get("session")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
});
