import { log } from "@/lib/logs";
import { useEffect, useRef } from "react";
import { usePlayer } from "@/lib/player";

import { ListChapters } from "@/components/chapters";
import { ReaderSettings } from "@/components/reader/settings";
import { FullScreen } from "@/components/reader/fullscreen";
import { useTrackSentenceIndex } from "@/components/reader/track-sentence-index";
import { FollowReader } from "@/components/reader/follow-reader";
import UserButton from "@/components/reader/user";
import { trpc, trpcVanilla } from "../trpc";
import { useLocation } from "wouter";
import { HomeButton } from "@/components/reader/home-button";
import { NavArrows } from "@/components/reader/nav-arrows";
import { PlayButton } from "@/components/reader/play-pause";
import { slugToTitle, Title } from "@/components/reader/title";
import { Sentence } from "@/components/reader/sentence";
import { LoadingScreen } from "@/components/reader/loading-screen";
import { Sentences } from "@/components/reader/sentences";

export default function Reader({
  novel,
  chapter,
  server,
}: {
  novel: string;
  chapter: string;
  server: string;
}) {
  const utils = trpc.useUtils();
  const navigate = useLocation()[1];

  const togglingPlay = useRef(false);
  const sentencesRef = useRef<HTMLSpanElement[]>([]);

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

  const { player } = usePlayer(data?.content || "", data?.sentenceIndex || 0);
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
      log(`playing ${player.isPlaying()}`);

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

        if (player.isPlaying()) {
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

        if (player.isPlaying()) {
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

        if (player.isPlaying() && previousIndex > 0) {
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
      log(`Handling state change media session: ${player.isPlaying()}`);

      togglingPlay.current = true;
      setTimeout(() => {
        togglingPlay.current = false;
      }, 100);

      if (player.isPlaying() === play) {
        return;
      }

      if (player.isPlaying()) {
        player.cancel();
      } else {
        player.play(player.currentSentenceIndex);
      }
    }

    if ("mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("play", () => handlePlay(true));
      navigator.mediaSession.setActionHandler("pause", () => handlePlay(false));
      navigator.mediaSession.setActionHandler("stop", () => handlePlay(false));
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

  useEffect(() => {
    if (data && player.sentences) {
      trpcVanilla.history.add
        .mutate({
          server,
          slug: novel,
          chapter,
          sentenceIndex: player.currentSentenceIndex,
          length: player.sentences.length,
        })
        .then(() => {
          utils.history.novelHistory.invalidate(novel);
        });
    }
  }, [data, player.currentSentenceIndex]);

  return (
    <div>
      {data && (
        <NavArrows
          next={`/${server}/reader/${novel}/${data.next}`}
          prev={`/${server}/reader/${novel}/${data.prev}`}
        />
      )}

      <div className="z-[49] fixed flex flex-col items-end justify-center gap-4 top-6 sm:top-12 left-6 sm:left-12">
        <HomeButton />

        <ListChapters
          server={server}
          slug={novel}
          name={slugToTitle(novel)}
          currentChapterSlug={chapter}
        />
      </div>

      <div className="z-[49] fixed flex flex-col items-end justify-center gap-4 top-6 sm:top-12 right-6 sm:right-12">
        <FullScreen />
        <ReaderSettings />
        <UserButton />
      </div>

      <div className="translate-y-[50%] z-[49] p-4 gap-4 bottom-16 left-[50%] translate-x-[-50%] fixed bg-black bg-opacity-50 rounded-full border border-white border-opacity-10 backdrop-blur flex items-center justify-center">
        <PlayButton
          playing={player.isPlaying()}
          onClick={() => {
            if (player.isPlaying()) {
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
        <Sentences>
          {player.sentences.map((sentence, index) => (
            <Sentence
              key={"sentence-" + index}
              player={player}
              index={index}
              sentencesRef={sentencesRef}
              sentence={sentence}
            />
          ))}
        </Sentences>
      )}
    </div>
  );
}
