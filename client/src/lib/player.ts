import NoSleep from "nosleep.js";
import { AudioLoader } from "./audio-loader";
import { extractSentences, sentenceIsValid } from "./sentence-utils";

const noSleep = new NoSleep();

export class Player {
  readonly audioLoader = new AudioLoader(this);

  public sentences: string[] = [];
  private playing: boolean = false;
  private currentPlayID: number = 0;
  private currentSentenceIndex: number = 0;

  private readonly audioElement: HTMLAudioElement = new Audio();

  onComplete: () => void = () => {};
  onUpdate: () => void = () => {};

  // User state settings
  private speed: number = 1;
  public stopOffset: number = 0;

  setText({ text, sentenceIndex }: { text: string; sentenceIndex: number }) {
    const playing = this.playing;
    this.reset();
    this.sentences = extractSentences(text);
    this.setCurrentSentenceIndex(sentenceIndex);
    this.audioLoader.preLoadAudios();

    if (playing) {
      this.play(sentenceIndex);
    }
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

    this.onUpdate();
  }

  getCurrentSentenceIndex() {
    return this.currentSentenceIndex;
  }

  setCurrentSentenceIndex(index: number) {
    this.currentSentenceIndex = index;
    this.audioLoader.preloadAudioIndex = this.currentSentenceIndex;
    this.onUpdate();
  }

  async play(index: number) {
    this.stop();
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

  reset() {
    this.stop();
    this.setCurrentSentenceIndex(0);
    this.audioLoader.reset();
  }

  stop() {
    this.setPlaying(false);
    this.audioElement.currentTime = 0;
    this.audioElement.pause();
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
