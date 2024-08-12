import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { trpc } from "@/trpc";
import { ArrowRight, Plus, Replace, Trash } from "lucide-react";
import { useState } from "react";

export default function ReplaceRules() {
  const utils = trpc.useUtils();
  const { data } = trpc.settings.replacementRules.useQuery();
  const [replacementRules, setReplacementRules] = useState(data);
  const updateReplacementRules =
    trpc.settings.updateReplacementRules.useMutation({
      onSuccess: () => utils.settings.replacementRules.invalidate(),
    });

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
          {replacementRules &&
            replacementRules.map((rule) => (
              <div
                key={`replace-rule-${rule.id}`}
                className="flex justify-center items-center gap-2"
              >
                <Input
                  value={rule.from}
                  onChange={(e) => {
                    if (replacementRules) {
                      setReplacementRules(
                        replacementRules.map((rule) => {
                          if (rule.id === rule.id) {
                            return { ...rule, from: e.target.value };
                          }
                          return rule;
                        })
                      );
                    }
                  }}
                />
                <ArrowRight className="w-12 h-12" />
                <Input
                  value={rule.to}
                  onChange={(e) => {
                    if (replacementRules) {
                      setReplacementRules(
                        replacementRules.map((rule) => {
                          if (rule.id === rule.id) {
                            return { ...rule, to: e.target.value };
                          }
                          return rule;
                        })
                      );
                    }
                  }}
                />
                <Button
                  variant="destructive"
                  onClick={() => {
                    updateReplacementRules.mutate({
                      replacementRules: replacementRules.filter(
                        (rule) => rule.id !== rule.id
                      ),
                    });
                  }}
                >
                  <Trash className="w-4 h-4" />
                </Button>
              </div>
            ))}
          <Button
            className="flex items-center justify-center gap-2 mt-2"
            variant={"secondary"}
            onClick={() => {
              updateReplacementRules.mutate({
                replacementRules: [
                  ...(replacementRules || []),
                  { from: "", to: "" },
                ],
              });
            }}
          >
            Add new rule <Plus className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => {
              updateReplacementRules.mutate({
                replacementRules: replacementRules || [],
              });
            }}
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
