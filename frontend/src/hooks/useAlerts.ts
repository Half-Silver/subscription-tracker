import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { mockAlerts, type Alert } from "@/lib/mock-data";

export function useAlerts() {
  return useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      return await apiFetch<Alert[]>("/alerts");
    },
  });
}