import { useSettings } from "./reader/settings";

const FONTS = {
  sans_serif: "font-sans",
  serif: "source-serif-4",
  monospace: "font-mono",
};

export function useFont() {
  const { settings } = useSettings();
  return FONTS[settings.font];
}
