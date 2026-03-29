import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import type { AppEnv } from "../../lib/appFactory";
import { prisma } from "../../db";
import { authMiddleware } from "../../auth/authMiddleware";
import { ReplacementRuleSchema } from "./schema";

export const getReplacementRulesRoute = createRoute({
  method: "get",
  path: "/api/settings/replacement-rules",
  middleware: [authMiddleware],
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(ReplacementRuleSchema),
      "Replacement rules",
    ),
  },
});

export const getReplacementRulesHandler: RouteHandler<
  typeof getReplacementRulesRoute,
  AppEnv
> = async (c) => {
  const user = c.get("user")!;

  const rules = await prisma.replacementRule.findMany({
    where: { userId: user.id },
  });

  return c.json(rules, HttpStatusCodes.OK);
};
