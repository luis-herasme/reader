import { useEffect, useState } from "react";
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
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { NOVELS_SEARCH, AUTH_IS_AUTHENTICATED } from "@/api/queryKeys";
import { Logo } from "@/components/logo";
import { ServerSelector } from "@/components/server-selector";
import { Button } from "@/components/ui/button";
import { navigate } from "wouter/use-browser-location";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Home({ server }: { server: string }) {
  const [search, setSearch] = useState<{
    search: string;
    page: number;
    server: string;
  }>({ search: "", page: 0, server });

  useEffect(() => {
    setSearch((value) => ({ ...value, server, page: 0 }));
  }, [server]);

  const searchQuery = useQuery({
    queryKey: [NOVELS_SEARCH, search],
    queryFn: async () => {
      const res = await api.api.novels.search.$get({
        query: {
          search: search.search,
          page: search.page.toString(),
          server: search.server,
        },
      });
      return res.json();
    },
    enabled: Boolean(search.search),
  });

  const { data: isAuthenticated } = useQuery({
    queryKey: [AUTH_IS_AUTHENTICATED],
    queryFn: async () => {
      const res = await api.api.auth["is-authenticated"].$get();
      return res.json();
    },
  });

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
            value={search.search}
            onChange={(e) =>
              setSearch((value) => ({ ...value, search: e.target.value }))
            }
          />
          <ServerSelector server={server} />
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
                search.page ? "cursor-pointer" : "opacity-0"
              }`}
              onClick={() => {
                setSearch((value) => {
                  if (value.page === 0) {
                    return value;
                  }

                  return {
                    server: value.server,
                    search: value.search,
                    page: value.page - 1,
                  };
                });
              }}
            >
              <ArrowLeft className="w-6 h-6" />
              Previous
            </div>

            {searchQuery.data.next && (
              <div
                className={`sm:text-xl text-white flex items-center justify-between gap-2 select-none cursor-pointer`}
                onClick={() => {
                  setSearch((value) => ({
                    server: value.server,
                    search: value.search,
                    page: value.page + 1,
                  }));
                }}
              >
                Next
                <ArrowRight className="w-6 h-6" />
              </div>
            )}
          </div>
          <div className="flex flex-wrap justify-center max-w-[1200px]">
            {searchQuery.data.results.map((result) => (
              <Novel
                key={result.name + "-" + result.image}
                name={result.name}
                slug={result.slug}
                image={result.image}
                server={server}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Novel({
  image,
  name,
  slug,
  server,
}: {
  image: string;
  name: string;
  slug: string;
  server: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div key={name + "-" + image} onClick={async () => setOpen(true)}>
        <div className="flex flex-col items-center justify-center m-4 duration-100 cursor-pointer hover:scale-105">
          {image ? (
            <img className="w-48 h-64 shadow-xl" src={image} />
          ) : (
            <div className="w-48 h-64 bg-[#222] border border-white border-opacity-20 shadow-xl text-white flex flex-col gap-2 items-center justify-center font-mono text-xs">
              <FileWarning className="w-12 h-12" strokeWidth={1} />
              no image
            </div>
          )}
          <div className="w-48 mt-2 text-center text-white">{name}</div>
        </div>
      </div>
      <ChaptersDialog
        server={server}
        name={name}
        open={open}
        setOpen={setOpen}
        slug={slug}
      />
    </>
  );
}
