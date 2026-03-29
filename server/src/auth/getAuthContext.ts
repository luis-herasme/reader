import { lucia } from "./auth";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

export async function getAuthContext({
  req,
  resHeaders,
}: FetchCreateContextFnOptions) {
  const sessionId = lucia.readSessionCookie(
    req.headers.get("Cookie") ?? ""
  );

  if (!sessionId) {
    return { session: null, user: null };
  }

  const { session, user } = await lucia.validateSession(sessionId);

  if (session && session.fresh) {
    resHeaders.append(
      "Set-Cookie",
      lucia.createSessionCookie(session.id).serialize()
    );
  }

  if (!session) {
    resHeaders.append(
      "Set-Cookie",
      lucia.createBlankSessionCookie().serialize()
    );
  }

  return { session, user };
}
