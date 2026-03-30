import { ReactNode } from "react";
import { useSettings } from "./settings";
import { useFont } from "../use-font";

export function Sentences({ children }: { children: ReactNode }) {
  const { theme, settings } = useSettings();
  const font = useFont();

  return (
    <div
      style={{
        background: theme.background,
      }}
    >
      <p
        className={`max-w-[1200px] mx-auto py-32 ${font}`}
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
