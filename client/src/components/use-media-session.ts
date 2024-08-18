import { Player } from "@/lib/player";
import { useEffect } from "react";

export function useMediaSession({
  player,
  onTogglePlay,
}: {
  player: Player | null;
  onTogglePlay: () => void;
}) {
  useEffect(() => {
    function handlePlay(play: boolean) {
      if (player?.isPlaying() === play) {
        return;
      }

      onTogglePlay();
    }

    if ("mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("play", () => handlePlay(true));
      navigator.mediaSession.setActionHandler("pause", () => handlePlay(false));
      navigator.mediaSession.setActionHandler("stop", () => handlePlay(false));
    }

    return () => {
      if ("mediaSession" in navigator) {
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
        navigator.mediaSession.setActionHandler("stop", null);
      }
    };
  }, [player, onTogglePlay]);
}
