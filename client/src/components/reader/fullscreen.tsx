import { Expand, Shrink } from "lucide-react";
import { CircleButton } from "../circle-button";
import { useEffect, useState } from "react";

export function FullScreen() {
  const [fullScreen, setFullScreen] = useState(false);

  useEffect(() => {
    if (fullScreen) {
      document.documentElement.requestFullscreen();
    } else if (!fullScreen && document.fullscreenElement) {
      document.exitFullscreen();
    }
  }, [fullScreen]);

  useEffect(() => {
    const handleFullScreenChange = () => {
      setFullScreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
    };
  }, []);

  return (
    <CircleButton
      tooltip="Full screen"
      onClick={() => setFullScreen(!fullScreen)}
    >
      {fullScreen ? (
        <Shrink className="w-6 h-6" />
      ) : (
        <Expand className="w-6 h-6" />
      )}
    </CircleButton>
  );
}
