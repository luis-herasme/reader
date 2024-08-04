import { lucia } from "./auth";
import type { CreateHTTPContextOptions } from "@trpc/server/adapters/standalone";

export async function getAuthContext({ req, res }: CreateHTTPContextOptions) {
  const sessionId = lucia.readSessionCookie(req.headers.cookie ?? "");

  if (!sessionId) {
    return { session: null, user: null };
  }

  const { session, user } = await lucia.validateSession(sessionId);

  if (session && session.fresh) {
    res.appendHeader(
      "Set-Cookie",
      lucia.createSessionCookie(session.id).serialize()
    );
  }

  if (!session) {
    res.appendHeader(
      "Set-Cookie",
      lucia.createBlankSessionCookie().serialize()
    );
  }

  return { session, user };
}
