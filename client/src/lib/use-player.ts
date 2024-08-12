import { Player } from "./player";
import { useEffect, useState } from "react";
import { useForceUpdate } from "./use-force-update";
import { useSettings } from "@/components/reader/settings";
import { trpc } from "@/trpc";

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
  const { data: replaceRules } = trpc.settings.replacementRules.useQuery();

  useEffect(() => {
    if (settings && player) {
      player.setSpeed(settings.speed);
      player.stopOffset = settings.stopOffset;
    }
  }, [player, settings]);

  useEffect(() => {
    const playing = player?.isPlaying();
    player?.destroy();

    let newText = `${text}`;

    if (replaceRules) {
      for (const replaceRule of replaceRules) {
        newText = newText.replaceAll(replaceRule.from, replaceRule.to);
      }
    }

    const newPlayer = new Player(newText, sentenceIndex, forceUpdate);

    setPlayer(newPlayer);

    if (playing) {
      newPlayer.play(newPlayer.getCurrentSentenceIndex());
    }
  }, [text, sentenceIndex, replaceRules]);

  useEffect(() => {
    return () => {
      if (player) {
        player.destroy();
      }
    };
  }, [player]);

  return player;
}
