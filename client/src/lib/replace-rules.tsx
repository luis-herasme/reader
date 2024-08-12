import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ArrowRight, Plus, Replace, Trash } from "lucide-react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type GlobalReplaceRuleState = {
  replaceRules: {
    from: string;
    to: string;
  }[];
};

export const useReplaceRuleStore = create(
  persist<GlobalReplaceRuleState>(
    () => ({
      replaceRules: [
        {
          from: "<",
          to: "",
        },
        {
          from: ">",
          to: "",
        },
      ],
    }),
    {
      name: "replace-rules-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default function ReplaceRules() {
  const { replaceRules } = useReplaceRuleStore();

  return (
    <Dialog>
      <DialogTrigger>
        <div className="flex items-center justify-center gap-2 py-2 text-sm text-white duration-100 bg-[#111] border border-white border-opacity-10 rounded-lg cursor-pointer hover:bg-opacity-80">
          Replace rules
          <Replace size={16} />
        </div>
      </DialogTrigger>
      <DialogContent className="">
        <DialogHeader className="text-white">
          <DialogTitle>Replace rules</DialogTitle>
        </DialogHeader>
        <div className="p-4 bg-[#111] text-sm rounded">
          <p>
            Replace rules are used to replace characters or words in the text.
            This can be useful to remove characters that are not needed in the
            audio for example "&lt;" or "&gt;".
          </p>
          <p className="mt-4">
            This is also useful for words, for example to replace "Mr." with
            "Mister".
          </p>
        </div>
        <div className="flex flex-col gap-2 ">
          {replaceRules.map((rule, idx) => (
            <div
              key={`replace-rule-${idx}`}
              className="flex justify-center items-center gap-2"
            >
              <Input
                value={rule.from}
                onChange={(e) => {
                  useReplaceRuleStore.setState((state) => {
                    const newReplaceRule = [...state.replaceRules];
                    newReplaceRule[idx].from = e.target.value;
                    return { replaceRules: newReplaceRule };
                  });
                }}
              />
              <ArrowRight className="w-12 h-12" />
              <Input
                value={rule.to}
                onChange={(e) => {
                  useReplaceRuleStore.setState((state) => {
                    const newReplaceRule = [...state.replaceRules];
                    newReplaceRule[idx].to = e.target.value;
                    return { replaceRules: newReplaceRule };
                  });
                }}
              />
              <Button
                variant="destructive"
                onClick={() => {
                  useReplaceRuleStore.setState((state) => {
                    const newReplaceRule = [...state.replaceRules];
                    newReplaceRule.splice(idx, 1);
                    return { replaceRules: newReplaceRule };
                  });
                }}
              >
                <Trash className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            className="flex items-center justify-center gap-2"
            variant={"secondary"}
            onClick={() => {
              useReplaceRuleStore.setState((state) => {
                return {
                  replaceRules: [
                    ...state.replaceRules,
                    {
                      from: "",
                      to: "",
                    },
                  ],
                };
              });
            }}
          >
            Add new rule <Plus className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
