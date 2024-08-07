import { toast } from "sonner";
import { themes } from "@/themes";
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
  const { settings } = useSettings();
  const STYLE = themes[settings.theme];

  let style: React.CSSProperties = {};

  if (isSentence) {
    style = {
      backgroundColor: STYLE.activeSentenceBackgroundColor,
      color: "#000000",
    };
  } else if (!isReady && isLoading) {
    style = {
      backgroundColor: STYLE.loadingSentenceBackgroundColor,
      color: STYLE.readySentenceColor,
      animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      cursor: "pointer",
    };
  } else if (!isReady && !isLoading) {
    style = {
      color: STYLE.inactiveSentenceColor,
      cursor: "pointer",
    };
  } else if (isReady && !isLoading) {
    style = {
      color: STYLE.readySentenceColor,
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

          if (player.playing) {
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
              player.play(player.nextIndex());
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
