import { Star, StarOff } from "lucide-react";
import { useIsFavorite, useAddFavorite, useDeleteFavorite } from "@/api/useFavorites";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { FAVORITES_IS_FAVORITE } from "@/api/queryKeys";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Favorite({ slug, server }: { slug: string; server: string }) {
  const queryClient = useQueryClient();
  const { data } = useIsFavorite({ slug, server });

  const addToFavorites = useAddFavorite({ slug, server });
  const removeFromFavorites = useDeleteFavorite();

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
                removeFromFavorites.mutate({ slug, server }, {
                  onSuccess: () => {
                    toast("Removed novel from library");
                    queryClient.invalidateQueries({
                      queryKey: [FAVORITES_IS_FAVORITE, slug, server],
                    });
                  },
                });
              } else {
                addToFavorites.mutate({ slug, server }, {
                  onSuccess: () => {
                    toast("Added novel to library");
                  },
                });
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
