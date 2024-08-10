import { CircleButton } from "../circle-button";
import { Library } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { LibraryContent } from "./library";

export default function LibaryButton() {
  return (
    <Dialog>
      <DialogTrigger>
        <CircleButton tooltip={"Library"} onClick={() => {}}>
          <Library className="w-6 h-6" />
        </CircleButton>
      </DialogTrigger>
      <LibraryContent />
    </Dialog>
  );
}
