import { log } from "@/lib/logs";
import { useEffect, useRef } from "react";
import { usePlayer } from "@/lib/player";

import { ListChapters } from "@/components/chapters";
import {
  ReaderSettings,
  useSettings,
  useSettingsStore,
} from "@/components/reader/settings";
import { FullScreen } from "@/components/reader/fullscreen";
import { useTrackSentenceIndex } from "@/components/reader/track-sentence-index";
import { FollowReader } from "@/components/reader/follow-reader";
import UserButton from "@/components/reader/user";
import { trpc, trpcVanilla } from "../trpc";
import { debounce } from "@/lib/debounce";
import { themes } from "../themes";
import { useLocation } from "wouter";
import { HomeButton } from "@/components/reader/home-button";
import { NavArrows } from "@/components/reader/nav-arrows";
import { PlayButton } from "@/components/reader/play-pause";
import { slugToTitle, Title } from "@/components/reader/title";
import { Sentence } from "@/components/reader/sentence";
import { LoadingScreen } from "@/components/reader/loading-screen";

export default function Reader({
  novel,
  chapter,
  server,
}: {
  novel: string;
  chapter: string;
  server: string;
}) {
  const navigate = useLocation()[1];

  useEffect(() => {
    localStorage.setItem(chapter, "true");
  }, [chapter]);

  const { settings } = useSettings();

  const togglingPlay = useRef(false);
  const sentencesRef = useRef<HTMLSpanElement[]>([]);

  const style = themes[useSettingsStore.getState().theme];

  const { data, isLoading } = trpc.novels.chapter.useQuery(
    {
      novel,
      chapter,
      server,
    },
    {
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    }
  );

  const { player } = usePlayer(data?.content || "", novel, chapter);
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

        if (data && data.next && nextIndex >= player.sentences.length) {
          navigate(data.next);
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

        if (data && data.prev && previousIndex < 0) {
          navigate(data.prev);
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

  player.nextChapter = () => {
    if (data && data.next) {
      navigate(data.next);
    }
  };

  const debouncedUpdateHistory = useRef(
    debounce(
      (state: {
        slug: string;
        chapter: string;
        sentenceIndex: number;
        length: number;
        server: string;
      }) => {
        trpcVanilla.history.add.mutate(state);
      },
      500
    )
  ).current;

  useEffect(() => {
    debouncedUpdateHistory({
      server,
      slug: novel,
      chapter,
      sentenceIndex: player.currentSentenceIndex,
      length: player.sentences.length,
    });
  }, [player.currentSentenceIndex]);

  return (
    <div>
      {data && (
        <NavArrows
          next={`/${server}/reader/${novel}/${data.next}`}
          prev={`/${server}/reader/${novel}/${data.prev}`}
        />
      )}

      <div className="z-[49] flex-col fixed flex items-end justify-center gap-4 top-6 left-6 sm:top-12 sm:left-12">
        <HomeButton />

        <ListChapters
          server={server}
          slug={novel}
          name={slugToTitle(novel)}
          currentChapterSlug={chapter}
        />
      </div>
      <div className="z-[49] fixed flex flex-col items-end justify-center gap-4 top-6 right-6 sm:top-12 sm:right-12">
        <FullScreen />
        <ReaderSettings />
        <UserButton />
      </div>

      <div className="translate-y-[50%] z-[49] px-4 py-4 gap-4 bottom-16 left-[50%] translate-x-[-50%] fixed bg-black bg-opacity-50 rounded-full border border-white border-opacity-10 backdrop-blur flex items-center justify-center">
        <PlayButton
          playing={player.playing}
          onClick={() => {
            if (player.playing) {
              player.cancel();
            } else {
              player.play(player.currentSentenceIndex);
            }
          }}
        />

        <FollowReader
          player={player}
          sentencesRef={sentencesRef}
          text={data?.content || ""}
        />
      </div>

      <Title slug={novel} />

      {isLoading ? (
        <LoadingScreen />
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
            {player.sentences.map((sentence, index) => (
              <Sentence
                key={"sentence-" + index}
                player={player}
                index={index}
                sentencesRef={sentencesRef}
                sentence={sentence}
              />
            ))}
          </p>
        </div>
      )}
    </div>
  );
}
