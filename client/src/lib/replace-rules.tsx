import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { SETTINGS_REPLACEMENT_RULES, type ReplacementRulesInput } from "@/api/queryKeys";
import { ArrowRight, Plus, Replace, Trash } from "lucide-react";
import { useEffect, useState } from "react";

type ReplaceRule = {
  from: string;
  to: string;
  id: string;
};

export default function ReplaceRules() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: [SETTINGS_REPLACEMENT_RULES],
    queryFn: async () => {
      const res = await api.api.settings["replacement-rules"].$get();
      return res.json();
    },
  });
  const [rules, setRules] = useState<ReplaceRule[] | undefined>(data);
  useEffect(() => setRules(data), [data]);

  const updateReplacementRules = useMutation({
    mutationFn: async (data: ReplacementRulesInput) => {
      const res = await api.api.settings["replacement-rules"].$post({
        json: data,
      });
      return res.json();
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: [SETTINGS_REPLACEMENT_RULES],
      }),
  });

  const [open, setOpen] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        setOpen(open);

        if (
          !open &&
          JSON.stringify(data) !== JSON.stringify(rules) &&
          rules !== undefined
        ) {
          updateReplacementRules.mutate({
            replacementRules: rules,
          });
        }
      }}
    >
      <DialogTrigger>
        <div className="flex items-center justify-center gap-2 py-2 text-sm text-white duration-100 bg-[#111] border border-white border-opacity-10 rounded-lg cursor-pointer hover:bg-opacity-80">
          Replace rules
          <Replace size={16} />
        </div>
      </DialogTrigger>
      <DialogContent>
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
          {rules &&
            rules.map((rule) => (
              <div
                key={`replace-rule-${rule.id}`}
                className="flex justify-center items-center gap-2"
              >
                <Input
                  value={rule.from}
                  onChange={(e) => {
                    setRules((replacementRules) => {
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
                    setRules((replacementRules) => {
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
                    setRules((replacementRules) => {
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
              setRules((replacementRules) => {
                return [
                  ...(replacementRules || []),
                  { id: String(Math.random()), from: "", to: "" },
                ];
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
