import { Star, StarOff } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { FAVORITES_IS_FAVORITE, type SlugServerInput } from "@/api/queryKeys";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Favorite({ slug, server }: { slug: string; server: string }) {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: [FAVORITES_IS_FAVORITE, slug, server],
    queryFn: async () => {
      const res = await api.api.favorites["is-favorite"].$get({
        query: { slug, server },
      });
      return res.json();
    },
  });

  const addToFavorites = useMutation({
    mutationFn: async (input: SlugServerInput) => {
      const res = await api.api.favorites.$post({ json: input });
      return res.json();
    },
    onSuccess: () => {
      toast("Added novel to library");
      queryClient.invalidateQueries({
        queryKey: [FAVORITES_IS_FAVORITE, slug, server],
      });
    },
  });

  const removeFromFavorites = useMutation({
    mutationFn: async (input: SlugServerInput) => {
      const res = await api.api.favorites.$delete({
        query: input,
      });
      return res.json();
    },
    onSuccess: () => {
      toast("Removed novel from library");
      queryClient.invalidateQueries({
        queryKey: [FAVORITES_IS_FAVORITE, slug, server],
      });
    },
  });

  if (data === undefined) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div
            className={`flex items-center justify-center gap-4 px-2 py-2 rounded-full text-white duration-300 cursor-pointer select-none backdrop-blur ${
              data
                ? "opacity-100 hover:opacity-50"
                : "opacity-50 hover:opacity-100"
            }`}
            onClick={() => {
              if (data) {
                removeFromFavorites.mutate({ slug, server });
              } else {
                addToFavorites.mutate({ slug, server });
              }
            }}
          >
            {data ? (
              <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
            ) : (
              <StarOff className="w-4 h-4" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{data ? "Remove from library" : "Add to library"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
