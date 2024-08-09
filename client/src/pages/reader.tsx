import { log } from "@/lib/logs";
import { useCallback, useEffect, useRef } from "react";
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
import { toast } from "sonner";
import { useKeyboardControl } from "@/lib/use-keyboard-control";
import { debounce } from "@/lib/debounce";

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

  const onNext = useCallback(() => {
    debounce(() => {
      if (!data) {
        return;
      }

      const nextIndex = player.nextIndex();

      if (nextIndex === null) {
        if (data.next) {
          navigate(data.next);
        } else {
          toast("There are no more chapters");
        }

        return;
      }

      if (player.isPlaying()) {
        player.play(nextIndex);
      } else {
        player.currentSentenceIndex = nextIndex;
      }
    }, 100);
  }, [player, data]);

  const onPrev = useCallback(() => {
    debounce(() => {
      if (!data) {
        return;
      }

      const previousIndex = player.previousIndex();

      if (previousIndex === null) {
        if (data.prev) {
          navigate(data.prev);
        } else {
          toast("There are no previous chapters");
        }

        return;
      }

      if (player.isPlaying()) {
        player.play(previousIndex);
      } else {
        player.currentSentenceIndex = previousIndex;
      }
    }, 100);
  }, [player, data]);

  const onTogglePlay = useCallback(
    debounce(() => {
      if (player.isPlaying()) {
        player.cancel();
      } else {
        player.play(player.currentSentenceIndex);
      }
    }, 100),
    [player]
  );

  useKeyboardControl({ onNext, onPrev, onTogglePlay });

  useEffect(() => {
    function handlePlay(play: boolean) {
      log("");
      log(`Handling state change media session: ${player.isPlaying()}`);

      if (player.isPlaying() === play) {
        return;
      }

      onTogglePlay();
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
  }, [player, onTogglePlay]);

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
          next={data.next ? `/${server}/reader/${novel}/${data.next}` : null}
          prev={data.prev ? `/${server}/reader/${novel}/${data.prev}` : null}
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
