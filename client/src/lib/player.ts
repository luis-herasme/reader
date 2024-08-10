import NoSleep from "nosleep.js";
import { AudioLoader } from "./audio-loader";
import { extractSentences, sentenceIsValid } from "./sentence-utils";

const noSleep = new NoSleep();

export class Player {
  readonly sentences: string[] = [];
  readonly audioLoader: AudioLoader;

  private playing: boolean = false;
  private currentPlayID: number = 0;
  private currentSentenceIndex: number = 0;

  private readonly audioElement: HTMLAudioElement = new Audio();

  onComplete: () => void = () => {};
  private forceUpdate: () => void;

  // User state settings
  private speed: number = 1;
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
    this.currentSentenceIndex = sentenceIndex;
    this.audioLoader.preloadAudioIndex = this.currentSentenceIndex;
    this.forceUpdate();
  }

  setSpeed(speed: number) {
    this.speed = speed;
    this.audioElement.playbackRate = speed;
  }

  isPlaying() {
    return this.playing;
  }

  private setPlaying(value: boolean) {
    this.playing = value;

    if (value) {
      noSleep.enable();
      navigator.mediaSession.playbackState = "playing";
    } else {
      navigator.mediaSession.playbackState = "paused";
    }

    this.forceUpdate();
  }

  getCurrentSentenceIndex() {
    return this.currentSentenceIndex;
  }

  setCurrentSentenceIndex(index: number) {
    this.currentSentenceIndex = index;
    this.audioLoader.preloadAudioIndex = this.currentSentenceIndex;
    this.forceUpdate();
  }

  async play(index: number) {
    this.setPlaying(true);

    this.audioElement.currentTime = 0;

    const id = this.currentPlayID + 1;
    this.currentPlayID = id;

    for (let i = index; i < this.sentences.length; i++) {
      this.setCurrentSentenceIndex(i);
      await this.playSentence(id);

      if (this.currentPlayID !== id || !this.playing) {
        return;
      }
    }

    this.onComplete();
  }

  destroy() {
    this.stop();
    this.audioLoader.stopPreloading();
  }

  stop() {
    this.setPlaying(false);
    this.audioElement.pause();
    this.audioElement.currentTime = 0;
  }

  private stopOffsetInterval: ReturnType<typeof setInterval> | undefined;

  private async playSentence(playId: number) {
    const newAudio = await this.audioLoader.getAudio(this.currentSentenceIndex);

    if (!newAudio) {
      return;
    }

    this.audioElement.src = newAudio.src;
    this.audioElement.playbackRate = this.speed;
    this.audioElement.play();

    clearInterval(this.stopOffsetInterval);

    // Await the audio to finish playing
    await new Promise<void>((resolve) => {
      this.stopOffsetInterval = setInterval(() => {
        if (playId !== this.currentPlayID || this.playing === false) {
          clearInterval(this.stopOffsetInterval);
          resolve();
        }

        if (
          this.audioElement.currentTime >=
          this.audioElement.duration - this.stopOffset
        ) {
          clearInterval(this.stopOffsetInterval);
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
