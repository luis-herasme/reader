import { useState } from "react";
import {
  FilePlus2,
  FileWarning,
  Loader2,
  LogIn,
  LogOut,
  Menu,
} from "lucide-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ChaptersDialog } from "@/components/chapters";
import HistoryDialog from "@/components/reader/history";
import { Input } from "@/components/ui/input";
import { useSearchNovels } from "@/api/useNovels";
import { useIsAuthenticated } from "@/api/useAuth";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { navigate } from "wouter/use-browser-location";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const PAGE_SIZE = 10;

export default function Home() {
  const [search, setSearch] = useState<{
    title: string;
    skip: number;
    take: number;
  }>({ title: "", skip: 0, take: PAGE_SIZE });

  const { hasMore, hasPrevious, isLoading, data: searchData } = useSearchNovels(search);
  const { data: isAuthenticated } = useIsAuthenticated();

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="fixed top-0 right-0 p-4 z-50">
        <div className="sm:hidden block">
          <Sheet>
            <SheetTrigger>
              <Button size="icon">
                <Menu className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-2 mt-4">
                <Button
                  className="flex items-center justify-center gap-2 w-full"
                  onClick={() => {
                    navigate("/custom");
                  }}
                >
                  Read custom file
                  <FilePlus2 className="w-4 h-4" />
                </Button>
                {isAuthenticated !== undefined &&
                  (isAuthenticated ? (
                    <>
                      <HistoryDialog />
                      <Button
                        variant="destructive"
                        className="flex items-center justify-center gap-2 w-full"
                        onClick={() => {
                          window.location.href = "/api/auth/logout";
                        }}
                      >
                        logout
                        <LogOut className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="secondary"
                      className="flex items-center justify-center gap-2"
                      onClick={() => {
                        window.location.href = "/login";
                      }}
                    >
                      login
                      <LogIn className="w-4 h-4" />
                    </Button>
                  ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <div className="hidden items-center justify-end gap-2 flex-wrap sm:flex">
          <Button
            className="flex items-center justify-center gap-2"
            onClick={() => {
              navigate("/custom");
            }}
          >
            Read custom file
            <FilePlus2 className="w-4 h-4" />
          </Button>
          {isAuthenticated !== undefined &&
            (isAuthenticated ? (
              <>
                <HistoryDialog />
                <Button
                  variant="destructive"
                  className="flex items-center justify-center gap-2"
                  onClick={() => {
                    window.location.href = "/api/auth/logout";
                  }}
                >
                  logout
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button
                variant="secondary"
                className="flex items-center justify-center gap-2"
                onClick={() => {
                  window.location.href = "/login";
                }}
              >
                login
                <LogIn className="w-4 h-4" />
              </Button>
            ))}
        </div>
      </div>
      <div className="mt-64 mb-32 w-96 max-w-[90vw]">
        <Logo />
        <div className="mt-4 flex flex-col gap-2">
          <Input
            className="rounded h-10 w-full border border-white border-opacity-10"
            placeholder="Search novel..."
            value={search.title}
            onChange={(event) =>
              setSearch({ title: event.target.value, skip: 0, take: PAGE_SIZE })
            }
          />
        </div>
      </div>
      {isLoading && (
        <div className="flex items-center justify-center w-full h-[20vh]">
          <Loader2 className="w-32 h-32 animate-spin" />
        </div>
      )}
      {searchData && (
        <div className="flex flex-col justify-center max-w-[1200px] w-full">
          <div className="flex items-center justify-between w-full relative  mb-8 ">
            <div
              className={`sm:text-xl text-white flex items-center justify-between gap-2 select-none ${
                hasPrevious ? "cursor-pointer" : "opacity-0"
              }`}
              onClick={() => {
                if (hasPrevious) {
                  setSearch((value) => ({
                    ...value,
                    skip: Math.max(0, value.skip - value.take),
                  }));
                }
              }}
            >
              <ArrowLeft className="w-6 h-6" />
              Previous
            </div>

            {hasMore && (
              <div
                className={`sm:text-xl text-white flex items-center justify-between gap-2 select-none cursor-pointer`}
                onClick={() => {
                  setSearch((value) => ({
                    ...value,
                    skip: value.skip + value.take,
                  }));
                }}
              >
                Next
                <ArrowRight className="w-6 h-6" />
              </div>
            )}
          </div>
          <div className="flex flex-wrap justify-center max-w-[1200px]">
            {searchData.books.map((book) => (
              <BookCard
                key={book.bookId}
                bookId={book.bookId}
                title={book.title}
                imageUrl={book.imageUrl}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type BookCardProps = {
  bookId: string;
  title: string;
  imageUrl: string | null;
};

function BookCard({ bookId, title, imageUrl }: BookCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div onClick={async () => setOpen(true)}>
        <div className="flex flex-col items-center justify-center m-4 duration-100 cursor-pointer hover:scale-105">
          {imageUrl ? (
            <img className="w-48 h-64 shadow-xl" src={imageUrl} />
          ) : (
            <div className="w-48 h-64 bg-[#222] border border-white border-opacity-20 shadow-xl text-white flex flex-col gap-2 items-center justify-center font-mono text-xs">
              <FileWarning className="w-12 h-12" strokeWidth={1} />
              no image
            </div>
          )}
          <div className="w-48 mt-2 text-center text-white">{title}</div>
        </div>
      </div>
      <ChaptersDialog
        bookId={bookId}
        name={title}
        open={open}
        setOpen={setOpen}
      />
    </>
  );
}
