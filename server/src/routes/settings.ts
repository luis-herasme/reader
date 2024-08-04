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
