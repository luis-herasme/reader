import { z } from "zod";
import { prisma } from "../db";
import { router } from "../trpc";
import { authProcedure } from "../auth/authProcedure";

export const settings = router({
  getState: authProcedure.query(async ({ ctx }) => {
    const settings = await prisma.settings.findUnique({
      where: {
        userId: ctx.user.id,
      },
    });

    if (!settings) {
      return await prisma.settings.create({
        data: {
          userId: ctx.user.id,
        },
      });
    }

    return settings;
  }),

  updateReplacementRules: authProcedure
    .input(
      z.object({
        replacementRules: z.array(
          z.object({
            from: z.string(),
            to: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const replacementRules = input.replacementRules.map((rule) => ({
        ...rule,
        userId: ctx.user.id,
      }));

      await prisma.replacementRule.deleteMany({
        where: {
          userId: ctx.user.id,
        },
      });

      await prisma.replacementRule.createMany({
        data: replacementRules,
      });

      return replacementRules;
    }),

  replacementRules: authProcedure.query(async ({ ctx }) => {
    const replacementRules = await prisma.replacementRule.findMany({
      where: {
        userId: ctx.user.id,
      },
    });

    return replacementRules;
  }),

  update: authProcedure
    .input(
      z.object({
        autoAdvance: z.boolean().optional(),
        font: z.enum(["serif", "sans_serif", "monospace"]).optional(),
        fontSize: z.number().optional(),
        speed: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const settings = await prisma.settings.upsert({
        where: {
          userId: ctx.user.id,
        },
        create: {
          ...input,
          userId: ctx.user.id,
        },
        update: input,
      });

      return settings;
    }),
});
