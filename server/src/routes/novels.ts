import z from "zod";
import * as cheerio from "cheerio";
import { publicProcedure, router } from "../trpc";

type SearchResult = {
  count: number;
  next: string | null;
  previous: string | null;
  results: {
    name: string;
    image: string;
    slug: string;
  }[];
};

type ChapterData = {
  title: string;
  novSlugChapSlug: string;
};

export const novels = router({
  search: publicProcedure
    .input(
      z.object({
        search: z.string(),
        limit: z.number().positive().int(),
        offset: z.number().min(0).int(),
      })
    )
    .query(async ({ input }) => {
      const searchParam = new URLSearchParams({
        search: input.search,
        limit: String(input.limit),
        offset: String(input.offset),
      });

      const response = await fetch(process.env.SEARCH_URL + searchParam.toString());
      return (await response.json()) as SearchResult;
    }),

  chapters: publicProcedure.input(z.string()).query(async ({ input }) => {
    const response = await fetch(process.env.CHAPTERS_URL + input);
    return (await response.json()) as ChapterData[];
  }),

  chapter: publicProcedure.input(z.string()).query(async ({ input }) => {
    const response = await fetch(process.env.CHAPTER_TEXT_URL + input);
    const $ = cheerio.load(await response.text());

    const text = $(process.env.CHAPTER_TEXT_SELECTOR)
      .toArray()
      .map((element) => $(element).text())
      .join("\n\n");

    return text;
  }),
});
