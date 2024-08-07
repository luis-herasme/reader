import { Loader2 } from "lucide-react";
import { useSettings } from "@/components/reader/settings";

export function LoadingScreen() {
  const { theme } = useSettings();

  return (
    <div
      className="flex items-center justify-center h-screen"
      style={{
        background: theme.background,
        color: theme.readySentenceColor,
      }}
    >
      <Loader2 className="w-16 h-16 animate-spin" />
    </div>
  );
}
