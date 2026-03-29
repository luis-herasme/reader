import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import type { SlugServerInput } from "./useFavorites";

export const HISTORY_NOVELS = "history-novels";
export const HISTORY_NOVEL = "history-novel";
export const HISTORY_READ = "history-read";

export function useHistoryNovels() {
  return useQuery({
    queryKey: [HISTORY_NOVELS],
    queryFn: async () => {
      const res = await api.api.history.novels.$get();
      return res.json();
    },
  });
}

export function useNovelHistory(slug: string) {
  return useQuery({
    queryKey: [HISTORY_NOVEL, slug],
    queryFn: async () => {
      const res = await api.api.history.novel.$get({
        query: { slug },
      });
      return res.json();
    },
  });
}

type AddHistoryInput = {
  slug: string;
  chapter: string;
  server: string;
  sentenceIndex: number;
  length: number;
};

export async function addHistory(input: AddHistoryInput) {
  const res = await api.api.history.$post({ json: input });
  return res.json();
}

export function useClearNovelHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SlugServerInput) => {
      const res = await api.api.history.novel.$delete({ query: input });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HISTORY_NOVELS] });
    },
  });
}
