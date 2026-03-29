import { useQuery } from "@tanstack/react-query";
import { api } from "./client";

export const NOVELS_SEARCH = "novels-search";
export const NOVELS_CHAPTER = "novels-chapter";
export const NOVELS_CHAPTERS = "novels-chapters";

type SearchParams = {
  title: string;
  skip: number;
  take: number;
};

export function useSearchNovels(params: SearchParams) {
  const query = useQuery({
    queryKey: [NOVELS_SEARCH, params],
    queryFn: async () => {
      const response = await api.api.novels.search.$get({
        query: {
          title: params.title,
          skip: params.skip,
          take: params.take,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to search novels");
      }
      return response.json();
    },
    enabled: Boolean(params.title),
  });

  const hasMore = query.data
    ? params.skip + params.take < query.data.total
    : false;

  const hasPrevious = params.skip > 0;

  return {
    ...query,
    hasMore,
    hasPrevious,
  };
}

type ChapterParams = {
  chapterId: string;
};

export function useChapter(params: ChapterParams) {
  return useQuery({
    queryKey: [NOVELS_CHAPTER, params.chapterId],
    queryFn: async () => {
      const response = await api.api.novels.chapter.$get({
        query: { chapterId: params.chapterId },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch chapter");
      }
      return response.json();
    },
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });
}

type ChaptersParams = {
  bookId: string;
  skip?: number;
  take?: number;
};

export function useChapters(params: ChaptersParams) {
  return useQuery({
    queryKey: [NOVELS_CHAPTERS, params.bookId],
    queryFn: async () => {
      const response = await api.api.novels.chapters.$get({
        query: {
          bookId: params.bookId,
          skip: params.skip,
          take: params.take,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch chapters");
      }
      return response.json();
    },
  });
}
