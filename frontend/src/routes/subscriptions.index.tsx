import { useMemo, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { TopStrip } from "@/components/TopStrip";
import { StatusBadge } from "@/components/StatusBadge";
import { useSubscriptions, useAddSubscription } from "@/hooks/useSubscriptions";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { inr, shortDate } from "@/lib/format";
import type { PayType, SubStatus } from "@/lib/mock-data";

export const Route = createFileRoute("/subscriptions/")({
  component: SubscriptionsList,
});

const payTabs: { id: "all" | PayType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "credit", label: "Credit" },
  { id: "debit", label: "Debit" },
  { id: "upi", label: "UPI" },
];

function SubscriptionsList() {
  const { data: subs } = useSubscriptions();
  const { data: pms } = usePaymentMethods();
  const [showAdd, setShowAdd] = useState(false);
  const [tab, setTab] = useState<"all" | PayType>("all");
  const [category, setCategory] = useState<string>("all");
  const [status, setStatus] = useState<"all" | SubStatus>("all");

  const categories = useMemo(
    () => Array.from(new Set((subs ?? []).map((s) => s.category))).sort(),
    [subs],
  );

  const rows = (subs ?? []).filter((s) => {
    const pm = pms?.find((p) => p.id === s.paymentMethodId);
    if (tab !== "all" && pm?.type !== tab) return false;
    if (category !== "all" && s.category !== category) return false;
    if (status !== "all" && s.status !== status) return false;
    return true;
  });

  return (
    <>
      <TopStrip 
        title="Subscriptions" 
        actions={
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="h-8 px-4 border border-[#333333] text-xs font-medium text-zinc-300 hover:bg-[#1a1a1a] transition-colors uppercase tracking-widest"
          >
            {showAdd ? "Cancel" : "Add subscription"}
          </button>
        }
      />
      <div className="p-8 overflow-y-auto space-y-6 flex-1 fade-in">
        {showAdd ? <AddSubscriptionForm onClose={() => setShowAdd(false)} /> : null}
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-0.5 p-0.5 border border-[#333333]">
            {payTabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-1.5 text-[10px] uppercase tracking-widest font-medium transition-colors ${
                  tab === t.id
                    ? "bg-accent-cyan text-[#0e0e0f]"
                    : "text-neutral hover:text-zinc-300 hover:bg-[#1a1a1a]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-8 bg-transparent border border-[#333333] text-[10px] uppercase tracking-widest px-3 text-zinc-300 outline-none focus:border-accent-cyan appearance-none"
          >
            <option value="all" className="bg-[#0e0e0f]">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c} className="bg-[#0e0e0f]">{c}</option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="h-8 bg-transparent border border-[#333333] text-[10px] uppercase tracking-widest px-3 text-zinc-300 outline-none focus:border-accent-cyan appearance-none"
          >
            <option value="all" className="bg-[#0e0e0f]">All statuses</option>
            <option value="active" className="bg-[#0e0e0f]">Active</option>
            <option value="paused" className="bg-[#0e0e0f]">Paused</option>
            <option value="cancelled" className="bg-[#0e0e0f]">Cancelled</option>
            <option value="failed" className="bg-[#0e0e0f]">Failed</option>
          </select>

          <span className="text-[10px] text-neutral ml-auto uppercase tracking-widest">{rows.length} items</span>
        </div>

        <div className="panel p-0 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-neutral border-b border-[#333333] bg-[#0e0e0f]">
                <th className="py-4 px-6 font-medium">Service</th>
                <th className="py-4 px-6 font-medium">Category</th>
                <th className="py-4 px-6 font-medium">Method</th>
                <th className="py-4 px-6 font-medium">Next renewal</th>
                <th className="py-4 px-6 font-medium">Status</th>
                <th className="py-4 px-6 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#333333] text-sm bg-transparent">
              {rows.map((s, i) => {
                const pm = pms?.find((p) => p.id === s.paymentMethodId);
                return (
                  <tr key={s.id} className={`hover:bg-[#1a1a1a] transition-colors group relative ${i % 2 === 0 ? "bg-white/[0.01]" : ""}`}>
                    <td className="py-4 px-6 relative">
                      <div className="absolute top-0 left-0 w-1 h-full bg-transparent group-hover:bg-accent-cyan transition-colors" />
                      <Link
                        to="/subscriptions/$id"
                        params={{ id: s.id }}
                        className="text-zinc-100 group-hover:text-accent-cyan font-medium transition-colors"
                      >
                        {s.name}
                      </Link>
                    </td>
                    <td className="py-4 px-6 text-neutral text-xs">{s.category}</td>
                    <td className="py-4 px-6">
                      <span className="text-[10px] uppercase tracking-widest">
                        {pm?.detail ?? "—"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-neutral font-mono text-xs">
                      {shortDate(s.nextRenewal)}
                    </td>
                    <td className="py-4 px-6"><StatusBadge status={s.status} /></td>
                    <td className="py-4 px-6 text-right text-zinc-100 font-mono font-medium">{inr(s.amount)}</td>
                  </tr>
                );
              })}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 circuit-grid text-center text-xs uppercase tracking-widest text-neutral opacity-50">
                    No subscriptions match these filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function AddSubscriptionForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [cycle, setCycle] = useState<"monthly" | "annual">("monthly");
  const [category, setCategory] = useState("Productivity");
  const add = useAddSubscription();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        add.mutate(
          {
            name,
            amount: Number(amount),
            cycle,
            category,
            status: "active",
            nextRenewal: new Date().toISOString(),
          },
          { onSuccess: onClose }
        );
      }}
      className="panel p-6 space-y-6 mb-6 bg-[#1a1a1a]"
    >
      <h3 className="text-xs uppercase tracking-widest text-neutral">New subscription</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <label className="block space-y-2">
          <span className="text-[10px] uppercase tracking-widest text-neutral">Service name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Netflix"
            className="w-full h-10 bg-transparent border border-[#333333] text-xs px-3 text-zinc-200 outline-none focus:border-accent-cyan"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-[10px] uppercase tracking-widest text-neutral">Category</span>
          <input
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Entertainment"
            className="w-full h-10 bg-transparent border border-[#333333] text-xs px-3 text-zinc-200 outline-none focus:border-accent-cyan"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-[10px] uppercase tracking-widest text-neutral">Amount (INR)</span>
          <input
            required
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="499"
            className="w-full h-10 bg-transparent border border-[#333333] text-xs px-3 text-zinc-200 outline-none focus:border-accent-cyan"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-[10px] uppercase tracking-widest text-neutral">Cycle</span>
          <select
            value={cycle}
            onChange={(e) => setCycle(e.target.value as any)}
            className="w-full h-10 bg-transparent border border-[#333333] text-xs px-3 text-zinc-200 outline-none focus:border-accent-cyan appearance-none"
          >
            <option value="monthly" className="bg-[#0e0e0f]">Monthly</option>
            <option value="annual" className="bg-[#0e0e0f]">Annual</option>
          </select>
        </label>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="h-8 px-4 text-[10px] uppercase tracking-widest font-medium text-neutral hover:text-zinc-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={add.isPending}
          className="h-8 px-4 text-[10px] uppercase tracking-widest font-medium bg-accent-cyan text-[#0e0e0f] hover:brightness-110 disabled:opacity-40"
        >
          {add.isPending ? "Saving..." : "Save subscription"}
        </button>
      </div>
    </form>
  );
}