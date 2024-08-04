import { useEffect, useState } from "react";
import { useForceUpdate } from "./use-force-update";
import { trpcVanilla } from "../trpc";
import { useSettings, useSettingsStore } from "@/components/reader/settings";
import NoSleep from "nosleep.js";
import { AudioLoader } from "./audio-loader";
const noSleep = new NoSleep();

export function usePlayer(text: string, slug: string, chapterSlug: string) {
  const forceUpdate = useForceUpdate();
  const [player, setPlayer] = useState(
    () => new Player(text, slug, chapterSlug, forceUpdate)
  );
  const { settings } = useSettings();

  useEffect(() => {
    if (settings) {
      player.setSpeed(settings.speed);
      player.autoAdvance = settings.autoAdvance;
    }
  }, [player, settings]);

  useEffect(() => {
    const playing = player.playing;
    player.destroy();

    const newPlayer = new Player(text, slug, chapterSlug, forceUpdate);
    if (settings) {
      newPlayer.setSpeed(settings.speed);
      newPlayer.autoAdvance = settings.autoAdvance;
    }
    setPlayer(newPlayer);

    if (playing) {
      newPlayer.play(newPlayer.currentSentenceIndex);
    }
  }, [text]);

  return { player } as const;
}

export class Player {
  sentences: string[] = [];
  private playing_: boolean = false;
  private currentSentenceIndex_: number = 0;
  private currentPlayID: string = crypto.randomUUID();
  nextChapter: () => void = () => {};

  private audioLoader: AudioLoader;
  private audioElement: HTMLAudioElement = new Audio();
  private forceUpdate: () => void;
  private speed: number = 1;
  autoAdvance: boolean = true;
  slug: string;
  chapterSlug: string;

  constructor(
    text: string,
    slug: string,
    chapterSlug: string,
    forceUpdate: () => void
  ) {
    this.slug = slug;
    this.chapterSlug = chapterSlug;
    this.forceUpdate = forceUpdate;

    this.sentences = extractSentences(text);

    for (let sentence of this.sentences) {
      if (sentence.includes("<") && sentence.includes(">")) {
        sentence = sentence.replaceAll("<", "").replaceAll(">", "");
      }
    }

    this.audioLoader = new AudioLoader(this.sentences, forceUpdate);
    this.audioLoader.preLoadAudios();
    this.getCurrentSentenceIndexFromServer();
  }

  setSpeed(speed: number) {
    this.speed = speed;
    this.audioElement.playbackRate = speed;
  }

  async getCurrentSentenceIndexFromServer() {
    const historyItem = await trpcVanilla.history.read.query({
      slug: this.slug,
      chapter: this.chapterSlug,
    });

    if (!historyItem) {
      return;
    }

    this.currentSentenceIndex = historyItem.sentenceIndex;
  }

  get fetchings() {
    return this.audioLoader.fetchings;
  }

  get audios() {
    return this.audioLoader.audios;
  }

  get playing() {
    return this.playing_;
  }

  set playing(playing: boolean) {
    this.playing_ = playing;
    this.forceUpdate();
  }

  get currentSentenceIndex() {
    return this.currentSentenceIndex_;
  }

  set currentSentenceIndex(index: number) {
    this.currentSentenceIndex_ = index;
    this.audioLoader.preloadAudioIndex = this.currentSentenceIndex;
    this.forceUpdate();
  }

  refetchSentences() {
    this.audioLoader.refetchSentences();
  }

  removeFetching(index: number) {
    this.audioLoader.deleteFetchings(index);
  }

  // private video: HTMLVideoElement | undefined;
  // private playVideo() {
  //   if (!this.video) {
  //     this.video = document.getElementById("silent-video") as HTMLVideoElement;
  //   }

  //   this.video.play();
  // }

  async play(index: number) {
    noSleep.enable();
    this.cancel();
    navigator.mediaSession.playbackState = "playing";

    // this.playVideo();
    const id = crypto.randomUUID();
    this.playing = true;
    this.currentPlayID = id;

    for (let i = index; i < this.sentences.length; i++) {
      if (this.currentPlayID !== id) {
        return;
      }

      this.currentSentenceIndex = i;
      await this.playSentence(i);

      if (!this.playing) {
        return;
      }
    }

    if (this.autoAdvance) {
      this.currentSentenceIndex = 0;
      this.nextChapter();
    } else {
      this.playing = false;
      this.currentSentenceIndex = 0;
    }
  }

  destroy() {
    this.cancel();
    this.audioLoader.destroy();
  }

  cancel() {
    navigator.mediaSession.playbackState = "paused";
    this.playing = false;
    this.audioElement.pause();
    this.audioElement.currentTime = 0;
  }

  private async playSentence(index: number) {
    const newAudio = await this.audioLoader.getAudio(index, true);

    if (!newAudio) {
      return;
    }

    if (index !== this.currentSentenceIndex) {
      return;
    }

    this.audioElement.src = newAudio.src;
    this.audioElement.playbackRate = this.speed;
    this.audioElement.play();

    // Await the audio to finish playing
    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (
          this.audioElement.currentTime >=
          this.audioElement.duration - useSettingsStore.getState().stopOffset
        ) {
          clearInterval(interval);
          resolve();
        }
      }, 20);
    });
  }

  nextIndex() {
    let index = this.currentSentenceIndex + 1;

    while (!sentenceIsValid(this.sentences[index])) {
      index += 1;

      if (index >= this.sentences.length) {
        return index;
      }
    }

    return index;
  }

  previousIndex() {
    let index = this.currentSentenceIndex - 1;

    while (!sentenceIsValid(this.sentences[index])) {
      index -= 1;

      if (index < 0) {
        return index;
      }
    }

    return index;
  }
}

export function sentenceIsValid(sentence: string) {
  return !(
    sentence === "\n" ||
    !sentence ||
    sentence === " " ||
    (sentence.length === 1 && !sentence.match(/^[a-zA-Z0-9]+$/)) ||
    (sentence.trim().length <= 2 && !sentence.match(/^[a-zA-Z0-9]+$/)) ||
    !sentence.match(/[a-zA-Z0-9]/)
  );
}

const SENTENCE_DELIMITERS = [".", "?", "\n"];

function extractSentences(text: string): string[] {
  const sentences: string[] = [];
  let sentence = "";

  for (let i = 0; i < text.length; i++) {
    const character = text[i];
    if (SENTENCE_DELIMITERS.includes(character)) {
      if (character !== "\n") {
        sentence += character;
      }

      if (sentence.length === 0) {
        if (character === "\n") {
          sentences.push("\n");
        }
        continue;
      }

      sentences.push(sentence);

      sentence = "";

      if (character === "\n") {
        sentences.push("\n");
      }
    } else {
      sentence += character;
    }
  }

  if (sentence.length > 0) {
    sentences.push(sentence);
  }

  return sentences;
}
