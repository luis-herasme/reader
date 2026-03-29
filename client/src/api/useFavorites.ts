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
      const res = await api.api.favorites.$get();
      return res.json();
    },
  });
}

export function useIsFavorite(params: SlugServerInput) {
  return useQuery({
    queryKey: [FAVORITES_IS_FAVORITE, params.slug, params.server],
    queryFn: async () => {
      const res = await api.api.favorites["is-favorite"].$get({
        query: { slug: params.slug, server: params.server },
      });
      return res.json();
    },
  });
}

export function useAddFavorite({ slug, server }: SlugServerInput) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SlugServerInput) => {
      const res = await api.api.favorites.$post({ json: input });
      return res.json();
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
      const res = await api.api.favorites.$delete({ query: input });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FAVORITES] });
    },
  });
}

export async function getNovelChapter(slug: string) {
  const res = await api.api.favorites["novel-chapter"].$get({
    query: { slug },
  });
  return res.json();
}
