import { CaseSensitive, ChevronDown, Palette, Settings } from "lucide-react";
import { CircleButton } from "./circle-button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { Switch } from "@/components/ui/switch";
import Logs from "@/lib/logs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { trpc } from "../../trpc";
import { useEffect, useRef } from "react";
import { debounce } from "@/lib/debounce";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { themes } from "../../themes";

type SettingsState = {
  speed: number;
  fontSize: number;
  font: "serif" | "sans_serif" | "monospace";
  autoAdvance: boolean;
  stopOffset: number;
  theme: string;
};

export const useSettingsStore = create(
  persist<SettingsState>(
    () => ({
      speed: 1,
      fontSize: 1.125,
      font: "serif",
      autoAdvance: true,
      stopOffset: 0,
      theme: "Dark",
    }),
    {
      name: "settings-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export function useSettings() {
  const utils = trpc.useUtils();
  const settings = useSettingsStore();
  const { data } = trpc.settings.getState.useQuery();

  const updateSettings = trpc.settings.update.useMutation({
    onMutate: (value) => useSettingsStore.setState(value),
    onSuccess: () => utils.settings.getState.invalidate(),
  });

  const debouncedUpdateSettings = useRef(
    debounce((value) => updateSettings.mutate(value), 300)
  ).current;

  const optimisticUpdateWithDebounce = (value: Partial<SettingsState>) => {
    debouncedUpdateSettings(value);
    useSettingsStore.setState(value);
  };

  useEffect(() => {
    if (data) {
      useSettingsStore.setState(data);
    }
  }, [data]);

  return {
    settings,
    updateSettings,
    debouncedUpdateSettings,
    optimisticUpdateWithDebounce,
  } as const;
}

export function ReaderSettings() {
  const { settings, updateSettings, optimisticUpdateWithDebounce } =
    useSettings();

  return (
    <Dialog>
      <DialogTrigger>
        <CircleButton tooltip="Settings" onClick={() => {}}>
          <Settings className="w-6 h-6" />
        </CircleButton>
      </DialogTrigger>
      <DialogContent className="text-white max-h-[100dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center justify-between gap-4 p-4 border border-white rounded-lg border-opacity-10">
          <div className="flex flex-row items-center justify-between w-full gap-4">
            <div className="space-y-0.5 w-full">
              <div className="flex items-center justify-between">
                <p>Player speed</p>
                <div className="mb-2 text-sm font-bold opacity-90">
                  {settings.speed}x
                </div>
              </div>
              <p className="text-sm opacity-60">
                How fast the player should advance through the chapter.
              </p>
            </div>
          </div>
          <div className="w-full">
            <Slider
              defaultValue={[settings.speed]}
              value={[settings.speed]}
              max={4}
              min={0.25}
              step={0.25}
              className="w-full mb-1 cursor-pointer"
              onValueChange={(value) =>
                optimisticUpdateWithDebounce({ speed: value[0] })
              }
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-center text-white opacity-50">
                0.5x
              </span>
              <span className="text-xs text-center text-white opacity-50">
                4x
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-4 p-4 border border-white rounded-lg border-opacity-10">
          <div className="flex flex-row items-center justify-between w-full gap-4">
            <div className="space-y-0.5 w-full">
              <div className="flex items-center justify-between">
                <p>Change font size</p>
                <div className="mb-2 text-sm font-bold opacity-90">
                  {settings.fontSize}rem
                </div>
              </div>
              <p className="text-sm opacity-60">
                Change the font size used for the reader.
              </p>
            </div>
          </div>
          <div className="w-full">
            <Slider
              defaultValue={[settings.fontSize]}
              value={[settings.fontSize]}
              max={4}
              min={0.25}
              step={0.25}
              className="w-full mb-1 cursor-pointer"
              onValueChange={(value) =>
                optimisticUpdateWithDebounce({ fontSize: value[0] })
              }
            />
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-4 p-4 border border-white rounded-lg border-opacity-10">
          <div className="flex flex-row items-center justify-between w-full gap-4">
            <div className="space-y-0.5 w-full">
              <div className="flex items-center justify-between">
                <p>Stop offset</p>
                <div className="mb-2 text-sm font-bold opacity-90">
                  {settings.stopOffset}s
                </div>
              </div>
              <p className="text-sm opacity-60">
                Jump to the next sentence when the sentence duration minus the
                sentence current time is less than this value.
              </p>
            </div>
          </div>
          <div className="w-full">
            <Slider
              defaultValue={[settings.stopOffset]}
              value={[settings.stopOffset]}
              max={2}
              min={0}
              step={0.05}
              className="w-full mb-1 cursor-pointer"
              onValueChange={(value) =>
                optimisticUpdateWithDebounce({ stopOffset: value[0] })
              }
            />
          </div>
        </div>
        <div className="flex flex-row items-center justify-between gap-4 p-4 border border-white rounded-lg border-opacity-10">
          <div className="flex flex-row items-center justify-between gap-4">
            <CaseSensitive className="hidden w-8 h-8 sm:block" />
            <div className="space-y-0.5">
              <p>Change font</p>
              <p className="text-sm opacity-60">
                Change the font used for the reader.
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <div className="flex flex-row items-center justify-between w-[150px] bg-[#111] gap-4 px-4 py-2 border border-white rounded-lg select-none border-opacity-10">
                <div className="text-sm">
                  {settings.font.charAt(0).toUpperCase() +
                    settings.font.slice(1)}
                </div>
                <ChevronDown className="w-4 h-4 opacity-60" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => updateSettings.mutate({ font: "serif" })}
              >
                Serif
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => updateSettings.mutate({ font: "sans_serif" })}
              >
                Sans-serif
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => updateSettings.mutate({ font: "monospace" })}
              >
                Monospace
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex flex-row items-center justify-between gap-4 p-4 border border-white rounded-lg border-opacity-10">
          <div className="flex flex-row items-center justify-between gap-4">
            <Palette className="hidden w-8 h-8 sm:block" />
            <div className="space-y-0.5">
              <p>Change theme</p>
              <p className="text-sm opacity-60">
                Change the theme used for the reader.
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <div className="flex flex-row items-center justify-between w-[150px] bg-[#111] gap-4 px-4 py-2 border border-white rounded-lg select-none border-opacity-10">
                <div className="text-sm">{settings.theme}</div>
                <ChevronDown className="w-4 h-4 opacity-60" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {Object.keys(themes).map((themeName) => (
                <DropdownMenuItem
                  key={"theme-" + themeName}
                  className="cursor-pointer"
                  onClick={() =>
                    useSettingsStore.setState({ theme: themeName })
                  }
                >
                  {themeName}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex flex-row items-center justify-between gap-4 p-4 border border-white rounded-lg border-opacity-10">
          <div className="flex flex-row items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p>Auto-advance</p>
              <p className="text-sm opacity-60">
                Automatically jump to next chapter when you reach the end of the
                current chapter.
              </p>
            </div>
          </div>
          <Switch
            checked={settings.autoAdvance}
            onCheckedChange={() =>
              updateSettings.mutate({ autoAdvance: !settings.autoAdvance })
            }
          />
        </div>
        <Logs />
      </DialogContent>
    </Dialog>
  );
}
