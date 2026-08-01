import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, LayoutGrid, List, Filter, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubscriptionTable } from "@/components/subscription-table";
import { SubscriptionCard } from "@/components/subscription-card";
import { CategoryBadge } from "@/components/category-badge";
import { getSubscriptions, categories } from "@/lib/subscriptions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/subscriptions/")({
  head: () => ({
    meta: [
      { title: "Subscriptions — Mayday" },
      { name: "description", content: "View and manage all your tracked subscriptions." },
      { property: "og:title", content: "Subscriptions — Mayday" },
      { property: "og:description", content: "View and manage all your tracked subscriptions." },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["subscriptions"],
      queryFn: getSubscriptions,
    });
  },
  component: SubscriptionsPage,
});

function SubscriptionsPage() {
  const { data: subscriptions } = useSuspenseQuery({
    queryKey: ["subscriptions"],
    queryFn: getSubscriptions,
  });

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("list");

  const filtered = subscriptions.filter((sub) => {
    const matchesSearch =
      sub.name.toLowerCase().includes(search.toLowerCase()) ||
      sub.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category ? sub.category === category : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-sm text-muted-foreground">
            {subscriptions.length} tracked subscriptions · {filtered.length} shown
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add subscription
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-3">
          <Tabs value={view} onValueChange={(v) => setView(v as "grid" | "list")} className="hidden sm:block">
            <TabsList className="h-9">
              <TabsTrigger value="list" className="px-3">
                <List className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="grid" className="px-3">
                <LayoutGrid className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setCategory(null)}
          className={cn(
            "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
            category === null ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80",
          )}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
              category === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {view === "list" ? (
        <SubscriptionTable subscriptions={filtered} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((sub) => (
            <SubscriptionCard key={sub.id} subscription={sub} />
          ))}
        </div>
      )}
    </div>
  );
}
