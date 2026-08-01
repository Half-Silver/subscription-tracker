import { format, parseISO, isPast, isToday } from "date-fns";
import { Calendar, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type Subscription } from "@/lib/subscriptions";
import { cn } from "@/lib/utils";

interface RenewalTimelineProps {
  subscriptions: Subscription[];
  limit?: number;
}

export function RenewalTimeline({ subscriptions, limit = 5 }: RenewalTimelineProps) {
  const today = new Date("2026-08-01");
  const upcoming = subscriptions
    .filter((s) => s.status === "active" || s.status === "trial")
    .sort((a, b) => new Date(a.nextRenewal).getTime() - new Date(b.nextRenewal).getTime())
    .slice(0, limit);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Upcoming renewals</CardTitle>
        <CardDescription>Next payment dates for active subscriptions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming renewals.</p>
        ) : (
          upcoming.map((sub) => {
            const renewal = parseISO(sub.nextRenewal);
            const isDue = isPast(renewal) || isToday(renewal);
            const daysLeft = Math.ceil((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            return (
              <div key={sub.id} className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", isDue ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{sub.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(renewal, "MMMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    ${sub.cost}
                    <span className="text-xs font-normal text-muted-foreground">/{sub.billingCycle === "annual" ? "yr" : "mo"}</span>
                  </p>
                  <Badge variant={isDue ? "default" : "outline"} className="mt-1">
                    {isDue ? "Due" : `${daysLeft}d left`}
                  </Badge>
                </div>
              </div>
            );
          })
        )}
        <Link
          to="/subscriptions"
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          View all subscriptions
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}
