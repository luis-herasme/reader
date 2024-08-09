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

  novelHistory: authProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const chapters = await prisma.history.findMany({
        where: {
          userId: ctx.user.id,
          slug: input,
        },
      });

      return chapters;
    }),

  clearNovelHistory: authProcedure
    .input(
      z.object({
        slug: z.string(),
        server: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { slug, server } = input;

      const history = await prisma.history.deleteMany({
        where: {
          userId: ctx.user.id,
          server,
          slug,
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
        server: z.string(),
        sentenceIndex: z.number(),
        length: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { slug, server, chapter, sentenceIndex, length } = input;

      const history = await prisma.history.upsert({
        where: {
          userId_slug_chapter_server: {
            slug,
            chapter,
            server,
            userId: ctx.user.id,
          },
        },
        create: {
          slug,
          chapter,
          server,
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
