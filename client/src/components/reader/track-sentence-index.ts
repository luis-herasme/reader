import { useEffect } from "react";
import { Player } from "@/lib/player";

// When we change the text, we need to scroll to the correct sentence
export function useTrackSentenceIndex(
  player: Player | null,
  sentencesRef: React.MutableRefObject<HTMLSpanElement[]>
) {
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!player) return;

      // This is a hack to make sure the user is scrolled to the correct position
      // We need to wait for the page to load and then scroll to the correct position
      const currentRef = sentencesRef.current[player.currentSentenceIndex];

      if (currentRef) {
        currentRef.scrollIntoView({ block: "center" });
      }
    }, 1000);

    return () => {
      clearTimeout(timeout);
    };
  }, [player]);
}
