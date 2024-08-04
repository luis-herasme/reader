import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Bug } from "lucide-react";
import { create } from "zustand";

type GlobalLogState = {
  logs: {
    message: string;
    timestamp: number;
  }[];
};

const useLogStore = create<GlobalLogState>(() => ({
  logs: [
    {
      message: "Welcome to the log!",
      timestamp: Date.now(),
    },
    {
      message: "This is a test message.",
      timestamp: Date.now(),
    },
  ],
}));

export function log(message: string) {
  useLogStore.setState((state) => ({
    logs: [
      ...state.logs,
      {
        message,
        timestamp: Date.now(),
      },
    ],
  }));
}

export default function Logs() {
  const { logs } = useLogStore();

  return (
    <Dialog>
      <DialogTrigger>
        <div className="flex items-center justify-center gap-2 py-2 text-sm text-white duration-100 bg-[#111] border border-white border-opacity-10 rounded-lg cursor-pointer hover:bg-opacity-80">
          Show logs
          <Bug size={16} />
        </div>
      </DialogTrigger>
      <DialogContent className="min-w-[80vw] min-h-[50vh] bg-black">
        <DialogHeader className="text-white">
          <DialogTitle>Logs</DialogTitle>
        </DialogHeader>
        <div className="text-white border-white border border-opacity-10 bg-black h-[50vh] p-2 overflow-y-auto font-mono rounded">
          {logs.map((log, idx) => (
            <div key={`log-${idx}`}>
              <span
                className="text-[#888] text-sm mr-2"
                style={{ minWidth: "100px", display: "inline-block" }}
              >
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              {log.message}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
