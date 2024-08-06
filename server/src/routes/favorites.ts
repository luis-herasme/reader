import { z } from "zod";
import { prisma } from "../db";
import { router } from "../trpc";
import { authProcedure } from "../auth/authProcedure";

export const favorites = router({
  add: authProcedure
    .input(
      z.object({
        slug: z.string(),
        server: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { slug, server } = input;

      const favorite = await prisma.favorite.upsert({
        where: {
          userId_slug_server: {
            slug,
            server,
            userId: ctx.user.id,
          },
        },
        create: {
          slug,
          server,
          userId: ctx.user.id,
        },
        update: {},
      });

      return favorite;
    }),

  delete: authProcedure
    .input(
      z.object({
        slug: z.string(),
        server: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { slug, server } = input;

      const favorite = await prisma.favorite.delete({
        where: {
          userId_slug_server: {
            slug,
            server,
            userId: ctx.user.id,
          },
        },
      });

      return favorite;
    }),

  read: authProcedure.query(async ({ ctx }) => {
    const favorites = await prisma.favorite.findMany({
      where: {
        userId: ctx.user.id,
      },
    });

    return favorites;
  }),

  isFavorite: authProcedure
    .input(
      z.object({
        slug: z.string(),
        server: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { slug, server } = input;

      const favorite = await prisma.favorite.findFirst({
        where: {
          userId: ctx.user.id,
          slug,
          server,
        },
      });

      return Boolean(favorite);
    }),

  getNovelChapter: authProcedure
    .input(
      z.object({
        slug: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { slug } = input;

      const favorite = await prisma.history.findFirst({
        where: {
          userId: ctx.user.id,
          slug,
        },
        orderBy: {
          chapter: "desc",
        },
      });

      return favorite ? favorite.chapter : 0;
    }),
});
