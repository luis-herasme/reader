import { useCallback, useEffect, useRef } from "react";
import { usePlayer } from "@/lib/use-player";

import { ListChapters } from "@/components/chapters";
import { ReaderSettings, useSettings } from "@/components/reader/settings";
import { FullScreen } from "@/components/reader/fullscreen";
import { useTrackSentenceIndex } from "@/components/reader/track-sentence-index";
import { FollowReader } from "@/components/reader/follow-reader";
import LibaryButton from "@/components/reader/libary-button";
import { useQueryClient } from "@tanstack/react-query";
import { useChapter, NOVELS_CHAPTER } from "@/api/useNovels";
import { addHistory, HISTORY_NOVEL } from "@/api/useHistory";
import { HomeButton } from "@/components/reader/home-button";
import { NavArrows } from "@/components/reader/nav-arrows";
import { PlayButton } from "@/components/reader/play-pause";
import { Title } from "@/components/reader/title";
import { Sentence } from "@/components/reader/sentence";
import { LoadingScreen } from "@/components/reader/loading-screen";
import { Sentences } from "@/components/reader/sentences";
import { toast } from "sonner";
import { useKeyboardControl } from "@/lib/use-keyboard-control";
import { debounce } from "@/lib/debounce";
import { useMediaSession } from "@/components/use-media-session";
import { useLocation } from "wouter";

type ReaderProps = {
  bookId: string;
  chapterId: string;
};

export default function Reader({ bookId, chapterId }: ReaderProps) {
  const queryClient = useQueryClient();
  const { settings } = useSettings();
  const sentencesRef = useRef<HTMLSpanElement[]>([]);
  const navigate = useLocation()[1];

  const { data, isLoading } = useChapter({ chapterId });

  const player = usePlayer({
    text: data?.content || "",
    sentenceIndex: data?.sentenceIndex || 0,
  });

  const goToNextPage = async () => {
    if (!data || !player) {
      return;
    }

    if (data.nextChapterId) {
      await queryClient.invalidateQueries({
        queryKey: [NOVELS_CHAPTER, chapterId],
      });
      navigate(`/reader/${bookId}/${data.nextChapterId}`);
    } else {
      toast("There are no more chapters");
    }
  };

  const goToPreviousPage = async () => {
    if (!data || !player) {
      return;
    }

    if (data.previousChapterId) {
      await queryClient.invalidateQueries({
        queryKey: [NOVELS_CHAPTER, chapterId],
      });
      navigate(`/reader/${bookId}/${data.previousChapterId}`);
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
    if (data && data.nextChapterId && settings.autoAdvance) {
      await addHistory({
        bookId,
        chapterId,
        sentenceIndex: 0,
        length: player.sentences.length,
      });

      await queryClient.invalidateQueries({
        queryKey: [HISTORY_NOVEL, bookId],
      });
      goToNextPage();
    }
  };

  useEffect(() => {
    if (data && player && player.sentences.length) {
      addHistory({
        bookId,
        chapterId,
        sentenceIndex: player.getCurrentSentenceIndex(),
        length: player.sentences.length,
      }).then(() =>
          queryClient.invalidateQueries({
            queryKey: [HISTORY_NOVEL, bookId],
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
          bookId={bookId}
          name={data?.bookTitle ?? ""}
          currentChapterId={chapterId}
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
            if (!player) {
              return;
            }

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

      <Title title={data?.bookTitle ?? ""} />

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
