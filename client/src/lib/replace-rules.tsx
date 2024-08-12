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
import { useEffect, useState } from "react";

export default function ReplaceRules() {
  const utils = trpc.useUtils();
  const { data } = trpc.settings.replacementRules.useQuery();
  const [replacementRules, setReplacementRules] = useState(data);
  useEffect(() => setReplacementRules(data), [data]);

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
                    setReplacementRules((replacementRules) => {
                      return replacementRules?.map((r) => {
                        if (r.id === rule.id) {
                          return { ...r, from: e.target.value };
                        }
                        return r;
                      });
                    });
                  }}
                />
                <ArrowRight className="w-12 h-12" />
                <Input
                  value={rule.to}
                  onChange={(e) => {
                    setReplacementRules((replacementRules) => {
                      return replacementRules?.map((r) => {
                        if (r.id === rule.id) {
                          return { ...r, to: e.target.value };
                        }
                        return r;
                      });
                    });
                  }}
                />
                <Button
                  variant="destructive"
                  onClick={() => {
                    setReplacementRules((replacementRules) => {
                      return replacementRules?.filter((r) => r.id !== rule.id);
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
          {replacementRules && (
            <Button
              disabled={
                updateReplacementRules.isPending ||
                JSON.stringify(replacementRules) === JSON.stringify(data)
              }
              onClick={() =>
                updateReplacementRules.mutate({ replacementRules })
              }
            >
              Save
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
