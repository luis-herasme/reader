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
  const isSentence = player.getCurrentSentenceIndex() === index;
  const status = player.audioLoader.getAudioStatus(index);
  const { theme } = useSettings();

  let style: React.CSSProperties = {};

  if (isSentence) {
    if (status === "loading") {
      style = {
        animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        backgroundColor: theme.activeSentenceBackgroundColor,
        color: "#000000",
      };
    } else {
      style = {
        backgroundColor: theme.activeSentenceBackgroundColor,
        color: "#000000",
      };
    }
  } else if (status === "loading") {
    style = {
      backgroundColor: theme.loadingSentenceBackgroundColor,
      color: theme.readySentenceColor,
      animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      cursor: "pointer",
    };
  } else if (status === "inactive") {
    style = {
      color: theme.inactiveSentenceColor,
      cursor: "pointer",
    };
  } else if (status === "ready") {
    style = {
      color: theme.readySentenceColor,
      cursor: "pointer",
    };
  } else if (status === "invalid") {
    style = {
      color: theme.invalidSentenceColor,
    };
  }

  if (sentence === "\n") {
    return <br />;
  }

  return (
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
      className={`duration-300 ${
        isSentence || status === "invalid" ? "" : "sentence_hover"
      }`}
      onClick={() => {
        if (isSentence || status === "invalid") {
          return;
        }

        // If this sentence is loading refetch it
        if (player.audioLoader.getAudioStatus(index) === "loading") {
          player.audioLoader.refetchSentences();
          toast("Refetching sentence");
          return;
        }

        if (player.isPlaying()) {
          player.play(index);
        } else {
          player.setCurrentSentenceIndex(index);
        }
      }}
      onDoubleClick={() => {
        if (player.audioLoader.getAudioStatus(index) === "loading") {
          toast("Removing sentence from queue");
          player.audioLoader.deleteFetchings(index);

          if (player.getCurrentSentenceIndex() === index) {
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
  );
}
