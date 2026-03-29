import { useQuery } from "@tanstack/react-query";
import { api } from "./client";

export const NOVELS_SEARCH = "novels-search";
export const NOVELS_CHAPTERS = "novels-chapters";
export const NOVELS_CHAPTER = "novels-chapter";

type SearchParams = {
  search: string;
  page: number;
  server: string;
};

export function useSearchNovels(params: SearchParams) {
  return useQuery({
    queryKey: [NOVELS_SEARCH, params],
    queryFn: async () => {
      const response = await api.api.novels.search.$get({
        query: {
          search: params.search,
          page: params.page,
          server: params.server,
        },
      });
      if (!response.ok) throw new Error("Failed to search novels");
      return response.json();
    },
    enabled: Boolean(params.search),
  });
}

type ChaptersParams = {
  slug: string;
  server: string;
};

export function useChapters(params: ChaptersParams) {
  return useQuery({
    queryKey: [NOVELS_CHAPTERS, params.slug, params.server],
    queryFn: async () => {
      const response = await api.api.novels.chapters.$get({
        query: { slug: params.slug, server: params.server },
      });
      if (!response.ok) throw new Error("Failed to fetch chapters");
      return response.json();
    },
  });
}

type ChapterParams = {
  novel: string;
  chapter: string;
  server: string;
};

export function useChapter(params: ChapterParams) {
  return useQuery({
    queryKey: [NOVELS_CHAPTER, params.novel, params.chapter, params.server],
    queryFn: async () => {
      const response = await api.api.novels.chapter.$get({
        query: { novel: params.novel, chapter: params.chapter, server: params.server },
      });
      if (!response.ok) throw new Error("Failed to fetch chapter");
      return response.json();
    },
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });
}
