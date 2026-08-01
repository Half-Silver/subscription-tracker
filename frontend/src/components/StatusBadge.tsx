import type { SubStatus } from "@/lib/mock-data";

const config: Record<string, { label: string; dot: string; text: string }> = {
  active: { label: "Active", dot: "bg-emerald-500", text: "text-emerald-300" },
  paused: { label: "Paused", dot: "bg-zinc-500", text: "text-zinc-400" },
  cancelled: { label: "Cancelled", dot: "bg-zinc-700", text: "text-zinc-500" },
  failed: { label: "Failed", dot: "bg-amber-500", text: "text-amber-300" },
  renewing_soon: { label: "Renewing soon", dot: "bg-amber-500 animate-pulse", text: "text-amber-300" },
};

export function StatusBadge({ status }: { status: SubStatus | string }) {
  const c = config[status as string] ?? { label: status, dot: "bg-neutral", text: "text-zinc-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${c.text} capitalize`}>
      <span className={`size-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}