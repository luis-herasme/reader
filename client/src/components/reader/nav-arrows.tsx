import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "../ui/button";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function NavArrows({
  next,
  prev,
}: {
  next: () => Promise<void> | null;
  prev: () => Promise<void> | null;
}) {
  return (
    <>
      {prev && (
        <NavButton className="left-12" onClick={prev}>
          <ArrowLeft className="w-6 h-6" />
          <span className="hidden md:block">Previous chapter</span>
        </NavButton>
      )}

      {next && (
        <NavButton className="right-12" onClick={next}>
          <span className="hidden md:block">Next chapter</span>
          <ArrowRight className="w-6 h-6" />
        </NavButton>
      )}
    </>
  );
}

function NavButton({
  className,
  children,
  onClick,
}: {
  className: string;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "h-12 translate-y-[50%] z-[49] fixed flex items-center justify-center gap-4 px-4 py-4 text-white duration-300 bg-black bg-opacity-50 border border-white rounded-full cursor-pointer select-none hover:bg-[#333] bottom-16 border-opacity-10 backdrop-blur",
        className
      )}
    >
      {children}
    </Button>
  );
}
