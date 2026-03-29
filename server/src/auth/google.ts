import { generateId } from "lucia";
import type { Context } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { Google, generateState } from "arctic";
import { lucia } from "./auth";
import { prisma } from "../db";
import type { AppEnv } from "../lib/appFactory";

export const google = new Google(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  `${process.env.BASE_URL}/api/auth/google/callback`,
);

export async function googleLogin(c: Context<AppEnv>) {
  const state = generateState();
  const codeVerifier = generateId(32);

  const googleUrl = await google.createAuthorizationURL(state, codeVerifier, {
    scopes: ["email", "profile"],
  });

  const cookieOptions = {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "Lax" as const,
  };

  setCookie(c, "google_oauth_state", state, cookieOptions);
  setCookie(c, "google_oauth_code_verifier", codeVerifier, cookieOptions);

  return c.redirect(googleUrl.toString(), 302);
}

export async function googleCallback(c: Context<AppEnv>) {
  const code = c.req.query("code");
  const state = c.req.query("state");

  const savedState = getCookie(c, "google_oauth_state") ?? null;
  const savedCodeVerifier = getCookie(c, "google_oauth_code_verifier") ?? null;

  if (
    !code ||
    !state ||
    !savedState ||
    !savedCodeVerifier ||
    state !== savedState
  ) {
    return c.body(null, 400);
  }

  const tokens = await google.validateAuthorizationCode(
    code,
    savedCodeVerifier,
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
    },
  );

  const googleUser = await googleUserResponse.json();

  const existingUser = await prisma.user.findUnique({
    where: {
      email: googleUser.email,
    },
  });

  if (existingUser) {
    const session = await lucia.createSession(existingUser.id, {});
    c.header("Set-Cookie", lucia.createSessionCookie(session.id).serialize(), {
      append: true,
    });
  } else {
    const newUser = await prisma.user.create({
      data: {
        email: googleUser.email as string,
        name: googleUser.name as string,
      },
    });

    const session = await lucia.createSession(newUser.id, {});
    c.header("Set-Cookie", lucia.createSessionCookie(session.id).serialize(), {
      append: true,
    });
  }

  return c.redirect("/", 302);
}
