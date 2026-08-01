import { Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { Mail, CreditCard, Sparkles, ArrowRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { CategoryBadge } from "@/components/category-badge";
import { type Subscription } from "@/lib/subscriptions";
import { cn } from "@/lib/utils";

interface SubscriptionCardProps {
  subscription: Subscription;
}

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const renewal = parseISO(subscription.nextRenewal);
  const isOverdue = renewal < new Date("2026-08-01");

  return (
    <Card className="hover:border-primary/20 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-bold text-primary">
              {subscription.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <CardTitle className="text-base">{subscription.name}</CardTitle>
              <CardDescription className="text-xs">{subscription.billingCycle}</CardDescription>
            </div>
          </div>
          <StatusBadge status={subscription.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold tracking-tight">
              ${subscription.cost}
              <span className="text-sm font-normal text-muted-foreground">/{subscription.billingCycle === "annual" ? "yr" : "mo"}</span>
            </p>
            <p className={cn("text-xs", isOverdue ? "text-destructive font-medium" : "text-muted-foreground")}>
              Next renewal: {format(renewal, "MMM d, yyyy")}
            </p>
          </div>
          <CategoryBadge category={subscription.category} />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Mail className="h-3.5 w-3.5" />
          <span className="truncate">Detected from {subscription.detectedFrom.sender}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          <span>AI confidence: {subscription.confidence}%</span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CreditCard className="h-3.5 w-3.5" />
            {subscription.paymentMethod}
          </div>
          <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
            <Link to="/subscriptions/$id" params={{ id: subscription.id }}>
              Details
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
