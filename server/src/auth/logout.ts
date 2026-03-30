import type { Context } from "hono";
import { lucia } from "./auth";
import type { AppEnv } from "../lib/app-factory";

export async function logout(c: Context<AppEnv>) {
  const sessionId = lucia.readSessionCookie(c.req.header("Cookie") ?? "");

  if (!sessionId) {
    return c.redirect("/login");
  }

  await lucia.invalidateSession(sessionId);

  c.header("Set-Cookie", lucia.createBlankSessionCookie().serialize(), {
    append: true,
  });

  return c.redirect("/login");
}
