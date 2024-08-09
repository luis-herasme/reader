import { EdgeSpeechTTS } from "@lobehub/tts";
import { sentenceIsValid } from "./sentence-utils";

const tts = new EdgeSpeechTTS({ locale: "en-US" });

export class AudioLoader {
  private sentences: string[] = [];
  private audios: Map<number, HTMLAudioElement> = new Map();
  private fetchings: Map<number, boolean> = new Map();

  forceUpdate: () => void;

  constructor(sentences: string[], forceUpdate: () => void) {
    this.forceUpdate = forceUpdate;
    this.sentences = sentences;
    this.preLoadAudios();
  }

  setFetchings(key: number, value: boolean) {
    this.fetchings.set(key, value);
    this.forceUpdate();
  }

  deleteFetchings(key: number) {
    this.fetchings.delete(key);
    this.forceUpdate();
  }

  setAudios(key: number, value: HTMLAudioElement) {
    this.audios.set(key, value);
    this.forceUpdate();
  }

  deleteAudios(key: number) {
    this.audios.delete(key);
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
    const text = this.sentences[index];

    const payload = {
      input: text,
      options: {
        voice: "en-US-GuyNeural",
      },
    };

    this.setFetchings(index, true);
    const response = await tts.create(payload);
    const audio = await this.getAudioFromResponse(response);

    if (this.fetchings.get(index) === false) {
      // If the fetching was aborted, don't set the audio
      return audio;
    }

    this.deleteFetchings(index);
    this.setAudios(index, audio);
    return audio;
  }

  private async getAudioFromResponse(
    response: Response
  ): Promise<HTMLAudioElement> {
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.autoplay = true;
    audio.muted = true;
    await new Promise((resolve) => (audio.onloadeddata = resolve));
    return audio;
  }

  destroy() {
    this.stopPreloading();
  }

  private stopPreloading() {
    if (this.preloadInterval) {
      clearInterval(this.preloadInterval);
    }

    this.preloading = false;
  }

  private preloadAudioIndex_ = 0;

  set preloadAudioIndex(value: number) {
    this.preloadAudioIndex_ = value;
    this.preLoadAudios();
  }

  get preloadAudioIndex() {
    return this.preloadAudioIndex_;
  }

  private preloadInterval: ReturnType<typeof setInterval> | undefined;
  private preloading = false;

  async preLoadAudios() {
    if (this.preloading) {
      return;
    }

    clearInterval(this.preloadInterval);
    this.preloading = true;

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

    this.preloading = false;
  }
}
