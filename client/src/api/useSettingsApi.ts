import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import { SETTINGS, SETTINGS_REPLACEMENT_RULES } from "./queryKeys";
import type { ReplacementRulesInput } from "./queryKeys";

export function useSettingsState() {
  return useQuery({
    queryKey: [SETTINGS],
    queryFn: async () => {
      const res = await api.api.settings.$get();
      return res.json();
    },
  });
}

type SettingsUpdateInput = {
  autoAdvance?: boolean;
  font?: "serif" | "sans_serif" | "monospace";
  fontSize?: number;
  speed?: number;
};

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (value: SettingsUpdateInput) => {
      const res = await api.api.settings.$post({ json: value });
      return res.json();
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [SETTINGS] }),
  });
}

export function useReplacementRules() {
  return useQuery({
    queryKey: [SETTINGS_REPLACEMENT_RULES],
    queryFn: async () => {
      const res = await api.api.settings["replacement-rules"].$get();
      return res.json();
    },
  });
}

export function useUpdateReplacementRules() {
  const queryClient = useQueryClient();

  return useMutation({
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
}
