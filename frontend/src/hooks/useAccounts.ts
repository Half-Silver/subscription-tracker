import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { mockAccounts, type GmailAccount } from "@/lib/mock-data";

const KEY = ["accounts"] as const;

export function useAccounts() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      return await apiFetch<GmailAccount[]>("/accounts");
    },
  });
}

export function useBackfillAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        return await apiFetch<GmailAccount>(`/accounts/${id}/backfill`, { method: "POST" });
      } catch {
        const now = new Date().toISOString();
        return { id, lastSynced: now } as Partial<GmailAccount> as GmailAccount;
      }
    },
    onSuccess: (res) => {
      qc.setQueryData<GmailAccount[]>(KEY, (prev) =>
        prev
          ? prev.map((a) =>
              a.id === res.id ? { ...a, lastSynced: res.lastSynced, status: "connected" } : a,
            )
          : prev,
      );
    },
  });
}

export function useConnectAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { email: string; password: string; imapHost: string; imapPort: number; smtpHost: string; smtpPort: number }) => {
      return await apiFetch<{ success: boolean; account: { id: string; email: string } }>("/accounts/connect", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

export function useSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      return await apiFetch("/sync", { method: "POST" });
    },
    onSuccess: () => {
      qc.invalidateQueries();
    }
  });
}