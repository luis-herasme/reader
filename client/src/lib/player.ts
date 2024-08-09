import { useEffect, useState } from "react";
import { useForceUpdate } from "./use-force-update";
import { useSettings } from "@/components/reader/settings";
import NoSleep from "nosleep.js";
import { AudioLoader } from "./audio-loader";
const noSleep = new NoSleep();

export function usePlayer(text: string, sentenceIndex: number) {
  const forceUpdate = useForceUpdate();
  const [player, setPlayer] = useState(
    () => new Player(text, sentenceIndex, forceUpdate)
  );
  const { settings } = useSettings();

  useEffect(() => {
    if (settings) {
      player.setSpeed(settings.speed);
      player.autoAdvance = settings.autoAdvance;
      player.stopOffset = settings.stopOffset;
    }
  }, [player, settings]);

  useEffect(() => {
    const playing = player.isPlaying();
    player.destroy();

    const newPlayer = new Player(text, sentenceIndex, forceUpdate);

    if (settings) {
      newPlayer.setSpeed(settings.speed);
      newPlayer.autoAdvance = settings.autoAdvance;
    }

    setPlayer(newPlayer);

    if (playing) {
      newPlayer.play(newPlayer.currentSentenceIndex);
    }
  }, [text, sentenceIndex]);

  useEffect(() => {
    return () => {
      player.destroy();
    };
  }, [player]);

  return { player } as const;
}

export class Player {
  readonly sentences: string[] = [];

  private playing: boolean = false;
  private currentPlayID: number = 0;
  private currentSentenceIndex_: number = 0;

  private readonly audioLoader: AudioLoader;
  private readonly audioElement: HTMLAudioElement = new Audio();

  nextChapter: () => void = () => {};
  private forceUpdate: () => void;

  // User state settings
  private speed: number = 1;
  public autoAdvance: boolean = true;
  public stopOffset: number = 0;

  constructor(text: string, sentenceIndex: number, forceUpdate: () => void) {
    this.forceUpdate = forceUpdate;

    this.sentences = extractSentences(text);

    for (let i = 0; i < this.sentences.length; i++) {
      this.sentences[i] = this.sentences[i]
        .replaceAll("<", "")
        .replaceAll(">", "");
    }

    this.audioLoader = new AudioLoader(this.sentences, forceUpdate);
    this.audioLoader.preLoadAudios();
    this.currentSentenceIndex = sentenceIndex;
  }

  setSpeed(speed: number) {
    this.speed = speed;
    this.audioElement.playbackRate = speed;
  }

  get fetchings() {
    return this.audioLoader.fetchings;
  }

  get audios() {
    return this.audioLoader.audios;
  }

  isPlaying() {
    return this.playing;
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

  async play(index: number) {
    noSleep.enable();
    this.cancel();
    navigator.mediaSession.playbackState = "playing";

    const id = this.currentPlayID + 1;
    this.currentPlayID = id;

    this.playing = true;
    this.forceUpdate();

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
      this.forceUpdate();
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
    this.forceUpdate();
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
          this.audioElement.duration - this.stopOffset
        ) {
          clearInterval(interval);
          resolve();
        }
      }, 20);
    });
  }

  // Returns the next index that is a valid sentence, or null if
  // there are no more valid sentences (reached the end)
  nextIndex() {
    let index = this.currentSentenceIndex + 1;

    while (!sentenceIsValid(this.sentences[index])) {
      index += 1;

      if (index >= this.sentences.length) {
        return null;
      }
    }

    return index;
  }

  // Returns the previous index that is a valid sentence, or null
  // if there are no more valid sentences (reached the start)
  previousIndex() {
    let index = this.currentSentenceIndex - 1;

    while (!sentenceIsValid(this.sentences[index])) {
      index -= 1;

      if (index < 0) {
        return null;
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
