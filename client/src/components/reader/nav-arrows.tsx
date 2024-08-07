import { Link } from "wouter";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "../ui/button";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function NavArrows({
  next,
  prev,
}: {
  next: string | null;
  prev: string | null;
}) {
  return (
    <>
      {prev && (
        <Link href={prev}>
          <NavButton className="left-12">
            <ArrowLeft className="w-6 h-6" />
            <span className="hidden md:block">Previous chapter</span>
          </NavButton>
        </Link>
      )}

      {next && (
        <Link href={next}>
          <NavButton className="right-12">
            <span className="hidden md:block">Next chapter</span>
            <ArrowRight className="w-6 h-6" />
          </NavButton>
        </Link>
      )}
    </>
  );
}

function NavButton({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  return (
    <Button
      className={cn(
        "h-12 translate-y-[50%] z-[49] fixed flex items-center justify-center gap-4 px-4 py-4 text-white duration-300 bg-black bg-opacity-50 border border-white rounded-full cursor-pointer select-none hover:bg-[#333] bottom-16 border-opacity-10 backdrop-blur",
        className
      )}
    >
      {children}
    </Button>
  );
}
