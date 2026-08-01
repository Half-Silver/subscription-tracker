import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { TopStrip } from "@/components/TopStrip";
import { StatusBadge } from "@/components/StatusBadge";
import { useSubscription, useUpdateSubscription } from "@/hooks/useSubscriptions";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useAccounts } from "@/hooks/useAccounts";
import { inr, shortDate } from "@/lib/format";
import type { Subscription } from "@/lib/mock-data";

export const Route = createFileRoute("/subscriptions/$id")({
  component: SubscriptionDetail,
  head: ({ params }) => ({
    meta: [
      { title: `Subscription ${params.id} — MAYDAY` },
      { name: "description", content: "Subscription detail with renewal history and linked payment method." },
    ],
  }),
});

function SubscriptionDetail() {
  const { id } = Route.useParams();
  const sub = useSubscription(id);
  const { data: pms } = usePaymentMethods();
  const { data: accounts } = useAccounts();
  const update = useUpdateSubscription();

  if (!sub) {
    return (
      <>
        <TopStrip />
        <div className="p-8">
          <p className="text-[10px] uppercase tracking-widest text-neutral">
            Subscription not found.{" "}
            <Link to="/subscriptions" className="text-zinc-200 underline">Back to list</Link>
          </p>
        </div>
      </>
    );
  }

  const pm = pms?.find((p) => p.id === sub.paymentMethodId);
  const acc = accounts?.find((a) => a.id === sub.accountId);

  const commit = (patch: Partial<Subscription>) => update.mutate({ ...sub, ...patch });
  const categories = ["Productivity", "Infrastructure", "Entertainment", "Design", "Security"];

  return (
    <>
      <TopStrip />
      <div className="p-8 overflow-y-auto space-y-8 flex-1 fade-in">
        <Link to="/subscriptions" className="text-[10px] uppercase tracking-widest text-neutral hover:text-accent-cyan transition-colors">
          ← All subscriptions
        </Link>

        <div className="flex items-start justify-between border-b border-[#333333] pb-6">
          <div>
            <h1 className="text-2xl font-medium text-zinc-100 tracking-tight">{sub.name}</h1>
            <div className="flex items-center gap-4 mt-3">
              <EditablePill
                value={sub.category}
                options={categories}
                onChange={(v) => commit({ category: v })}
              />
              <span className="text-[#333333]">—</span>
              <StatusBadge status={sub.status} />
            </div>
          </div>
          <div className="text-right">
            <EditableAmount amount={sub.amount} onCommit={(v) => commit({ amount: v })} />
            <button
              onClick={() =>
                commit({ cycle: sub.cycle === "monthly" ? "annual" : "monthly" })
              }
              className="text-[10px] block w-full text-right uppercase tracking-widest text-neutral hover:text-accent-cyan mt-2 transition-colors"
            >
              per {sub.cycle === "monthly" ? "month" : "year"} ↺
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-[#333333]">
          <Field label="Next renewal" value={shortDate(sub.nextRenewal)} className="border-b md:border-b-0 md:border-r border-[#333333]" />
          <div className="p-6 border-b md:border-b-0 md:border-r border-[#333333] hover:bg-[#1a1a1a] transition-colors group">
            <p className="text-[10px] uppercase tracking-widest text-neutral mb-2">
              Payment method
            </p>
            <select
              value={sub.paymentMethodId}
              onChange={(e) => commit({ paymentMethodId: e.target.value })}
              className="w-full bg-transparent text-sm text-zinc-100 font-mono outline-none focus:text-accent-cyan appearance-none cursor-pointer group-hover:text-accent-cyan transition-colors"
            >
              {(pms ?? []).map((p) => (
                <option key={p.id} value={p.id} className="bg-[#0e0e0f]">
                  {p.detail}
                </option>
              ))}
            </select>
          </div>
          <Field label="Source account" value={acc?.email ?? "—"} className="hover:bg-[#1a1a1a]" />
        </div>

        <div className="space-y-4">
          <h2 className="text-[10px] uppercase tracking-widest text-neutral">Renewal history</h2>
          <div className="panel p-0 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-neutral border-b border-[#333333] bg-[#0e0e0f]">
                  <th className="py-4 px-6 font-medium">Date</th>
                  <th className="py-4 px-6 font-medium">Event</th>
                  <th className="py-4 px-6 font-medium">Note</th>
                  <th className="py-4 px-6 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333333] text-sm bg-transparent">
                {sub.history.map((h, i) => (
                  <tr key={h.id} className={`hover:bg-[#1a1a1a] transition-colors ${i % 2 === 0 ? "bg-white/[0.01]" : ""}`}>
                    <td className="py-4 px-6 text-neutral font-mono text-xs">{shortDate(h.date)}</td>
                    <td
                      className={`py-4 px-6 text-[10px] uppercase tracking-widest ${
                        h.kind === "price_changed"
                          ? "text-accent-amber"
                          : h.kind === "failed"
                            ? "text-status-danger"
                            : "text-status-success"
                      }`}
                    >
                      {h.kind.replace("_", " ")}
                    </td>
                    <td className="py-4 px-6 text-neutral text-xs">{h.note ?? "—"}</td>
                    <td className="py-4 px-6 text-right text-zinc-100 font-mono font-medium">{inr(h.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

function Field({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`p-6 transition-colors ${className}`}>
      <p className="text-[10px] uppercase tracking-widest text-neutral mb-2">{label}</p>
      <p className="text-sm text-zinc-100 font-mono">{value}</p>
    </div>
  );
}

function EditableAmount({
  amount,
  onCommit,
}: {
  amount: number;
  onCommit: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(amount));
  if (!editing) {
    return (
      <button
        onClick={() => {
          setDraft(String(amount));
          setEditing(true);
        }}
        className="text-3xl font-mono text-accent-cyan hover:brightness-125 transition-all"
      >
        {inr(amount)}
      </button>
    );
  }
  return (
    <input
      autoFocus
      type="number"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const v = Number(draft);
        if (!Number.isNaN(v) && v !== amount) onCommit(v);
        setEditing(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") setEditing(false);
      }}
      className="text-3xl font-mono text-accent-cyan bg-transparent border-b border-accent-cyan/40 w-40 text-right outline-none"
    />
  );
}

function EditablePill({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-transparent text-[10px] uppercase tracking-widest text-neutral hover:text-accent-cyan outline-none cursor-pointer appearance-none transition-colors"
    >
      {options.map((o) => (
        <option key={o} value={o} className="bg-[#0e0e0f] text-zinc-200">
          {o}
        </option>
      ))}
    </select>
  );
}