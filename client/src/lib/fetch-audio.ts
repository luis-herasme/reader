import { EdgeSpeechTTS } from "@lobehub/tts";

const tts = new EdgeSpeechTTS({ locale: "en-US" });

export async function fetchAudio(text: string): Promise<HTMLAudioElement> {
  const payload = {
    input: text,
    options: {
      voice: "en-US-GuyNeural",
    },
  };

  const response = await tts.create(payload);
  const audio = await getAudioFromResponse(response);
  return audio;
}

async function getAudioFromResponse(
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
