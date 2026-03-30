import { api } from "@/api/client";

export async function fetchAudio(text: string): Promise<HTMLAudioElement> {
  const response = await api.api.tts.speech.$post({
    json: {
      input: text,
      options: {
        voice: "en-US-GuyNeural",
      },
    },
  });

  if (!response.ok) {
    throw new Error("TTS request failed");
  }

  const audio = await getAudioFromResponse(response);
  return audio;
}

async function getAudioFromResponse(
  response: Response,
): Promise<HTMLAudioElement> {
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.autoplay = true;
  audio.muted = true;
  await new Promise((resolve) => (audio.onloadeddata = resolve));
  return audio;
}
