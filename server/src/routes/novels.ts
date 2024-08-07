import z from "zod";
import { publicProcedure, router } from "../trpc";
import { prisma } from "../db";

type SearchResult = {
  name: string;
  image: string;
  slug: string;
};

type GetChaptersResult = {
  title: string;
  slug: string;
};

type GetChapterResult = {
  content: string;
  next: string | null;
  prev: string | null;
};

const URL = process.env.DATA_URL;

export const novels = router({
  search: publicProcedure
    .input(
      z.object({
        search: z.string(),
        page: z.number().min(0).int(),
        server: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { search, page, server } = input;
      const response = await fetch(URL + `/${server}/search/${search}/${page}`);
      return (await response.json()) as SearchResult[];
    }),

  chapters: publicProcedure
    .input(
      z.object({
        slug: z.string(),
        server: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { slug, server } = input;
      const response = await fetch(URL + `/${server}/chapters/${slug}`);
      return (await response.json()) as GetChaptersResult[];
    }),

  chapter: publicProcedure
    .input(
      z.object({
        novel: z.string(),
        chapter: z.string(),
        server: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { server, novel, chapter } = input;
      const response = await fetch(
        URL + `/${server}/chapter/${novel}/${chapter}`
      );

      const result = (await response.json()) as GetChapterResult;
      let sentenceIndex = null;

      if (ctx.user) {
        const history = await prisma.history.findFirst({
          where: {
            userId: ctx.user.id,
            slug: novel,
            chapter,
          },
          select: {
            sentenceIndex: true,
          },
        });

        if (history) {
          sentenceIndex = history.sentenceIndex;
        }
      }

      return { ...result, sentenceIndex };
    }),
});
