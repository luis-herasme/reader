import { useCallback, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, List, Loader2 } from "lucide-react";
import { CircleButton } from "./circle-button";
import { useChapters } from "@/api/use-novels";
import { useNovelHistory } from "@/api/use-history";
import { navigate } from "wouter/use-browser-location";

type ListChaptersProps = {
  bookId: string;
  name: string;
  currentChapterId: string;
};

export function ListChapters({
  bookId,
  name,
  currentChapterId,
}: ListChaptersProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <CircleButton
        tooltip="Chapters"
        onClick={() => {
          setOpen(true);
        }}
      >
        <List className="w-6 h-6" />
      </CircleButton>
      <ChaptersDialog
        bookId={bookId}
        name={name}
        open={open}
        setOpen={setOpen}
        currentChapterId={currentChapterId}
      />
    </>
  );
}

type ChaptersDialogProps = {
  name: string;
  open: boolean;
  bookId: string;
  setOpen: (open: boolean) => void;
  currentChapterId?: string;
};

export function ChaptersDialog({
  name,
  open,
  bookId,
  setOpen,
  currentChapterId,
}: ChaptersDialogProps) {
  const { data, isLoading } = useChapters({ bookId });
  const { data: history } = useNovelHistory(bookId);

  const currentChapterRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={(open) => setOpen(open)}>
      <DialogContent className="w-full max-w-[1200px] min-h-[80dvh] text-white">
        <DialogHeader>
          <DialogTitle>{name}</DialogTitle>
          {isLoading ? (
            <div className="h-[300px] w-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <>
              <div className="text-white">
                {data && data.total} chapters
              </div>

              {data?.chapters.length === 0 ? (
                <div className="h-[300px] w-full flex items-center justify-center">
                  <div className="text-white">No chapters found</div>
                </div>
              ) : (
                <div className="max-h-[80dvh] overflow-y-auto w-full">
                  <div className="columns-1 sm:columns-2 md:columns-3">
                    {data?.chapters.map((chapter) => (
                      <div
                        ref={
                          chapter.chapterId === currentChapterId
                            ? currentChapterRef
                            : null
                        }
                        style={{
                          backgroundColor:
                            chapter.chapterId === currentChapterId
                              ? "#FF0"
                              : "transparent",
                          color:
                            chapter.chapterId === currentChapterId
                              ? "#000"
                              : "#FFF",
                        }}
                        key={chapter.chapterId}
                        onClick={() =>
                          navigate(`/reader/${bookId}/${chapter.chapterId}`)
                        }
                      >
                        <div className="cursor-pointer hover:underline">
                          {chapter.title}
                          {history?.find((entry) => entry.chapterId === chapter.chapterId) && (
                            <span className="ml-2">
                              <Eye className="inline-block w-4 h-4" />
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
