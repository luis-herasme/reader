import { createRoute } from "@hono/zod-openapi";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import type { AppEnv } from "../../lib/appFactory";
import { prisma } from "../../db";
import { authMiddleware } from "../../auth/authMiddleware";
import { SettingsSchema } from "./schema";

export const getSettingsRoute = createRoute({
  method: "get",
  path: "/api/settings",
  middleware: [authMiddleware],
  responses: {
    [HttpStatusCodes.OK]: jsonContent(SettingsSchema, "User settings"),
  },
});

export const getSettingsHandler: RouteHandler<
  typeof getSettingsRoute,
  AppEnv
> = async (c) => {
  const user = c.get("user")!;

  const state = await prisma.settings.findUnique({
    where: { userId: user.id },
  });

  if (!state) {
    return c.json(
      await prisma.settings.create({ data: { userId: user.id } }),
      HttpStatusCodes.OK,
    );
  }

  return c.json(state, HttpStatusCodes.OK);
};
