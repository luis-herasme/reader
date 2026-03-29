import { z } from "@hono/zod-openapi";

export const SettingsSchema = z.object({
  userId: z.string(),
  autoAdvance: z.boolean(),
  font: z.enum(["serif", "sans_serif", "monospace"]),
  fontSize: z.number(),
  speed: z.number(),
  updatedAt: z.coerce.string(),
  createdAt: z.coerce.string(),
});

export const ReplacementRuleSchema = z.object({
  id: z.string(),
  userId: z.string(),
  from: z.string(),
  to: z.string(),
  updatedAt: z.coerce.string(),
  createdAt: z.coerce.string(),
});
