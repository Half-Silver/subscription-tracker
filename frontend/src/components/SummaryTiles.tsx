import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useHydrated } from "@/hooks/useHydrated";
import { inr } from "@/lib/format";

export function SummaryTiles() {
  const { data: subs } = useSubscriptions();
  const hydrated = useHydrated();
  const active = (subs ?? []).filter((s) => s.status === "active");
  const monthly = active.reduce(
    (sum, s) => sum + (s.cycle === "monthly" ? s.amount : s.amount / 12),
    0,
  );
  const annual = monthly * 12;
  const renewingSoon = hydrated
    ? active.filter(
        (s) => new Date(s.nextRenewal).getTime() <= Date.now() + 7 * 86_400_000,
      ).length
    : 0;

  const tiles = [
    { label: "Monthly spend", icon: "▪", value: inr(monthly) },
    { label: "Annual spend", icon: "▫", value: inr(annual) },
    { label: "Active subscriptions", icon: "◈", value: String(active.length) },
    { label: "Renewing in 7 days", icon: "◉", value: hydrated ? String(renewingSoon) : "—", highlight: renewingSoon > 0 },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 fade-in">
      {tiles.map((t) => (
        <div
          key={t.label}
          className={`panel p-4 flex flex-col gap-3 group relative overflow-hidden ${t.highlight ? "border-accent-cyan/50 animate-[pulse-glow_2s_infinite]" : ""}`}
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-neutral/20 bg-gradient-to-b from-transparent to-neutral/40 group-hover:from-transparent group-hover:to-accent-cyan transition-all" />
          <span className="text-xs text-neutral tracking-widest pl-2 uppercase flex items-center gap-1.5">
            <span className="text-[10px] text-accent-cyan/70 font-mono">{t.icon}</span>
            {t.label}
          </span>
          <span className={`text-2xl font-medium pl-2 ${t.highlight ? "text-accent-amber" : "text-zinc-100"}`}>
            {t.value}
          </span>
        </div>
      ))}
    </div>
  );
}