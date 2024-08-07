import { Home } from "lucide-react";
import { useLocation } from "wouter";
import { CircleButton } from "@/components/circle-button";

export function HomeButton() {
  const navigate = useLocation()[1];

  return (
    <CircleButton tooltip="Home" onClick={() => navigate("/")}>
      <Home className="w-6 h-6" />
    </CircleButton>
  );
}
