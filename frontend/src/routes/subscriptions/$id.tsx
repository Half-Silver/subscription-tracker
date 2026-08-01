import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ArrowLeft, Mail, Calendar, CreditCard, Sparkles, Tag, Edit, Trash2, Clock } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/status-badge";
import { CategoryBadge } from "@/components/category-badge";
import { getSubscriptionById } from "@/lib/subscriptions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/subscriptions/$id")({
  head: () => {
    const title = "Subscription details — Mayday";
    return {
      meta: [
        { title },
        { name: "description", content: "View subscription details, detected source, and renewal information." },
        { property: "og:title", content: title },
        { property: "og:description", content: "View subscription details, detected source, and renewal information." },
      ],
    };
  },
  loader: async ({ context, params }) => {
    return context.queryClient.ensureQueryData({
      queryKey: ["subscription", params.id],
      queryFn: () => getSubscriptionById(params.id),
    });
  },
  component: SubscriptionDetailPage,
});

function SubscriptionDetailPage() {
  const { id } = Route.useParams();
  const { data: subscription } = useSuspenseQuery({
    queryKey: ["subscription", id],
    queryFn: () => getSubscriptionById(id),
  });

  if (!subscription) {
    throw notFound();
  }

  const renewal = parseISO(subscription.nextRenewal);
  const isOverdue = renewal < new Date("2026-08-01");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="pl-0">
        <Link to="/subscriptions" className="flex items-center gap-1 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to subscriptions
        </Link>
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-2xl font-bold text-primary">
            {subscription.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{subscription.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <CategoryBadge category={subscription.category} />
              <StatusBadge status={subscription.status} />
              <Badge variant="outline" className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {subscription.confidence}% AI confidence
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              Subscription details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Cost</p>
                <p className="text-2xl font-bold tracking-tight">
                  ${subscription.cost}
                  <span className="text-base font-normal text-muted-foreground">/{subscription.billingCycle === "annual" ? "year" : "month"}</span>
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Next renewal</p>
                <p className={cn("text-lg font-semibold", isOverdue ? "text-destructive" : "text-foreground")}>
                  {format(renewal, "MMMM d, yyyy")}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Payment method</p>
                <div className="flex items-center gap-2 text-foreground">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  {subscription.paymentMethod}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Status</p>
                <StatusBadge status={subscription.status} />
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="text-sm leading-relaxed text-foreground">
                {subscription.notes || "No notes added yet."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Detected from
            </CardTitle>
            <CardDescription>Source email used to identify this subscription</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Sender</p>
              <p className="text-sm font-medium">{subscription.detectedFrom.sender}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Subject</p>
              <p className="text-sm font-medium">{subscription.detectedFrom.subject}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Detected on</p>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {format(parseISO(subscription.detectedFrom.date), "MMMM d, yyyy")}
              </div>
            </div>
            <Separator />
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">AI confidence</p>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${subscription.confidence}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{subscription.confidence}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Activity timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Subscription detected by AI</p>
                <p className="text-xs text-muted-foreground">{format(parseISO(subscription.createdAt), "MMMM d, yyyy")}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Latest email from {subscription.detectedFrom.sender}</p>
                <p className="text-xs text-muted-foreground">{format(parseISO(subscription.detectedFrom.date), "MMMM d, yyyy")}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Next renewal scheduled</p>
                <p className="text-xs text-muted-foreground">{format(renewal, "MMMM d, yyyy")}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
