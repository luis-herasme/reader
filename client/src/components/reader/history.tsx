import { useHistoryNovels, useClearNovelHistory } from "@/api/useHistory";
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
      <DialogTrigger className="w-full sm:w-auto">
        <Button
          variant="secondary"
          className="flex items-center justify-center gap-2 w-full"
        >
          My novels <Bookmark className="inline-block w-4 h-4" />
        </Button>
      </DialogTrigger>
      <LibraryContent />
    </Dialog>
  );
}

type HistoryItemProps = {
  bookId: string;
  chapterId: string;
  updatedAt: string;
  book: {
    id: string;
    title: string;
    imageId: string | null;
  };
  chapter: {
    id: string;
    title: string;
    number: number;
  };
};

function HistoryItem({ bookId, chapterId, updatedAt, book, chapter }: HistoryItemProps) {
  const deleteMutation = useClearNovelHistory();

  return (
    <div className="flex items-center justify-between gap-4">
      <div
        className="flex flex-col w-full gap-0.5 cursor-pointer"
        onClick={() => {
          navigate(`/reader/${bookId}/${chapterId}`);
        }}
      >
        <div className={`text-base`}>{book.title}</div>
        <div className="text-sm font-light">{chapter.title}</div>
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
        <Favorite bookId={bookId} />
        <div
          className={`rounded-full p-2 hover:bg-destructive duration-200 ${
            deleteMutation.isPending ? "opacity-50" : "cursor-pointer"
          }`}
          onClick={() => {
            if (deleteMutation.isPending) {
              return;
            }

            deleteMutation.mutate(bookId);
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
  const { data } = useHistoryNovels();

  return (
    <ScrollArea className="max-h-[50vh] overflow-y-auto scrollbar">
      <div className="flex flex-col gap-4 mb-4">
        {data &&
          data.map((history) => (
            <HistoryItem
              key={history.chapterId}
              bookId={history.bookId}
              chapterId={history.chapterId}
              updatedAt={history.updatedAt}
              book={history.book}
              chapter={history.chapter}
            />
          ))}
      </div>
    </ScrollArea>
  );
}
