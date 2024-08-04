import z from "zod";
import { publicProcedure, router } from "../trpc";

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
      })
    )
    .query(async ({ input }) => {
      const { search, page } = input;
      const response = await fetch(URL + `/search/${search}/${page}`);
      return (await response.json()) as SearchResult[];
    }),

  chapters: publicProcedure.input(z.string()).query(async ({ input }) => {
    const response = await fetch(URL + `/chapters/${input}`);
    return (await response.json()) as GetChaptersResult[];
  }),

  chapter: publicProcedure
    .input(
      z.object({
        novel: z.string(),
        chapter: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { novel, chapter } = input;
      const response = await fetch(URL + `/chapter/${novel}/${chapter}`);
      return (await response.json()) as GetChapterResult;
    }),
});
