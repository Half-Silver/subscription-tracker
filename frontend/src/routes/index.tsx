import { createFileRoute } from "@tanstack/react-router";
import { TopStrip } from "@/components/TopStrip";
import { RenewalsTable } from "@/components/RenewalsTable";
import { AlertsFeed } from "@/components/AlertsFeed";
import { SummaryTiles } from "@/components/SummaryTiles";
import { SpendTrendChart } from "@/components/SpendTrendChart";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useSync } from "@/hooks/useAccounts";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const sync = useSync();
  const { data: subscriptions } = useSubscriptions();

  return (
    <>
      <TopStrip onRefresh={() => sync.mutate()} isRefreshing={sync.isPending} />
      <div className="px-8 pb-8 pt-6 overflow-y-auto space-y-6 flex-1 fade-in">
        <SummaryTiles />
        <SpendTrendChart subscriptions={subscriptions ?? []} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RenewalsTable days={7} />
          <AlertsFeed />
        </div>
      </div>
    </>
  );
}
