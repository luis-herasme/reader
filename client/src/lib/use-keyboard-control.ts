import { log } from "@/lib/logs";
import { useEffect } from "react";

const MOVE_LEFT_KEYS = ["ArrowLeft", "ArrowUp", "MediaTrackPrevious"];
const MOVE_RIGHT_KEYS = ["ArrowRight", "MediaTrackNext", "ArrowDown"];
const TOGGLE_PLAY_KEYS = [" ", "MediaPlayPause", "MediaPlay", "MediaPause"];

export function useKeyboardControl({
  onNext,
  onPrev,
  onTogglePlay,
}: {
  onNext: () => void;
  onPrev: () => void;
  onTogglePlay: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // If the event is not inside an input prevent default
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // If the control key is pressed, don't prevent default
      if (event.ctrlKey) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      log("");
      log(`Key pressed: ${event.key} - ${event.code}`);

      if (TOGGLE_PLAY_KEYS.includes(event.key)) {
        onTogglePlay();
      }

      if (MOVE_RIGHT_KEYS.includes(event.key)) {
        onNext();
      }

      if (MOVE_LEFT_KEYS.includes(event.key)) {
        onPrev();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onNext, onPrev, onTogglePlay]);
}
