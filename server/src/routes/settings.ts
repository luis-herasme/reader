import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import type { AppEnv } from "../lib/appFactory";
import { prisma } from "../db";
import { authMiddleware } from "../auth/authMiddleware";

// --- Get State ---

export const getSettingsRoute = createRoute({
  method: "get",
  path: "/api/settings",
  middleware: [authMiddleware],
  responses: {
    [HttpStatusCodes.OK]: jsonContent(z.any(), "User settings"),
  },
});

export const getSettingsHandler: RouteHandler<typeof getSettingsRoute, AppEnv> = async (c) => {
  const user = c.get("user")!;

  const state = await prisma.settings.findUnique({
    where: { userId: user.id },
  });

  if (!state) {
    return c.json(
      await prisma.settings.create({ data: { userId: user.id } }),
      HttpStatusCodes.OK
    );
  }

  return c.json(state, HttpStatusCodes.OK);
};

// --- Update ---

export const updateSettingsRoute = createRoute({
  method: "post",
  path: "/api/settings",
  middleware: [authMiddleware],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            autoAdvance: z.boolean().optional(),
            font: z.enum(["serif", "sans_serif", "monospace"]).optional(),
            fontSize: z.number().optional(),
            speed: z.number().optional(),
          }),
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(z.any(), "Updated settings"),
  },
});

export const updateSettingsHandler: RouteHandler<typeof updateSettingsRoute, AppEnv> = async (c) => {
  const input = c.req.valid("json");
  const user = c.get("user")!;

  const updated = await prisma.settings.upsert({
    where: { userId: user.id },
    create: { ...input, userId: user.id },
    update: input,
  });

  return c.json(updated, HttpStatusCodes.OK);
};

// --- Replacement Rules ---

export const getReplacementRulesRoute = createRoute({
  method: "get",
  path: "/api/settings/replacement-rules",
  middleware: [authMiddleware],
  responses: {
    [HttpStatusCodes.OK]: jsonContent(z.any(), "Replacement rules"),
  },
});

export const getReplacementRulesHandler: RouteHandler<typeof getReplacementRulesRoute, AppEnv> = async (c) => {
  const user = c.get("user")!;

  const rules = await prisma.replacementRule.findMany({
    where: { userId: user.id },
  });

  return c.json(rules, HttpStatusCodes.OK);
};

// --- Update Replacement Rules ---

export const updateReplacementRulesRoute = createRoute({
  method: "post",
  path: "/api/settings/replacement-rules",
  middleware: [authMiddleware],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            replacementRules: z.array(
              z.object({
                from: z.string(),
                to: z.string(),
              })
            ),
          }),
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(z.any(), "Updated replacement rules"),
  },
});

export const updateReplacementRulesHandler: RouteHandler<typeof updateReplacementRulesRoute, AppEnv> = async (c) => {
  const { replacementRules } = c.req.valid("json");
  const user = c.get("user")!;

  const rules = replacementRules.map((rule) => ({
    ...rule,
    userId: user.id,
  }));

  await prisma.replacementRule.deleteMany({
    where: { userId: user.id },
  });

  await prisma.replacementRule.createMany({ data: rules });

  return c.json(rules, HttpStatusCodes.OK);
};
