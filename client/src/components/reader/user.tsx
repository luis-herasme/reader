import { CircleButton } from "./circle-button";
import { LogIn, LogOut, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LibraryContent } from "./library";
import { trpc } from "@/trpc";

export default function UserButton() {
  const { data } = trpc.auth.isAuthenticated.useQuery();

  return (
    <Dialog>
      <DialogTrigger>
        <CircleButton tooltip={data ? "log out" : "log in"} onClick={() => {}}>
          <User className="w-6 h-6" />
        </CircleButton>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>User</DialogTitle>
        </DialogHeader>
        <LibraryContent />
        {data ? (
          <a
            className="flex items-center justify-center w-full gap-2 p-2 rounded-lg cursor-pointer select-none border-opacity-10 bg-[#111] hover:bg-[#222] duration-200 text-sm"
            href="/logout"
          >
            Logout
            <LogOut className="w-4 h-4" />
          </a>
        ) : (
          <a
            className="flex items-center justify-center w-full gap-2 p-2 rounded-lg cursor-pointer select-none border-opacity-10 bg-[#111] hover:bg-[#222] duration-200 text-sm"
            href="/login/google"
          >
            Login
            <LogIn className="w-4 h-4" />
          </a>
        )}
      </DialogContent>
    </Dialog>
  );
}
