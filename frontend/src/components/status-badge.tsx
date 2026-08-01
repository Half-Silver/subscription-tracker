import { Badge } from "@/components/ui/badge";

type Status = "active" | "trial" | "cancelled" | "paused";

interface StatusBadgeProps {
  status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const labels: Record<Status, string> = {
    active: "Active",
    trial: "Trial",
    cancelled: "Cancelled",
    paused: "Paused",
  };

  const variant: Record<Status, "default" | "secondary" | "outline" | "destructive"> = {
    active: "default",
    trial: "secondary",
    cancelled: "outline",
    paused: "secondary",
  };

  return <Badge variant={variant[status]}>{labels[status]}</Badge>;
}
