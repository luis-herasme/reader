import { generateId } from "lucia";
import type { Request, Response } from "express";
import { serializeCookie, parseCookies } from "oslo/cookie";
import { Google, generateState } from "arctic";
import { lucia } from "./auth";
import { prisma } from "../db";

export const google = new Google(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  `${process.env.BASE_URL}/google/callback`
);

export async function googleLogin(_: Request, res: Response) {
  const state = generateState();
  const codeVerifier = generateId(32);

  const googleUrl = await google.createAuthorizationURL(state, codeVerifier, {
    scopes: ["email", "profile"],
  });

  res.appendHeader(
    "Set-Cookie",
    serializeCookie("google_oauth_state", state, {
      path: "/",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 60 * 10,
      sameSite: "lax",
    })
  );

  res.appendHeader(
    "Set-Cookie",
    serializeCookie("google_oauth_code_verifier", codeVerifier, {
      path: "/",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 60 * 10,
      sameSite: "lax",
    })
  );

  res.writeHead(302, { Location: googleUrl.toString() });
  res.end();
}

export async function googleCallback(req: Request, res: Response) {
  if (!req.url) {
    res.writeHead(400);
    res.end();
    return;
  }

  const searchParams = new URLSearchParams(req.url.split("?")[1]);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const cookies = parseCookies(req.headers.cookie ?? "");
  const savedState = cookies.get("google_oauth_state") ?? null;
  const savedCodeVerifier = cookies.get("google_oauth_code_verifier") ?? null;

  if (
    !code ||
    !state ||
    !savedState ||
    !savedCodeVerifier ||
    state !== savedState
  ) {
    res.writeHead(400);
    res.end();
    return;
  }

  const tokens = await google.validateAuthorizationCode(
    code,
    savedCodeVerifier
  );

  if (tokens.refreshToken) {
    await google.refreshAccessToken(tokens.refreshToken);
  }

  const googleUserResponse = await fetch(
    "https://openidconnect.googleapis.com/v1/userinfo",
    {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    }
  );

  const googleUser = await googleUserResponse.json();

  const existingUser = await prisma.user.findUnique({
    where: {
      email: googleUser.email,
    },
  });

  if (existingUser) {
    const session = await lucia.createSession(existingUser.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    res.appendHeader("Set-Cookie", sessionCookie.serialize());
  } else {
    const newUser = await prisma.user.create({
      data: {
        email: googleUser.email as string,
        name: googleUser.name as string,
      },
    });

    const session = await lucia.createSession(newUser.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    res.appendHeader("Set-Cookie", sessionCookie.serialize());
  }

  res.writeHead(302, { Location: "/" });
  res.end();
  return;
}
