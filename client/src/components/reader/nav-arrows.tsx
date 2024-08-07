import { Link } from "wouter";
import { ArrowLeft, ArrowRight } from "lucide-react";

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
          <div className="translate-y-[50%] z-[49] fixed flex items-center justify-center gap-4 px-4 md:px-8 py-4 text-white duration-300 bg-black bg-opacity-50 border border-white rounded-full cursor-pointer select-none hover:bg-[#333] bottom-16 left-12 border-opacity-10 backdrop-blur">
            <ArrowLeft className="w-6 h-6" />
            <span className="hidden md:block">Previous Chapter</span>
          </div>
        </Link>
      )}

      {next && (
        <Link href={next}>
          <div className="translate-y-[50%] z-[49] fixed flex items-center justify-center gap-4 px-4 md:px-8 py-4 text-white duration-300 bg-black bg-opacity-50 border border-white rounded-full cursor-pointer select-none hover:bg-[#333] bottom-16 right-12 border-opacity-10 backdrop-blur">
            <span className="hidden md:block">Next Chapter</span>
            <ArrowRight className="w-6 h-6" />
          </div>
        </Link>
      )}
    </>
  );
}
