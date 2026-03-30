import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import type { AppEnv } from "../../lib/app-factory";
import { prisma } from "../../db";
import { authMiddleware } from "../../auth/auth-middleware";
import { SettingsSchema } from "./schema";

export const updateSettingsRoute = createRoute({
  method: "post",
  path: "/api/settings",
  middleware: [authMiddleware],
  request: {
    body: jsonContentRequired(
      z.object({
        autoAdvance: z.boolean().optional(),
        font: z.enum(["serif", "sans_serif", "monospace"]).optional(),
        fontSize: z.number().optional(),
        speed: z.number().optional(),
      }),
      "Settings to update",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(SettingsSchema, "Updated settings"),
  },
});

export const updateSettingsHandler: RouteHandler<
  typeof updateSettingsRoute,
  AppEnv
> = async (c) => {
  const input = c.req.valid("json");
  const user = c.get("user")!;

  const updated = await prisma.settings.upsert({
    where: { userId: user.id },
    create: { ...input, userId: user.id },
    update: input,
  });

  return c.json(updated, HttpStatusCodes.OK);
};
