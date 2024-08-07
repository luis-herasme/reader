import { useCallback, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, List, Loader2 } from "lucide-react";
import { CircleButton } from "./circle-button";
import { trpc } from "@/trpc";
import { useLocation } from "wouter";

export function ListChapters({
  slug,
  name,
  currentChapterSlug,
  server,
}: {
  slug: string;
  name: string;
  currentChapterSlug?: string;
  server: string;
}) {
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
        server={server}
        name={name}
        open={open}
        slug={slug}
        setOpen={setOpen}
        currentChapterSlug={currentChapterSlug}
      />
    </>
  );
}

export function ChaptersDialog({
  name,
  open,
  slug,
  setOpen,
  currentChapterSlug,
  server,
}: {
  name: string;
  open: boolean;
  slug: string;
  setOpen: (open: boolean) => void;
  currentChapterSlug?: string;
  server: string;
}) {
  const { data: chapters, isLoading } = trpc.novels.chapters.useQuery({
    slug,
    server,
  });

  const { data: history } = trpc.history.novelHistory.useQuery(slug);
  const navigate = useLocation()[1];

  const currentChapterRef = useCallback(
    (node: any) => {
      if (node !== null) {
        node.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    },
    [currentChapterSlug]
  );

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
                {chapters && chapters.length} chapters
              </div>

              {chapters?.length === 0 ? (
                <div className="h-[300px] w-full flex items-center justify-center">
                  <div className="text-white">No chapters found</div>
                </div>
              ) : (
                <div className="max-h-[80dvh] overflow-y-auto w-full">
                  <div className="columns-1 sm:columns-2 md:columns-3">
                    {chapters?.map((chapter) => (
                      <div
                        ref={
                          chapter.slug === currentChapterSlug
                            ? currentChapterRef
                            : null
                        }
                        style={{
                          backgroundColor:
                            chapter.slug === currentChapterSlug
                              ? "#FF0"
                              : "transparent",
                          color:
                            chapter.slug === currentChapterSlug
                              ? "#000"
                              : "#FFF",
                        }}
                        key={chapter.slug + "-" + chapter.title}
                        onClick={() =>
                          navigate(`/${server}/reader/${slug}/${chapter.slug}`)
                        }
                      >
                        <div className="cursor-pointer hover:underline">
                          {chapter.title}
                          {history?.find((c) => c.chapter === chapter.slug) && (
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
