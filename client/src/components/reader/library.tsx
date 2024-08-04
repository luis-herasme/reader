import { AlertCircle, Library, Loader2, Trash } from "lucide-react";
import { CircleButton } from "./circle-button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { History } from "./history";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc, trpcVanilla } from "../../trpc";
import { toast } from "sonner";

function Favorites() {
  const utils = trpc.useUtils();
  const { data } = trpc.favorites.read.useQuery();
  const removeFavorite = trpc.favorites.delete.useMutation();

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px]">
        <AlertCircle className="w-12 h-12 mb-4" strokeWidth={1} />
        <p className="text-base opacity-80">
          You don&apos;t have any novels in your library yet.
        </p>
        <p className="text-sm opacity-50">
          Add some by clicking on the star icon in the history tab.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {data.map((favorite) => (
        <div
          key={`${favorite.slug}`}
          className="flex items-center justify-between gap-4"
        >
          <div
            className="flex flex-col w-full gap-1 cursor-pointer"
            onClick={async () => {
              const currentChapter =
                await trpcVanilla.favorites.getNovelChapter.query({
                  slug: favorite.slug,
                });
              window.location.href = `/reader/${favorite.slug}-${currentChapter}`;
            }}
          >
            <div className={`text-base`}>
              {favorite.slug
                .split("-")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")}
            </div>
            <div className="font-mono text-xs opacity-50">
              {new Date(favorite.updatedAt).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
          <div className="flex items-center justify-center gap-4">
            <div
              className={`rounded p-2  hover:bg-destructive duration-200 ${
                removeFavorite.isPending ? "opacity-50" : "cursor-pointer"
              }`}
              onClick={() => {
                if (removeFavorite.isPending) {
                  return;
                }

                const slug = favorite.slug;

                removeFavorite.mutate(
                  { slug },
                  {
                    onSuccess() {
                      toast("Removed novel from library");
                      utils.favorites.read.invalidate();
                      utils.favorites.isFavorite.invalidate({ slug });
                    },
                  }
                );
              }}
            >
              {removeFavorite.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash className="w-4 h-4 opacity-50" />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function LibraryButton() {
  return (
    <Dialog>
      <DialogTrigger>
        <CircleButton tooltip="Library" onClick={() => {}}>
          <Library className="w-6 h-6" />
        </CircleButton>
      </DialogTrigger>
      <DialogContent className="text-white max-h-[100dvh] overflow-y-auto">
        <LibraryContent />
      </DialogContent>
    </Dialog>
  );
}

export function LibraryContent() {
  const { data } = trpc.auth.isAuthenticated.useQuery();

  return (
    <>
      <div className="text-lg font-semibold leading-none tracking-tight">
        <Library className="inline-block w-6 h-6 mr-2" />
        My library
      </div>
      {data ? (
        <Tabs defaultValue="library" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger className="w-full" value="library">
              Favorites
            </TabsTrigger>
            <TabsTrigger className="w-full" value="history">
              History
            </TabsTrigger>
          </TabsList>
          <TabsContent value="library">
            <Favorites />
          </TabsContent>
          <TabsContent value="history">
            <History />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[200px]">
          <AlertCircle className="w-12 h-12 mb-4" strokeWidth={1} />
          <p className="text-base opacity-80">
            You need to be logged in to use the library.
          </p>
          <p className="text-sm opacity-50">
            Click the login button below to log in.
          </p>
        </div>
      )}
    </>
  );
}
