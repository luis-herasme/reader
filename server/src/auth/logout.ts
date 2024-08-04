import { lucia } from "./auth";
import type { Request, Response } from "express";

export async function logout(req: Request, res: Response) {
  const sessionId = lucia.readSessionCookie(req.headers.cookie ?? "");

  if (!sessionId) {
    return res.redirect("/login");
  }

  await lucia.invalidateSession(sessionId);

  return res
    .setHeader("Set-Cookie", lucia.createBlankSessionCookie().serialize())
    .redirect("/login");
}
