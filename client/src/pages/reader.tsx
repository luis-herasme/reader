import { useCallback, useEffect, useRef } from "react";
import { usePlayer } from "@/lib/use-player";

import { ListChapters } from "@/components/chapters";
import { ReaderSettings, useSettings } from "@/components/reader/settings";
import { FullScreen } from "@/components/reader/fullscreen";
import { useTrackSentenceIndex } from "@/components/reader/track-sentence-index";
import { FollowReader } from "@/components/reader/follow-reader";
import LibaryButton from "@/components/reader/libary-button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { NOVELS_CHAPTER, HISTORY_NOVEL } from "@/api/queryKeys";
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
import { useMediaSession } from "@/components/use-media-session";
import { useLocation } from "wouter";

export default function Reader({
  novel,
  chapter,
  server,
}: {
  novel: string;
  chapter: string;
  server: string;
}) {
  const queryClient = useQueryClient();
  const { settings } = useSettings();
  const sentencesRef = useRef<HTMLSpanElement[]>([]);
  const navigate = useLocation()[1];

  const { data, isLoading } = useQuery({
    queryKey: [NOVELS_CHAPTER, novel, chapter, server],
    queryFn: async () => {
      const res = await api.api.novels.chapter.$get({
        query: { novel, chapter, server },
      });
      return res.json();
    },
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const player = usePlayer({
    text: data?.content || "",
    sentenceIndex: data?.sentenceIndex || 0,
  });

  const goToNextPage = async () => {
    if (!data || !player) {
      return;
    }

    if (data.next) {
      await queryClient.invalidateQueries({
        queryKey: [NOVELS_CHAPTER, novel, chapter, server],
      });
      navigate(`/${server}/reader/${novel}/${data.next}`);
    } else {
      toast("There are no more chapters");
    }
  };

  const goToPreviousPage = async () => {
    if (!data || !player) {
      return;
    }

    if (data.prev) {
      await queryClient.invalidateQueries({
        queryKey: [NOVELS_CHAPTER, novel, chapter, server],
      });
      navigate(`/${server}/reader/${novel}/${data.prev}`);
    } else {
      toast("There are no previous chapters");
    }
  };

  const onNext = useCallback(
    debounce(() => {
      if (!data || !player) {
        return;
      }

      const nextIndex = player.nextIndex();

      if (nextIndex === null) {
        goToNextPage();
        return;
      }

      if (player.isPlaying()) {
        player.play(nextIndex);
      } else {
        player.setCurrentSentenceIndex(nextIndex);
      }
    }, 100),
    [player, data]
  );

  const onPrev = useCallback(
    debounce(() => {
      if (!data || !player) {
        return;
      }

      const previousIndex = player.previousIndex();

      if (previousIndex === null) {
        goToPreviousPage();
        return;
      }

      if (player.isPlaying()) {
        player.play(previousIndex);
      } else {
        player.setCurrentSentenceIndex(previousIndex);
      }
    }, 100),
    [player, data]
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

  player.onComplete = async () => {
    if (data && data.next && settings.autoAdvance) {
      await api.api.history.$post({
        json: {
          server,
          slug: novel,
          chapter,
          sentenceIndex: 0,
          length: player.sentences.length,
        },
      });

      await queryClient.invalidateQueries({
        queryKey: [HISTORY_NOVEL, novel],
      });
      goToNextPage();
    }
  };

  useEffect(() => {
    if (data && player && player.sentences.length) {
      api.api.history
        .$post({
          json: {
            server,
            slug: novel,
            chapter,
            sentenceIndex: player.getCurrentSentenceIndex(),
            length: player.sentences.length,
          },
        })
        .then(() =>
          queryClient.invalidateQueries({
            queryKey: [HISTORY_NOVEL, novel],
          })
        );
    }
  }, [data, player?.getCurrentSentenceIndex()]);

  const { theme } = useSettings();

  return (
    <div
      className="min-h-[100vh]"
      style={{
        backgroundColor: theme.background,
      }}
    >
      {data && <NavArrows next={goToNextPage} prev={goToPreviousPage} />}

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
        <LibaryButton />
      </div>

      <div className="translate-y-[50%] z-[49] p-4 gap-4 bottom-16 left-[50%] translate-x-[-50%] fixed bg-black bg-opacity-50 rounded-full border border-white border-opacity-10 backdrop-blur flex items-center justify-center">
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
          text={data?.content || ""}
        />
      </div>

      <Title slug={novel} />

      {isLoading ? (
        <LoadingScreen />
      ) : (
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
      )}
    </div>
  );
}
