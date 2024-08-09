import { toast } from "sonner";
import { Player } from "@/lib/player";
import { useSettings } from "./settings";

export function Sentence({
  player,
  index,
  sentencesRef,
  sentence,
}: {
  player: Player;
  index: number;
  sentencesRef: React.MutableRefObject<HTMLSpanElement[]>;
  sentence: string;
}) {
  const isSentence = player.currentSentenceIndex === index;
  const isLoading = player.fetchings.get(index);
  const isReady = player.audios.get(index);
  const { theme } = useSettings();

  let style: React.CSSProperties = {};

  if (isSentence) {
    style = {
      backgroundColor: theme.activeSentenceBackgroundColor,
      color: "#000000",
    };
  } else if (!isReady && isLoading) {
    style = {
      backgroundColor: theme.loadingSentenceBackgroundColor,
      color: theme.readySentenceColor,
      animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      cursor: "pointer",
    };
  } else if (!isReady && !isLoading) {
    style = {
      color: theme.inactiveSentenceColor,
      cursor: "pointer",
    };
  } else if (isReady && !isLoading) {
    style = {
      color: theme.readySentenceColor,
      cursor: "pointer",
    };
  }

  if (sentence === "\n") {
    return <br />;
  }

  return (
    <>
      <span
        ref={
          isSentence
            ? (element) => {
                if (!element) return;
                sentencesRef.current[index] = element;
              }
            : null
        }
        style={style}
        className={`duration-300 ${isSentence ? "" : "sentence_hover"}`}
        onClick={() => {
          if (isSentence) {
            return;
          }

          // If this sentence is loading refetch it
          if (player.fetchings.get(index)) {
            player.refetchSentences();
            toast("Refetching sentence");
            return;
          }

          if (player.isPlaying()) {
            player.play(index);
          } else {
            player.currentSentenceIndex = index;
          }
        }}
        onDoubleClick={() => {
          if (player.fetchings.get(index)) {
            toast("Removing sentence from queue");
            player.removeFetching(index);

            if (player.currentSentenceIndex === index) {
              const nextIndex = player.nextIndex();

              if (nextIndex) {
                player.play(nextIndex);
              }
            }

            return;
          }
        }}
      >
        {sentence}
      </span>
      &nbsp;
    </>
  );
}
