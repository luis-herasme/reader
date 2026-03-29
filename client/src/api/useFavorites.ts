import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";

export const FAVORITES = "favorites";
export const FAVORITES_IS_FAVORITE = "favorites-is-favorite";
export const FAVORITES_NOVEL_CHAPTER = "favorites-novel-chapter";

export function useFavorites() {
  return useQuery({
    queryKey: [FAVORITES],
    queryFn: async () => {
      const response = await api.api.favorites.$get();
      if (!response.ok) {
        throw new Error("Failed to fetch favorites");
      }
      return response.json();
    },
  });
}

export function useIsFavorite(bookId: string) {
  return useQuery({
    queryKey: [FAVORITES_IS_FAVORITE, bookId],
    queryFn: async () => {
      const response = await api.api.favorites["is-favorite"].$get({
        query: { bookId },
      });
      if (!response.ok) {
        throw new Error("Failed to check favorite status");
      }
      return response.json();
    },
  });
}

export function useAddFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookId: string) => {
      const response = await api.api.favorites.$post({
        json: { bookId },
      });
      if (!response.ok) {
        throw new Error("Failed to add favorite");
      }
      return response.json();
    },
    onSuccess: (_data, bookId) => {
      queryClient.invalidateQueries({
        queryKey: [FAVORITES_IS_FAVORITE, bookId],
      });
      queryClient.invalidateQueries({
        queryKey: [FAVORITES],
      });
    },
  });
}

export function useDeleteFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookId: string) => {
      const response = await api.api.favorites.$delete({
        query: { bookId },
      });
      if (!response.ok) {
        throw new Error("Failed to delete favorite");
      }
      return response.json();
    },
    onSuccess: (_data, bookId) => {
      queryClient.invalidateQueries({
        queryKey: [FAVORITES_IS_FAVORITE, bookId],
      });
      queryClient.invalidateQueries({
        queryKey: [FAVORITES],
      });
    },
  });
}

export function useNovelChapter() {
  return useMutation({
    mutationFn: async (bookId: string) => {
      const response = await api.api.favorites["novel-chapter"].$get({
        query: { bookId },
      });
      if (!response.ok) {
        throw new Error("Failed to get novel chapter");
      }
      return response.json();
    },
  });
}
