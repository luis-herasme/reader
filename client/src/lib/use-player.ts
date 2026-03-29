import { Player } from "./player";
import { useEffect } from "react";
import { useForceUpdate } from "./use-force-update";
import { useSettings } from "@/components/reader/settings";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { SETTINGS_REPLACEMENT_RULES } from "@/api/queryKeys";

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
  const { data: replaceRules } = useQuery({
    queryKey: [SETTINGS_REPLACEMENT_RULES],
    queryFn: async () => {
      const res = await api.api.settings["replacement-rules"].$get();
      return res.json() as any;
    },
  });

  useEffect(() => {
    player.onUpdate = forceUpdate;
    player.setSpeed(settings.speed);
    player.stopOffset = settings.stopOffset;
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
