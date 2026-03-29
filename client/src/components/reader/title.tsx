import { useEffect } from "react";
import { useSettings } from "@/components/reader/settings";
import { useFont } from "../useFont";

type TitleProps = {
  title: string;
};

export function Title({ title }: TitleProps) {
  const { theme } = useSettings();
  const font = useFont();

  useEffect(() => {
    document.title = title || "Reader";

    return () => {
      document.title = "Reader";
    };
  }, [title]);

  return (
    <div
      className="fixed top-0 left-0 z-[10] w-full h-32 hidden sm:flex items-center justify-center"
      style={{
        background: `linear-gradient(180deg, ${theme.background} 0%, rgba(0,0,0,0) 100%)`,
      }}
    >
      <h1
        style={{
          textShadow: `0 0 10px ${theme.background}`,
          color: theme.readySentenceColor,
        }}
        className={`text-2xl mb-12 ${font}`}
      >
        {title}
      </h1>
    </div>
  );
}
