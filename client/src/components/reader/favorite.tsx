import { Star, StarOff } from "lucide-react";
import { useIsFavorite, useAddFavorite, useDeleteFavorite } from "@/api/use-favorites";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type FavoriteProps = {
  bookId: string;
};

export function Favorite({ bookId }: FavoriteProps) {
  const { data } = useIsFavorite(bookId);
  const addToFavorites = useAddFavorite();
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
                removeFromFavorites.mutate(bookId, {
                  onSuccess: () => toast("Removed novel from library"),
                });
              } else {
                addToFavorites.mutate(bookId, {
                  onSuccess: () => toast("Added novel to library"),
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
