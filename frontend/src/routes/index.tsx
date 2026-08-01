import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { DollarSign, Calendar, CreditCard, Sparkles, Plus, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import { SpendChart } from "@/components/spend-chart";
import { RenewalTimeline } from "@/components/renewal-timeline";
import { getSubscriptions, getStats } from "@/lib/subscriptions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Mayday" },
      { name: "description", content: "Overview of your subscriptions, monthly spend, and upcoming renewals." },
      { property: "og:title", content: "Dashboard — Mayday" },
      { property: "og:description", content: "Overview of your subscriptions, monthly spend, and upcoming renewals." },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["stats"],
      queryFn: getStats,
    });
    await context.queryClient.ensureQueryData({
      queryKey: ["subscriptions"],
      queryFn: getSubscriptions,
    });
  },
  component: DashboardPage,
});

function DashboardPage() {
  const statsQuery = useSuspenseQuery({
    queryKey: ["stats"],
    queryFn: getStats,
  });

  const subscriptionsQuery = useSuspenseQuery({
    queryKey: ["subscriptions"],
    queryFn: getSubscriptions,
  });

  const stats = statsQuery.data;
  const subscriptions = subscriptionsQuery.data;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back — here&apos;s your subscription overview.</p>
        </div>
        <Button asChild>
          <Link to="/subscriptions">
            <Plus className="mr-2 h-4 w-4" />
            Add subscription
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Monthly spend"
          value={`$${stats.totalMonthly}`}
          trend="up"
          trendValue="4.2%"
          description="vs last month"
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatCard
          title="Annual spend"
          value={`$${stats.totalAnnual}`}
          description="Across active subscriptions"
          icon={<CreditCard className="h-4 w-4" />}
        />
        <StatCard
          title="Active subscriptions"
          value={stats.activeCount.toString()}
          description={`${stats.trialCount} in trial`}
          icon={<Sparkles className="h-4 w-4" />}
        />
        <StatCard
          title="Upcoming renewals"
          value={stats.upcomingRenewals.toString()}
          description="In the next 30 days"
          icon={<Calendar className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SpendChart data={stats.monthlySpend} />
        </div>
        <div>
          <RenewalTimeline subscriptions={subscriptions} />
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent subscriptions</CardTitle>
            <CardDescription>Last detected and updated subscriptions</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/subscriptions" className="flex items-center gap-1">
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subscriptions.slice(0, 4).map((sub) => (
              <div key={sub.id} className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-sm font-bold text-primary">
                    {sub.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{sub.name}</p>
                    <p className="text-xs text-muted-foreground">{sub.category} · {sub.status}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold whitespace-nowrap">${sub.cost}/{sub.billingCycle === "annual" ? "yr" : "mo"}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
