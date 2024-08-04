import { z } from "zod";
import { prisma } from "../db";
import { router } from "../trpc";
import { authProcedure } from "../auth/authProcedure";

export const history = router({
  getNovels: authProcedure.query(async ({ ctx }) => {
    return await prisma.history.findMany({
      where: {
        userId: ctx.user.id,
      },
      orderBy: {
        chapter: "desc",
      },
      distinct: ["slug"],
    });
  }),

  readAll: authProcedure.query(async ({ ctx }) => {
    const histories = await prisma.history.findMany({
      where: {
        userId: ctx.user.id,
      },
    });

    return histories;
  }),

  delete: authProcedure
    .input(
      z.object({
        slug: z.string(),
        chapter: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { slug, chapter } = input;

      const history = await prisma.history.delete({
        where: {
          userId_slug_chapter: {
            slug,
            chapter,
            userId: ctx.user.id,
          },
        },
      });

      return history;
    }),

  read: authProcedure
    .input(
      z.object({
        slug: z.string(),
        chapter: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { slug, chapter } = input;

      const history = await prisma.history.findFirst({
        where: {
          userId: ctx.user.id,
          slug,
          chapter,
        },
      });

      return history;
    }),

  add: authProcedure
    .input(
      z.object({
        slug: z.string(),
        chapter: z.string(),
        sentenceIndex: z.number(),
        length: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { slug, chapter, sentenceIndex, length } = input;

      const history = await prisma.history.upsert({
        where: {
          userId_slug_chapter: {
            slug,
            chapter,
            userId: ctx.user.id,
          },
        },
        create: {
          slug,
          chapter,
          sentenceIndex,
          length,
          userId: ctx.user.id,
        },
        update: {
          length,
          sentenceIndex,
        },
      });

      return history;
    }),
});
