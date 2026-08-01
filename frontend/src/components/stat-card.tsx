import { TrendingUp, TrendingDown, Minus } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  description?: string;
  trend?: "up" | "down" | "flat";
  trendValue?: string;
  icon?: React.ReactNode;
}

export function StatCard({ title, value, description, trend, trendValue, icon }: StatCardProps) {
  const TrendIcon = {
    up: TrendingUp,
    down: TrendingDown,
    flat: Minus,
  }[trend ?? "flat"];

  const trendColor = {
    up: "text-emerald-600",
    down: "text-rose-600",
    flat: "text-muted-foreground",
  }[trend ?? "flat"];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {(description || trend) && (
          <div className="mt-1 flex items-center gap-1 text-xs">
            {trend && (
              <span className={cn("flex items-center gap-0.5 font-medium", trendColor)}>
                <TrendIcon className="h-3.5 w-3.5" />
                {trendValue}
              </span>
            )}
            {description && <span className="text-muted-foreground">{description}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
