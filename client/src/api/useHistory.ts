import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import type { BookIdInput } from "./types";

export const HISTORY_NOVELS = "history-novels";
export const HISTORY_NOVEL = "history-novel";
export const HISTORY_READ = "history-read";

export function useHistoryNovels() {
  return useQuery({
    queryKey: [HISTORY_NOVELS],
    queryFn: async () => {
      const response = await api.api.history.novels.$get();
      if (!response.ok) {
        throw new Error("Failed to fetch history novels");
      }
      return response.json();
    },
  });
}

export function useNovelHistory(bookId: string) {
  return useQuery({
    queryKey: [HISTORY_NOVEL, bookId],
    queryFn: async () => {
      const response = await api.api.history.novel.$get({
        query: { bookId },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch novel history");
      }
      return response.json();
    },
  });
}

type AddHistoryInput = {
  bookId: string;
  chapterId: string;
  sentenceIndex: number;
  length: number;
};

export async function addHistory(input: AddHistoryInput) {
  const response = await api.api.history.$post({ json: input });
  if (!response.ok) {
    throw new Error("Failed to add history");
  }
  return response.json();
}

export function useClearNovelHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BookIdInput) => {
      const response = await api.api.history.novel.$delete({
        query: { bookId: input.bookId },
      });
      if (!response.ok) {
        throw new Error("Failed to clear novel history");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HISTORY_NOVELS] });
    },
  });
}
