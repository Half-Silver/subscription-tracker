import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { mockPaymentMethods, type PaymentMethod } from "@/lib/mock-data";

export function usePaymentMethods() {
  return useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      return await apiFetch<PaymentMethod[]>("/payment-methods");
    },
  });
}

export function useAddPaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<PaymentMethod>) => {
      return await apiFetch<PaymentMethod>("/payment-methods", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (newPm) => {
      qc.setQueryData<PaymentMethod[]>(["payment-methods"], (prev) =>
        prev ? [...prev, newPm] : [newPm]
      );
    },
  });
}