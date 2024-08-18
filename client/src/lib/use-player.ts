import { Player } from "./player";
import { useEffect } from "react";
import { useForceUpdate } from "./use-force-update";
import { useSettings } from "@/components/reader/settings";
import { trpc } from "@/trpc";

const player = new Player();

export function usePlayer({
  text,
  sentenceIndex,
}: {
  text: string;
  sentenceIndex: number;
}) {
  const forceUpdate = useForceUpdate();
  const { settings } = useSettings();
  const { data: replaceRules } = trpc.settings.replacementRules.useQuery();

  useEffect(() => {
    player.onUpdate = forceUpdate;

    if (settings) {
      player.setSpeed(settings.speed);
      player.stopOffset = settings.stopOffset;
    }
  }, [settings, forceUpdate]);

  useEffect(() => {
    player.setText({
      text: applyReplaceRules(text, replaceRules),
      sentenceIndex,
    });
  }, [text, sentenceIndex, replaceRules]);

  useEffect(() => {
    return () => player.reset();
  }, []);

  return player;
}

function applyReplaceRules(
  text: string,
  replaceRules: { from: string; to: string }[] = []
) {
  let newText = `${text}`;

  for (const replaceRule of replaceRules) {
    newText = newText.replaceAll(replaceRule.from, replaceRule.to);
  }

  return newText;
}
