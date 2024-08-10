import { Loader2 } from "lucide-react";

export function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <Loader2 className="w-12 h-12 animate-spin" strokeWidth={1} />
    </div>
  );
}
