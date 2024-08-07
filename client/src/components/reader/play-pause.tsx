import { Pause, Play } from "lucide-react";

export function PlayButton({
  playing,
  onClick,
}: {
  playing: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="bg-[#222] outline-none hover:bg-[#444] duration-300 p-2 text-white border border-white rounded-full border-opacity-10"
      onClick={onClick}
    >
      {playing ? (
        <Pause fill="currentColor" className="w-6 h-6" />
      ) : (
        <Play fill="currentColor" className="w-6 h-6" />
      )}
    </button>
  );
}
