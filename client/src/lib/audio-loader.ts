import { fetchAudio } from "./fetch-audio";
import { sentenceIsValid } from "./sentence-utils";

export class AudioLoader {
  public preloadAudioIndex = 0;
  private sentences: string[] = [];
  private audios: Map<number, HTMLAudioElement> = new Map();
  private fetchings: Map<number, boolean> = new Map();
  private preloadInterval: ReturnType<typeof setInterval> | undefined;
  private forceUpdate: () => void;

  constructor(sentences: string[], forceUpdate: () => void) {
    this.forceUpdate = forceUpdate;
    this.sentences = sentences;
    this.preLoadAudios();
  }

  stopPreloading() {
    clearInterval(this.preloadInterval);
  }

  deleteFetchings(key: number) {
    this.fetchings.delete(key);
    this.forceUpdate();
  }

  refetchSentences() {
    for (let i = 0; i < this.sentences.length; i++) {
      const fetching = this.fetchings.get(i);

      if (fetching) {
        this.deleteFetchings(i);
        this.fetchAudio(i);
      }
    }
  }

  getAudioStatus(index: number): "loading" | "ready" | "inactive" | "invalid" {
    if (!sentenceIsValid(this.sentences[index])) {
      return "invalid";
    }

    if (this.fetchings.get(index)) {
      return "loading";
    }

    if (this.audios.get(index)) {
      return "ready";
    }

    return "inactive";
  }

  async getAudio(index: number): Promise<HTMLAudioElement | undefined> {
    if (!sentenceIsValid(this.sentences[index])) {
      return;
    }

    if (this.audios.get(index)) {
      return this.audios.get(index)!;
    }

    if (this.fetchings.get(index)) {
      return await this.awaitAudio(index);
    }

    if (this.preloadAudioIndex < index) {
      this.preloadAudioIndex = index + 1;
    }

    return await this.fetchAudio(index);
  }

  private async awaitAudio(index: number): Promise<HTMLAudioElement> {
    return await new Promise((resolve) => {
      const interval = setInterval(() => {
        const audio = this.audios.get(index);
        if (audio) {
          clearInterval(interval);
          resolve(audio);
        }
      }, 100);
    });
  }

  private async fetchAudio(index: number): Promise<HTMLAudioElement> {
    this.fetchings.set(index, true);
    this.forceUpdate();

    const audio = await fetchAudio(this.sentences[index]);

    // If the fetching was aborted, don't set the audio
    if (this.fetchings.get(index) === false) {
      return audio;
    }

    this.fetchings.delete(index);
    this.audios.set(index, audio);
    this.forceUpdate();

    return audio;
  }

  private async preLoadAudios() {
    clearInterval(this.preloadInterval);

    this.preloadInterval = setInterval(() => {
      if (this.preloadAudioIndex >= this.sentences.length) {
        return;
      }

      if (this.fetchings.size < 10) {
        const status = this.getAudioStatus(this.preloadAudioIndex);

        if (status === "inactive") {
          this.fetchAudio(this.preloadAudioIndex);
        }

        this.preloadAudioIndex += 1;
      }
    }, 50);
  }
}
