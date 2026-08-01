import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TopStrip } from "@/components/TopStrip";
import { usePaymentMethods, useAddPaymentMethod } from "@/hooks/usePaymentMethods";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/payment-methods")({
  head: () => ({
    meta: [
      { title: "Payment methods — MAYDAY" },
      { name: "description", content: "Manage payment methods and see which subscriptions use each one." },
    ],
  }),
  component: PaymentMethodsPage,
});

const typeLabel: Record<string, string> = {
  credit: "Credit card",
  debit: "Debit card",
  upi: "UPI",
};

function PaymentMethodsPage() {
  const { data: pms } = usePaymentMethods();
  const { data: subs } = useSubscriptions();
  const [showAdd, setShowAdd] = useState(false);

  return (
    <>
      <TopStrip 
        title="Payment methods" 
        actions={
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="h-8 px-4 border border-[#333333] text-xs font-medium text-zinc-300 hover:bg-[#1a1a1a] transition-colors uppercase tracking-widest"
          >
            {showAdd ? "Cancel" : "Add method"}
          </button>
        }
      />
      <div className="p-8 overflow-y-auto space-y-4 flex-1 fade-in">
        {showAdd ? <AddPaymentMethodForm onClose={() => setShowAdd(false)} /> : null}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(pms ?? []).map((pm) => {
            const linked = (subs ?? []).filter((s) => s.paymentMethodId === pm.id);
            const monthlyLoad = linked
              .filter((s) => s.status === "active")
              .reduce((sum, s) => sum + (s.cycle === "monthly" ? s.amount : s.amount / 12), 0);
            return (
              <div key={pm.id} className="panel p-6 flex flex-col hover:bg-[#1a1a1a] transition-colors group relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-neutral/20 group-hover:bg-accent-cyan transition-colors" />
                <div className="flex items-start justify-between pl-2">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] uppercase tracking-widest text-neutral font-medium">
                        {typeLabel[pm.type]}
                      </span>
                      <h2 className="text-sm text-zinc-100 font-medium">{pm.label}</h2>
                    </div>
                    <p className="text-xs text-neutral mt-2">{pm.detail}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-neutral">Monthly load</p>
                    <p className="text-lg font-mono text-zinc-100 mt-1">{inr(monthlyLoad)}</p>
                  </div>
                </div>
                {linked.length > 0 ? (
                  <div className="mt-4 pt-4 border-t border-[#333333] pl-2">
                    <p className="text-[10px] uppercase tracking-widest text-neutral mb-3">
                      {linked.length} linked subscription{linked.length === 1 ? "" : "s"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {linked.map((s) => (
                        <span
                          key={s.id}
                          className="text-[10px] px-2 py-1 bg-[#1a1a1a] border border-[#333333] text-zinc-300 uppercase tracking-widest"
                        >
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function AddPaymentMethodForm({ onClose }: { onClose: () => void }) {
  const [label, setLabel] = useState("");
  const [type, setType] = useState<"credit" | "debit" | "upi">("credit");
  const [detail, setDetail] = useState("");
  const add = useAddPaymentMethod();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        add.mutate({ label, type, detail }, {
          onSuccess: onClose,
        });
      }}
      className="panel p-6 space-y-6 bg-[#1a1a1a]"
    >
      <h3 className="text-xs uppercase tracking-widest text-neutral">New payment method</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="block space-y-2">
          <span className="text-[10px] uppercase tracking-widest text-neutral">Label</span>
          <input
            required
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Chase Sapphire"
            className="w-full h-10 bg-transparent border border-[#333333] text-xs px-3 text-zinc-200 outline-none focus:border-accent-cyan"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-[10px] uppercase tracking-widest text-neutral">Type</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="w-full h-10 bg-transparent border border-[#333333] text-xs px-3 text-zinc-200 outline-none focus:border-accent-cyan appearance-none"
          >
            <option value="credit" className="bg-[#0e0e0f]">Credit card</option>
            <option value="debit" className="bg-[#0e0e0f]">Debit card</option>
            <option value="upi" className="bg-[#0e0e0f]">UPI</option>
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-[10px] uppercase tracking-widest text-neutral">Detail / Last 4</span>
          <input
            required
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="VISA • 1234"
            className="w-full h-10 bg-transparent border border-[#333333] text-xs px-3 text-zinc-200 outline-none focus:border-accent-cyan"
          />
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
          {add.isPending ? "Saving..." : "Save method"}
        </button>
      </div>
    </form>
  );
}