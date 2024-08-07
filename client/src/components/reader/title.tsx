import { useEffect } from "react";
import { useSettings } from "@/components/reader/settings";

export function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function Title({ slug }: { slug: string }) {
  const { theme } = useSettings();

  useEffect(() => {
    document.title = slugToTitle(slug);

    return () => {
      document.title = "Reader";
    };
  }, [slug]);

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
        className="text-2xl source-serif-4 mb-12"
      >
        {slugToTitle(slug)}
      </h1>
    </div>
  );
}
