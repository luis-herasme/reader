import { Star, StarOff } from "lucide-react";
import { trpc } from "../../trpc";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Favorite({ slug, server }: { slug: string; server: string }) {
  const utils = trpc.useUtils();
  const { data } = trpc.favorites.isFavorite.useQuery({ slug, server });

  const addToFavorites = trpc.favorites.add.useMutation({
    onSuccess: () => {
      toast("Added novel to library");
      utils.favorites.isFavorite.invalidate({ slug, server });
    },
  });

  const removeFromFavorites = trpc.favorites.delete.useMutation({
    onSuccess: () => {
      toast("Removed novel from library");
      utils.favorites.isFavorite.invalidate({ slug, server });
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
            className={`hover:bg-[#333] flex items-center justify-center gap-4 px-2 py-2 rounded-full text-white duration-300 bg-black bg-opacity-50  cursor-pointer select-none backdrop-blur ${
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
              <Star className="w-4 h-4 text-yellow-200" />
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
