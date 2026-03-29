import { createMiddleware } from "hono/factory";
import { timingSafeEqual } from "crypto";
import type { AppEnv } from "./appFactory";

export const apiKeyMiddleware = createMiddleware<AppEnv>(async (context, next) => {
  const apiKey = context.req.header("x-api-key");
  const expectedKey = process.env.API_KEY;

  if (!apiKey || !expectedKey) {
    return context.json({ error: "Unauthorized" }, 401);
  }

  const apiKeyBuffer = Buffer.from(apiKey);
  const expectedKeyBuffer = Buffer.from(expectedKey);

  if (apiKeyBuffer.length !== expectedKeyBuffer.length || !timingSafeEqual(apiKeyBuffer, expectedKeyBuffer)) {
    return context.json({ error: "Unauthorized" }, 401);
  }

  await next();
});
