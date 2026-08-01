import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { mockSubscriptions, type Subscription } from "@/lib/mock-data";

const KEY = ["subscriptions"] as const;

export function useSubscriptions() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      return await apiFetch<Subscription[]>("/subscriptions");
    },
  });
}

export function useSubscription(id: string) {
  const { data } = useSubscriptions();
  return data?.find((s) => s.id === id);
}

export function useUpdateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updated: Subscription) => {
      try {
        return await apiFetch<Subscription>(`/subscriptions/${updated.id}`, {
          method: "PATCH",
          body: JSON.stringify(updated),
        });
      } catch {
        return updated;
      }
    },
    onSuccess: (updated) => {
      qc.setQueryData<Subscription[]>(KEY, (prev) =>
        prev ? prev.map((s) => (s.id === updated.id ? updated : s)) : prev,
      );
    },
  });
}

export function useAddSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Subscription>) => {
      return await apiFetch<Subscription>("/subscriptions", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (newSub) => {
      qc.setQueryData<Subscription[]>(KEY, (prev) =>
        prev ? [newSub, ...prev] : [newSub]
      );
    },
  });
}