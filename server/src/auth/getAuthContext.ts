import { lucia } from "./auth";
import type { Context } from "hono";
import type { AppEnv } from "../lib/appFactory";

export async function setAuthContext(c: Context<AppEnv>) {
  const sessionId = lucia.readSessionCookie(
    c.req.header("Cookie") ?? ""
  );

  if (!sessionId) {
    c.set("user", null);
    c.set("session", null);
    return;
  }

  const { session, user } = await lucia.validateSession(sessionId);

  if (session && session.fresh) {
    c.header(
      "Set-Cookie",
      lucia.createSessionCookie(session.id).serialize(),
      { append: true }
    );
  }

  if (!session) {
    c.header(
      "Set-Cookie",
      lucia.createBlankSessionCookie().serialize(),
      { append: true }
    );
  }

  c.set("session", session);
  c.set("user", user);
}
