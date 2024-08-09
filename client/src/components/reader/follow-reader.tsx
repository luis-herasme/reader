import { Locate, LocateOff } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect, useRef, useState } from "react";

export function FollowReader({
  text,
  currentSentenceIndex,
  sentencesRef,
}: {
  text: string;
  currentSentenceIndex: number;
  sentencesRef: React.MutableRefObject<HTMLSpanElement[]>;
}) {
  const [followReader, setFollowReader] = useState(true);
  const scrollingProgrammatically = useRef(false);
  const currentScrollTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setFollowReader(true);
  }, [text]);

  useEffect(() => {
    const currentRef = sentencesRef.current[currentSentenceIndex];

    if (currentRef && followReader) {
      scrollingProgrammatically.current = true;
      currentRef.scrollIntoView({ block: "center" });

      clearTimeout(currentScrollTimeout.current);
      currentScrollTimeout.current = setTimeout(() => {
        scrollingProgrammatically.current = false;
      }, 100);
    }
  }, [currentSentenceIndex, followReader]);

  // If the users scrolls the page, stop following the reader. We should differentiate between the user scrolling and the reader scrolling
  useEffect(() => {
    function handleScroll() {
      if (scrollingProgrammatically.current) {
        return;
      }

      setFollowReader(false);
    }

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div
            className="bg-[#222] outline-none hover:bg-[#444] duration-300 p-2 text-white border border-white rounded-full border-opacity-10"
            onClick={() => setFollowReader((value) => !value)}
          >
            {followReader ? (
              <LocateOff className="w-3 h-3" />
            ) : (
              <Locate className="w-3 h-3" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Scroll with reader</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
