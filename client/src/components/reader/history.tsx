import { trpc } from "../../trpc";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Bookmark, Loader2, Trash } from "lucide-react";
import { Favorite } from "./favorite";
import { LibraryContent } from "./library";
import { navigate } from "wouter/use-browser-location";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";

export default function HistoryDialog() {
  return (
    <Dialog>
      <DialogTrigger>
        <Button
          variant="secondary"
          className="flex items-center justify-center gap-2"
        >
          My novels <Bookmark className="inline-block w-4 h-4" />
        </Button>
      </DialogTrigger>
      <LibraryContent />
    </Dialog>
  );
}

function HistoryItem({
  slug,
  updatedAt,
  server,
  chapter,
}: {
  slug: string;
  updatedAt: string;
  server: string;
  chapter: string;
}) {
  const utils = trpc.useUtils();
  const deleteMutation = trpc.history.clearNovelHistory.useMutation();

  return (
    <div className="flex items-center justify-between gap-4">
      <div
        className="flex flex-col w-full gap-0.5 cursor-pointer"
        onClick={() => {
          navigate(`/${server}/reader/${slug}/${chapter}`);
        }}
      >
        <div className={`text-base`}>
          {slug
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")}
        </div>
        <div className="text-sm min-w-[90px] font-light">Chapter {chapter}</div>
        <div className="font-mono text-xs opacity-50">
          {new Date(updatedAt).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>
      <div className="flex items-center justify-center gap-4">
        <Favorite slug={slug} server={server} />
        <div
          className={`rounded-full p-2 hover:bg-destructive duration-200 ${
            deleteMutation.isPending ? "opacity-50" : "cursor-pointer"
          }`}
          onClick={() => {
            if (deleteMutation.isPending) {
              return;
            }

            deleteMutation.mutate(
              {
                slug,
                server,
              },
              {
                onSuccess() {
                  utils.history.getNovels.invalidate();
                },
              }
            );
          }}
        >
          {deleteMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash className="w-4 h-4 opacity-50" />
          )}
        </div>
      </div>
    </div>
  );
}

export function History() {
  const { data } = trpc.history.getNovels.useQuery();

  return (
    <ScrollArea className="max-h-[50vh] overflow-y-auto scrollbar">
      <div className="flex flex-col gap-4 mb-4">
        {data &&
          data.map((history) => (
            <HistoryItem
              {...history}
              key={history.server + "-" + history.slug + "-" + history.chapter}
            />
          ))}
      </div>
    </ScrollArea>
  );
}
