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
    this.audioLoader.preLoadAudios();
    this.currentSentenceIndex = sentenceIndex;
    this.forceUpdate();
  }

  setSpeed(speed: number) {
    this.speed = speed;
    this.audioElement.playbackRate = speed;
  }

  isPlaying() {
    return this.playing;
  }

  getCurrentSentenceIndex() {
    return this.currentSentenceIndex;
  }

  setCurrentSentenceIndex(index: number) {
    this.currentSentenceIndex = index;
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
      this.forceUpdate();
      await this.playSentence(i);

      if (!this.playing) {
        return;
      }
    }

    this.playing = false;
    this.onComplete();
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
