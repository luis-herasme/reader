import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";

export const FAVORITES = "favorites";
export const FAVORITES_IS_FAVORITE = "favorites-is-favorite";
export const FAVORITES_NOVEL_CHAPTER = "favorites-novel-chapter";

export type SlugServerInput = {
  slug: string;
  server: string;
};

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

export function useIsFavorite(params: SlugServerInput) {
  return useQuery({
    queryKey: [FAVORITES_IS_FAVORITE, params.slug, params.server],
    queryFn: async () => {
      const response = await api.api.favorites["is-favorite"].$get({
        query: { slug: params.slug, server: params.server },
      });
      if (!response.ok) {
        throw new Error("Failed to check favorite status");
      }
      return response.json();
    },
  });
}

export function useAddFavorite({ slug, server }: SlugServerInput) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SlugServerInput) => {
      const response = await api.api.favorites.$post({ json: input });
      if (!response.ok) {
        throw new Error("Failed to add favorite");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [FAVORITES_IS_FAVORITE, slug, server],
      });
    },
  });
}

export function useDeleteFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SlugServerInput) => {
      const response = await api.api.favorites.$delete({ query: input });
      if (!response.ok) {
        throw new Error("Failed to delete favorite");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FAVORITES] });
    },
  });
}

export async function getNovelChapter(slug: string) {
  const response = await api.api.favorites["novel-chapter"].$get({
    query: { slug },
  });
  if (!response.ok) {
    throw new Error("Failed to get novel chapter");
  }
  return response.json();
}
