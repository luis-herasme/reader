import { FollowReader } from "@/components/reader/follow-reader";
import { FullScreen } from "@/components/reader/fullscreen";
import { HomeButton } from "@/components/reader/home-button";
import { PlayButton } from "@/components/reader/play-pause";
import { Sentence } from "@/components/reader/sentence";
import { Sentences } from "@/components/reader/sentences";
import { ReaderSettings, useSettings } from "@/components/reader/settings";
import { Title } from "@/components/reader/title";
import { useTrackSentenceIndex } from "@/components/reader/track-sentence-index";
import { Button } from "@/components/ui/button";
import { useMediaSession } from "@/components/use-media-session";
import { debounce } from "@/lib/debounce";
import { useKeyboardControl } from "@/lib/use-keyboard-control";
import { usePlayer } from "@/lib/use-player";
import { useCallback, useRef, useState } from "react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/text-area";
import { Pencil } from "lucide-react";

export function Custom() {
  const sentencesRef = useRef<HTMLSpanElement[]>([]);
  const [text, setText] = useState("");
  const player = usePlayer({ text, sentenceIndex: 0 });

  const onNext = useCallback(
    debounce(() => {
      if (!player) {
        return;
      }

      const nextIndex = player.nextIndex();

      if (nextIndex === null) {
        return;
      }

      if (player.isPlaying()) {
        player.play(nextIndex);
      } else {
        player.setCurrentSentenceIndex(nextIndex);
      }
    }, 100),
    [player]
  );

  const onPrev = useCallback(
    debounce(() => {
      if (!player) {
        return;
      }

      const previousIndex = player.previousIndex();

      if (previousIndex === null) {
        return;
      }

      if (player.isPlaying()) {
        player.play(previousIndex);
      } else {
        player.setCurrentSentenceIndex(previousIndex);
      }
    }, 100),
    [player]
  );

  const onTogglePlay = useCallback(
    debounce(() => {
      if (!player) {
        return;
      }

      if (player.isPlaying()) {
        player.stop();
      } else {
        player.play(player.getCurrentSentenceIndex());
      }
    }, 300),
    [player]
  );

  useTrackSentenceIndex(player, sentencesRef);
  useKeyboardControl({ onNext, onPrev, onTogglePlay });
  useMediaSession({ player, onTogglePlay });

  const { theme } = useSettings();

  return (
    <div
      className="min-h-[100vh]"
      style={{
        backgroundColor: theme.background,
      }}
    >
      <div className="z-[49] fixed flex flex-col items-end justify-center gap-4 top-6 sm:top-12 left-6 sm:left-12">
        <HomeButton />
      </div>

      <div className="z-[49] fixed flex flex-col items-end justify-center gap-4 top-6 sm:top-12 right-6 sm:right-12">
        <FullScreen />
        <ReaderSettings />
      </div>

      <div className="translate-y-[50%] z-[49] p-4 gap-4 bottom-16 left-[50%] translate-x-[-50%] fixed bg-black bg-opacity-50 rounded-full border border-white border-opacity-10 backdrop-blur flex items-center justify-center">
        {text && (
          <Edit text={text} setText={setText}>
            <Button className="rounded-full w-10 h-10 px-0 py-0">
              <Pencil className="w-4 h-4" />
            </Button>
          </Edit>
        )}

        <PlayButton
          playing={player ? player.isPlaying() : false}
          onClick={() => {
            if (!player) return;

            if (player.isPlaying()) {
              player.stop();
            } else {
              player.play(player.getCurrentSentenceIndex());
            }
          }}
        />

        <FollowReader
          currentSentenceIndex={player ? player.getCurrentSentenceIndex() : 0}
          sentencesRef={sentencesRef}
          text={text}
        />
      </div>

      <Title title="Custom file" />

      {text ? (
        <Sentences>
          {player?.sentences.map((sentence, index) => (
            <Sentence
              key={"sentence-" + index}
              player={player}
              index={index}
              sentencesRef={sentencesRef}
              sentence={sentence}
            />
          ))}
        </Sentences>
      ) : (
        <div className="flex items-center justify-center h-[100vh]">
          <div className=" max-w-[300px]">
            <p
              className="text-lg opacity-70 mb-4"
              style={{
                color: theme.readySentenceColor,
              }}
            >
              This is a custom file that you can edit. Copy and paste your own
              text to read it.
            </p>
            <Edit text={text} setText={setText}>
              <Button className="w-full" variant="secondary">
                Add text
              </Button>
            </Edit>
          </div>
        </div>
      )}
    </div>
  );
}

function Edit({
  text,
  setText,
  children,
}: {
  text: string;
  setText: (text: string) => void;
  children: React.ReactNode;
}) {
  const [currentText, setCurrentText] = useState(text);

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          setText(currentText);
        }
      }}
    >
      <DialogTrigger className="w-full">{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Custom file</DialogTitle>
        </DialogHeader>
        <p className="text-sm opacity-80">
          This is a custom file that you can edit. Copy and paste your own text
          to read it.
        </p>
        <Textarea
          className="min-h-[500px]"
          onChange={(e) => setCurrentText(e.target.value)}
        >
          {currentText}
        </Textarea>
      </DialogContent>
    </Dialog>
  );
}
