import { Player } from "./player";
import { fetchAudio } from "./fetch-audio";
import { sentenceIsValid } from "./sentence-utils";

export class AudioLoader {
  public preloadAudioIndex = 0;
  private audios: Map<number, HTMLAudioElement> = new Map();
  private fetchings: Map<number, boolean> = new Map();
  private preloadInterval: ReturnType<typeof setInterval> | undefined;
  private player: Player;

  constructor(player: Player) {
    this.player = player;
    this.preLoadAudios();
  }

  reset() {
    this.stopPreloading();
    this.audios.clear();
    this.fetchings.clear();
  }

  private stopPreloading() {
    clearInterval(this.preloadInterval);
  }

  deleteFetchings(key: number) {
    this.fetchings.delete(key);
    this.player.onUpdate();
  }

  refetchSentences() {
    for (let i = 0; i < this.player.sentences.length; i++) {
      const fetching = this.fetchings.get(i);

      if (fetching) {
        this.deleteFetchings(i);
        this.fetchAudio(i);
      }
    }
  }

  getAudioStatus(index: number): "loading" | "ready" | "inactive" | "invalid" {
    if (!sentenceIsValid(this.player.sentences[index])) {
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
    if (!sentenceIsValid(this.player.sentences[index])) {
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
    this.player.onUpdate();

    const audio = await fetchAudio(this.player.sentences[index]);

    // If the fetching was aborted, don't set the audio
    if (this.fetchings.get(index) === false) {
      return audio;
    }

    this.fetchings.delete(index);
    this.audios.set(index, audio);
    this.player.onUpdate();

    return audio;
  }

  async preLoadAudios() {
    clearInterval(this.preloadInterval);

    this.preloadInterval = setInterval(() => {
      if (this.preloadAudioIndex >= this.player.sentences.length) {
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
