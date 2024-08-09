import { Home } from "lucide-react";
import { navigate } from "wouter/use-browser-location";
import { CircleButton } from "@/components/circle-button";

export function HomeButton() {
  return (
    <CircleButton tooltip="Home" onClick={() => navigate("/")}>
      <Home className="w-6 h-6" />
    </CircleButton>
  );
}
