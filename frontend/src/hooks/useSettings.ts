import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { mockSettings, type Settings } from "@/lib/mock-data";

const KEY = ["settings"] as const;

export function useSettings() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      return await apiFetch<Settings>("/settings");
    },
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: Settings) => {
      try {
        return await apiFetch<Settings>("/settings", { method: "PUT", body: JSON.stringify(s) });
      } catch {
        return s;
      }
    },
    onSuccess: (s) => qc.setQueryData(KEY, s),
  });
}

export function useExportDatabase() {
  return useMutation({
    mutationFn: async () => {
      return await apiFetch<{ success: boolean; path: string }>("/settings/export", { method: "POST" });
    },
  });
}