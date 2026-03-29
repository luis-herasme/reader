import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import type { AppEnv } from "../../lib/appFactory";
import { prisma } from "../../db";
import { authMiddleware } from "../../auth/authMiddleware";

export const updateReplacementRulesRoute = createRoute({
  method: "post",
  path: "/api/settings/replacement-rules",
  middleware: [authMiddleware],
  request: {
    body: jsonContentRequired(
      z.object({
        replacementRules: z.array(
          z.object({
            from: z.string(),
            to: z.string(),
          }),
        ),
      }),
      "Replacement rules to update",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(
        z.object({ from: z.string(), to: z.string(), userId: z.string() }),
      ),
      "Updated replacement rules",
    ),
  },
});

export const updateReplacementRulesHandler: RouteHandler<
  typeof updateReplacementRulesRoute,
  AppEnv
> = async (c) => {
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
