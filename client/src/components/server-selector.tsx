import { Button } from "./ui/button";
import { navigate } from "wouter/use-browser-location";

const SERVERS = [
  {
    label: "server 1",
    slug: "s1",
  },
  {
    label: "server 2",
    slug: "s2",
  },
];

export function ServerSelector({ server }: { server: string }) {
  return (
    <>
      <div className="text-sm bg-[#222] rounded p-4">
        You can search for novels from multiple sources. There are currently two
        sources available:
        <div className="flex items-center mt-2 gap-2">
          {SERVERS.map((s) => (
            <Button
              size="sm"
              className="rounded"
              disabled={s.slug === server}
              onClick={() => navigate(`/${s.slug}`)}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="opacity-50 text-xs">
        You are currently searching from{" "}
        <b>{SERVERS.find((s) => s.slug === server)?.label}</b>. If you can't
        find anything, try searching from another server.
      </div>
    </>
  );
}
