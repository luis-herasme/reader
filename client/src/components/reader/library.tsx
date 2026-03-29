import { AlertCircle, Library, Loader2, Trash } from "lucide-react";
import { History } from "./history";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { FAVORITES, FAVORITES_IS_FAVORITE, AUTH_IS_AUTHENTICATED, type SlugServerInput } from "@/api/queryKeys";
import { toast } from "sonner";
import { navigate } from "wouter/use-browser-location";
import { Loading } from "../loading";
import {
  DialogContent,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";

function Favorites() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: [FAVORITES],
    queryFn: async () => {
      const res = await api.api.favorites.$get();
      return res.json();
    },
  });
  const removeFavorite = useMutation({
    mutationFn: async (input: SlugServerInput) => {
      const res = await api.api.favorites.$delete({ query: input });
      return res.json();
    },
  });

  if (isLoading || data === undefined) {
    return <Loading />;
  }

  if (data && data.length === 0) {
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
    <ScrollArea className="max-h-[50vh] overflow-y-auto scrollbar">
      <div className="flex flex-col gap-4">
        {data.map((favorite) => (
          <div
            key={`${favorite.slug}`}
            className="flex items-center justify-between gap-4"
          >
            <div
              className="flex flex-col w-full gap-1 cursor-pointer"
              onClick={async () => {
                const res = await api.api.favorites["novel-chapter"].$get({
                  query: { slug: favorite.slug },
                });
                const currentChapter = await res.json();

                navigate(
                  `/${favorite.server}/reader/${favorite.slug}/${currentChapter}`
                );
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

                  removeFavorite.mutate(
                    {
                      slug: favorite.slug,
                      server: favorite.server,
                    },
                    {
                      onSuccess() {
                        toast("Removed novel from library");
                        queryClient.invalidateQueries({
                          queryKey: [FAVORITES],
                        });
                        queryClient.invalidateQueries({
                          queryKey: [FAVORITES_IS_FAVORITE, favorite.slug, favorite.server],
                        });
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
    </ScrollArea>
  );
}

export function LibraryContent() {
  const { data, isLoading } = useQuery({
    queryKey: [AUTH_IS_AUTHENTICATED],
    queryFn: async () => {
      const res = await api.api.auth["is-authenticated"].$get();
      return res.json();
    },
  });

  return (
    <DialogOverlay>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Library className="inline-block w-6 h-6 mr-2" />
            My library
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <Loading />
        ) : data ? (
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
      </DialogContent>
    </DialogOverlay>
  );
}
