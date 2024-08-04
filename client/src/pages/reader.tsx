import { log } from "@/lib/logs";
import { useEffect, useRef } from "react";
import { Player, usePlayer } from "@/lib/player";

import {
  ArrowLeft,
  ArrowRight,
  Home,
  Loader2,
  Pause,
  Play,
} from "lucide-react";
import { ListChapters } from "@/components/chapters";
import { CircleButton } from "@/components/reader/circle-button";
import {
  ReaderSettings,
  useSettings,
  useSettingsStore,
} from "@/components/reader/settings";
import { FullScreen } from "@/components/reader/fullscreen";
import { useTrackSentenceIndex } from "@/components/reader/track-sentence-index";
import { getChaptersSlugs } from "@/components/reader/get-chapter-slugs";
import { FollowReader } from "@/components/reader/follow-reader";
import UserButton from "@/components/reader/user";
import { trpc, trpcVanilla } from "../trpc";
import { debounce } from "@/lib/debounce";
import { themes } from "../themes";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function Reader({ slug }: { slug: string }) {
  const navigate = useLocation()[1];

  useEffect(() => {
    localStorage.setItem(slug, "true");
  }, [slug]);

  const { settings } = useSettings();

  const togglingPlay = useRef(false);
  const sentencesRef = useRef<HTMLSpanElement[]>([]);

  const {
    title,
    novelSlug,
    nextChapterSlug,
    previousChapterSlug,
    currentChapterNumber,
  } = getChaptersSlugs(slug);

  const style = themes[useSettingsStore.getState().theme || "Dark"];
  const { data: text, isLoading } = trpc.novels.chapter.useQuery(slug);
  const { player } = usePlayer(text || "", slug);
  useTrackSentenceIndex(player, sentencesRef);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // If the event is not inside an input prevent default
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // If the control key is pressed, don't prevent default
      if (event.ctrlKey) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (togglingPlay.current) {
        return;
      }

      log("");
      log(`Key pressed: ${event.key} - ${event.code}`);
      log(`playing ${player.playing}`);

      if (
        event.code === "Space" ||
        event.key === "MediaPlayPause" ||
        event.key === "MediaPlay" ||
        event.key === "MediaPause"
      ) {
        togglingPlay.current = true;
        setTimeout(() => {
          togglingPlay.current = false;
        }, 100);

        if (player.playing) {
          player.cancel();
        } else {
          player.play(player.currentSentenceIndex);
        }

        togglingPlay.current = false;
      } else if (
        event.key === "ArrowRight" ||
        event.key === "MediaTrackNext" ||
        event.key === "ArrowDown"
      ) {
        const nextIndex = player.nextIndex();

        if (nextIndex >= player.sentences.length) {
          navigate(nextChapterSlug);
          return;
        }

        if (player.playing) {
          player.play(nextIndex);
        } else {
          player.currentSentenceIndex = nextIndex;
        }
      } else if (
        event.key === "ArrowLeft" ||
        event.key === "ArrowUp" ||
        event.key === "MediaTrackPrevious"
      ) {
        const previousIndex = player.previousIndex();

        if (previousIndex < 0) {
          navigate(previousChapterSlug);
          return;
        }

        if (player.playing && previousIndex > 0) {
          player.play(previousIndex);
        } else {
          player.currentSentenceIndex = previousIndex;
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [player]);

  useEffect(() => {
    function handlePlay(play: boolean) {
      if (togglingPlay.current) {
        return;
      }

      log("");
      log(`Handling state change media session: ${player.playing}`);

      togglingPlay.current = true;
      setTimeout(() => {
        togglingPlay.current = false;
      }, 100);

      if (player.playing === play) {
        return;
      }

      if (player.playing) {
        player.cancel();
      } else {
        player.play(player.currentSentenceIndex);
      }
    }

    if ("mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("play", () => {
        handlePlay(true);
      });

      navigator.mediaSession.setActionHandler("pause", () => {
        handlePlay(false);
      });

      navigator.mediaSession.setActionHandler("stop", () => {
        handlePlay(false);
      });
    }

    return () => {
      if ("mediaSession" in navigator) {
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
        navigator.mediaSession.setActionHandler("stop", null);
      }
    };
  }, [player]);

  const sentences = player.sentences.map((sentence, index) => {
    if (sentence === "\n") {
      return <br key={"jump-" + index} />;
    }

    return (
      <Sentence
        key={"sentence-" + index}
        player={player}
        index={index}
        sentencesRef={sentencesRef}
        sentence={sentence}
      />
    );
  });

  player.nextChapter = () => {
    navigate(nextChapterSlug);
  };

  useEffect(() => {
    document.title = title;
  }, [title]);

  const debouncedUpdateHistory = useRef(
    debounce((slug: string, sentenceIndex: number, length: number) => {
      const { novelSlug, currentChapterNumber } = getChaptersSlugs(slug);
      trpcVanilla.history.add.mutate({
        slug: novelSlug,
        chapter: currentChapterNumber,
        sentenceIndex,
        length,
      });
    }, 500)
  ).current;

  useEffect(() => {
    debouncedUpdateHistory(
      slug,
      player.currentSentenceIndex,
      player.sentences.length
    );
  }, [player.currentSentenceIndex]);

  return (
    <main>
      <audio id="silent-audio" src="/silence.mp3" />
      {currentChapterNumber > 1 && (
        <div
          className="translate-y-[50%] z-[49] fixed flex items-center justify-center gap-4 px-4 md:px-8 py-4 text-white duration-300 bg-black bg-opacity-50 border border-white rounded-full cursor-pointer select-none hover:bg-[#333] bottom-16 left-12 border-opacity-10 backdrop-blur"
          onClick={() => navigate(previousChapterSlug)}
        >
          <ArrowLeft className="w-6 h-6" />
          <span className="hidden md:block">Previous Chapter</span>
        </div>
      )}

      <div className="z-[49] flex-col fixed flex items-end justify-center gap-4 top-6 left-6 sm:top-12 sm:left-12">
        <CircleButton tooltip="Home" onClick={() => navigate("/")}>
          <Home className="w-6 h-6" />
        </CircleButton>

        <ListChapters name={title} slug={novelSlug} currentChapterSlug={slug} />
      </div>
      <div className="z-[49] fixed flex flex-col items-end justify-center gap-4 top-6 right-6 sm:top-12 sm:right-12">
        <FullScreen />
        <ReaderSettings />
        <UserButton />
      </div>

      <div
        className="translate-y-[50%] z-[49] fixed flex items-center justify-center gap-4 px-4 md:px-8 py-4 text-white duration-300 bg-black bg-opacity-50 border border-white rounded-full cursor-pointer select-none hover:bg-[#333] bottom-16 right-12 border-opacity-10 backdrop-blur"
        onClick={() => navigate(nextChapterSlug)}
      >
        <span className="hidden md:block">Next Chapter</span>
        <ArrowRight className="w-6 h-6" />
      </div>
      <div className="translate-y-[50%] z-[49] px-4 py-4 gap-4 bottom-16 left-[50%] translate-x-[-50%] fixed bg-black bg-opacity-50 rounded-full border border-white border-opacity-10 backdrop-blur flex items-center justify-center">
        {player.playing ? (
          <button
            className="bg-[#222] outline-none hover:bg-[#444] duration-300 p-2 text-white border border-white rounded-full border-opacity-10"
            onClick={() => player.cancel()}
          >
            <Pause fill="currentColor" className="w-6 h-6" />
          </button>
        ) : (
          <button
            onClick={() => player.play(player.currentSentenceIndex)}
            className="bg-[#222] outline-none hover:bg-[#444] duration-300 p-2 text-white border border-white rounded-full border-opacity-10"
          >
            <Play fill="currentColor" className="w-6 h-6" />
          </button>
        )}
        <FollowReader
          player={player}
          sentencesRef={sentencesRef}
          text={text || ""}
        />
      </div>
      <div
        className="fixed top-0 left-0 z-[10] w-full h-32 hidden sm:flex items-center justify-center"
        style={{
          background: `linear-gradient(180deg, ${style.background} 0%, rgba(0,0,0,0) 100%)`,
        }}
      >
        <h1
          style={{
            textShadow: `0 0 10px ${style.background}`,
            color: style.readySentenceColor,
          }}
          className="text-2xl source-serif-4 mb-12"
        >
          {title}
        </h1>
      </div>
      {isLoading ? (
        <div
          className="flex items-center justify-center h-screen"
          style={{
            background: style.background,
            color: style.readySentenceColor,
          }}
        >
          <Loader2 className="w-16 h-16 animate-spin" />
        </div>
      ) : (
        <div
          style={{
            background: style.background,
          }}
        >
          <p
            className={`text-xl max-w-[1200px] mx-auto py-32
            ${settings?.font === "sans_serif" && "font-sans"} ${
              settings?.font === "serif" && "source-serif-4"
            } ${settings?.font === "monospace" && "font-mono"}
          `}
            style={{
              fontSize: settings?.fontSize + "rem",
              lineHeight: settings ? settings.fontSize + 0.5 + "rem" : "",
            }}
          >
            {sentences}
          </p>
        </div>
      )}
    </main>
  );
}

function Sentence({
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
  const STYLE = themes[useSettingsStore.getState().theme || "Dark"];

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
