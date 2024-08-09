import { Player } from "./player";
import { useEffect, useState } from "react";
import { useForceUpdate } from "./use-force-update";
import { useSettings } from "@/components/reader/settings";

export function usePlayer({
  text,
  sentenceIndex,
}: {
  text: string;
  sentenceIndex: number;
}) {
  const { settings } = useSettings();
  const forceUpdate = useForceUpdate();
  const [player, setPlayer] = useState<Player | null>(null);

  useEffect(() => {
    if (settings && player) {
      player.setSpeed(settings.speed);
      player.autoAdvance = settings.autoAdvance;
      player.stopOffset = settings.stopOffset;
    }
  }, [player, settings]);

  useEffect(() => {
    const playing = player?.isPlaying();
    player?.destroy();

    const newPlayer = new Player(text, sentenceIndex, forceUpdate);

    setPlayer(newPlayer);

    if (playing) {
      newPlayer.play(newPlayer.currentSentenceIndex);
    }
  }, [text, sentenceIndex]);

  useEffect(() => {
    return () => {
      if (player) {
        player.destroy();
      }
    };
  }, [player]);

  return player;
}
