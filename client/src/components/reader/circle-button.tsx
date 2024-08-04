import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function CircleButton({
  children,
  onClick,
  tooltip,
}: {
  children: React.ReactNode;
  onClick: () => void;
  tooltip: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div
            onClick={onClick}
            className="hover:bg-[#333] flex items-center justify-center gap-4 px-4 py-4 text-white duration-300 bg-black bg-opacity-50 border border-white rounded-full cursor-pointer select-none border-opacity-10 backdrop-blur"
          >
            {children}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
