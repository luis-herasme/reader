import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
import { FileWarning, Loader2, LogIn, LogOut } from "lucide-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ChaptersDialog } from "@/components/chapters";
// import { signOut, useSession } from "next-auth/react";
import HistoryDialog from "@/components/reader/history";
import { trpc } from "@/trpc";
import { Logo } from "@/components/logo";

export default function Home() {
  const [search, setSearch] = useState<{
    search: string;
    limit: number;
    offset: number;
  }>({
    search: "",
    limit: 20,
    offset: 0,
  });

  const searchQuery = trpc.novels.search.useQuery(search);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: isAuthenticated } = trpc.auth.isAuthenticated.useQuery();

  return (
    <div className="flex flex-col items-center justify-center overflow-y-auto">
      <div className="fixed top-4 right-4">
        <div>
          {isAuthenticated !== undefined &&
            (isAuthenticated ? (
              <div className="flex items-center justify-center gap-4">
                <HistoryDialog />
                <div
                  className="flex items-center gap-2 justify-center px-4 py-2 text-sm duration-200 text-white border border-white border-opacity-10 rounded-full cursor-pointer bg-[#151515] hover:bg-[#333]"
                  onClick={() => {
                    window.location.href = "/logout";
                  }}
                >
                  logout
                  <LogOut className="inline-block w-4 h-4" />
                </div>
              </div>
            ) : (
              <div
                className="flex items-center gap-2 justify-center px-4 py-2 text-sm duration-200 text-white border border-white border-opacity-10 rounded-full cursor-pointer bg-[#151515] hover:bg-[#333]"
                onClick={() => {
                  window.location.href = "/login";
                }}
              >
                login
                <LogIn className="inline-block w-4 h-4" />
              </div>
            ))}
        </div>
      </div>
      <div className="mt-64 mb-32">
        <Logo />
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          <Input
            className="rounded max-w-[90vw] h-10 w-96 outline-none border border-white border-opacity-10"
            value={search.search}
            onChange={(e) =>
              setSearch((value) => ({
                ...value,
                search: e.target.value,
              }))
            }
            placeholder="Search novel..."
            ref={inputRef}
          />
          {/* <Button
            className="h-10 px-6 border border-white rounded border-opacity-10"
            onClick={searchMangas}
            disabled={searching}
          >
            {searchQuery.isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Search"
            )}
          </Button> */}
        </div>
      </div>
      {searchQuery.isLoading && (
        <div className="flex items-center justify-center w-full h-[20vh]">
          <Loader2 className="w-32 h-32 animate-spin" />
        </div>
      )}
      {searchQuery.data && (
        <div className="flex flex-col justify-center max-w-[1200px] w-full">
          <div className="flex items-center justify-between w-full relative  mb-8 ">
            <div
              className={`sm:text-xl text-white flex items-center justify-between gap-2 select-none ${
                searchQuery.data.previous ? "cursor-pointer" : "opacity-0"
              }`}
              onClick={async () => {
                if (!searchQuery.data.previous) return;

                const url = new URL(searchQuery.data.previous);
                const limit = url.searchParams.get("limit") || "20";
                const offset = url.searchParams.get("offset") || "0";

                setSearch({
                  search: search.search,
                  limit: parseInt(limit),
                  offset: parseInt(offset),
                });
              }}
            >
              <ArrowLeft className="w-6 h-6" />
              Previous
            </div>
            <div className="flex flex-col items-center justify-center text-center absolute left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]">
              <div className="text-white sm:text-2xl">
                {searchQuery.data.count.toLocaleString()} results found
              </div>
              <div className="text-white opacity-50 ">
                Showing {search.offset + 1} to {search.offset + search.limit}
              </div>
            </div>

            <div
              className={`sm:text-xl text-white flex items-center justify-between gap-2 select-none ${
                searchQuery.data.next ? "cursor-pointer" : "opacity-10"
              }`}
              onClick={async () => {
                if (!searchQuery.data.next) return;

                const url = new URL(searchQuery.data.next);
                const limit = url.searchParams.get("limit") || "20";
                const offset = url.searchParams.get("offset") || "0";

                setSearch({
                  search: search.search,
                  limit: parseInt(limit),
                  offset: parseInt(offset),
                });
              }}
            >
              Next
              <ArrowRight className="w-6 h-6" />
            </div>
          </div>
          <div className="flex flex-wrap justify-center max-w-[1200px]">
            {searchQuery.data.results.map((result) => (
              <Manga
                key={result.name + "-" + result.image}
                name={result.name}
                slug={result.slug}
                image={result.image}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Manga({
  image,
  name,
  slug,
}: {
  image: string;
  name: string;
  slug: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div key={name + "-" + image} onClick={async () => setOpen(true)}>
        <div className="flex flex-col items-center shadow justify-center m-4 duration-100 cursor-pointer hover:scale-105">
          {image ? (
            <img className="w-48 h-64" src={image} />
          ) : (
            <div className="w-48 h-64 bg-[#222] border border-white border-opacity-20 shadow text-white flex flex-col gap-2 items-center justify-center font-mono text-xs">
              <FileWarning className="w-12 h-12" strokeWidth={1} />
              no image
            </div>
          )}
          <div className="w-48 mt-2 text-center text-white">{name}</div>
        </div>
      </div>
      <ChaptersDialog name={name} open={open} setOpen={setOpen} slug={slug} />
    </>
  );
}
