import { ReactNode } from "react";
import { useSettings } from "./settings";

const FONTS = {
  sans_serif: "font-sans",
  serif: "source-serif-4",
  monospace: "font-mono",
};

export function Sentences({ children }: { children: ReactNode }) {
  const { theme, settings } = useSettings();

  return (
    <div
      style={{
        background: theme.background,
      }}
    >
      <p
        className={`max-w-[1200px] mx-auto py-32 ${FONTS[settings.font]}`}
        style={{
          fontSize: settings.fontSize + "rem",
          lineHeight: settings.fontSize + 0.5 + "rem",
        }}
      >
        {children}
      </p>
    </div>
  );
}
