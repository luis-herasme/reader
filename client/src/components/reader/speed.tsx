import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Settings2 } from "lucide-react";
import { useSettings } from "./settings";

export function VoiceSpeed() {
  const { settings, updateSettings } = useSettings();

  if (!settings) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <span className="text-xs relative font-mono text-white bg-[#222] hover:bg-[#444] duration-300 p-2 border border-white rounded-full border-opacity-10 cursor-pointer">
          <Settings2 size={16} />
        </span>
      </PopoverTrigger>
      <PopoverContent className="z-[300] w-[250px] bg-[#111] p-4 text-white border-white border-opacity-10">
        <div className="flex items-center justify-between">
          <div className="mb-2 text-sm opacity-80">Speed of the voice</div>
          <div className="mb-2 text-sm font-bold opacity-90">
            {settings.speed}x
          </div>
        </div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-center text-white opacity-50">
            0.5x
          </span>
          <span className="text-xs text-center text-white opacity-50">4x</span>
        </div>
        <Slider
          defaultValue={[settings.speed]}
          max={4}
          min={0.25}
          step={0.25}
          className="w-full mb-1 cursor-pointer"
          onValueChange={(value) => updateSettings.mutate({ speed: value[0] })}
        />
      </PopoverContent>
    </Popover>
  );
}
