import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";

export const SETTINGS = "settings";
export const SETTINGS_REPLACEMENT_RULES = "settings-replacement-rules";

export type ReplacementRulesInput = {
  replacementRules: { from: string; to: string }[];
};

export function useSettingsState() {
  return useQuery({
    queryKey: [SETTINGS],
    queryFn: async () => {
      const response = await api.api.settings.$get();
      if (!response.ok) throw new Error("Failed to fetch settings");
      return response.json();
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
      const response = await api.api.settings.$post({ json: value });
      if (!response.ok) throw new Error("Failed to update settings");
      return response.json();
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [SETTINGS] }),
  });
}

export function useReplacementRules() {
  return useQuery({
    queryKey: [SETTINGS_REPLACEMENT_RULES],
    queryFn: async () => {
      const response = await api.api.settings["replacement-rules"].$get();
      if (!response.ok) throw new Error("Failed to fetch replacement rules");
      return response.json();
    },
  });
}

export function useUpdateReplacementRules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ReplacementRulesInput) => {
      const response = await api.api.settings["replacement-rules"].$post({
        json: data,
      });
      if (!response.ok) throw new Error("Failed to update replacement rules");
      return response.json();
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: [SETTINGS_REPLACEMENT_RULES],
      }),
  });
}
