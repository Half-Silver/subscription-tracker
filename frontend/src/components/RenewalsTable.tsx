import { Link } from "@tanstack/react-router";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useHydrated } from "@/hooks/useHydrated";
import { inr } from "@/lib/format";

function relativeDay(iso: string): string {
  const diff = Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `In ${diff} days`;
}

export function RenewalsTable({ days = 7 }: { days?: number }) {
  const { data: subs } = useSubscriptions();
  const { data: pms } = usePaymentMethods();
  const hydrated = useHydrated();

  const rows = hydrated
    ? (subs ?? [])
        .filter(
          (s) =>
            s.status === "active" &&
            new Date(s.nextRenewal).getTime() <= Date.now() + days * 86_400_000,
        )
        .sort((a, b) => new Date(a.nextRenewal).getTime() - new Date(b.nextRenewal).getTime())
    : [];

  return (
    <div className="panel p-0 h-full flex flex-col">
      <div className="flex justify-between items-center p-4 border-b border-[#333333]">
        <h3 className="text-xs uppercase tracking-widest text-neutral">Renewing soon</h3>
        <span className="text-[10px] text-accent-cyan uppercase tracking-widest">
          Next {days} days
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="flex-1 p-4 circuit-grid flex flex-col items-center justify-center opacity-50 gap-3">
          <svg className="w-12 h-12 text-[#333333]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div className="text-center">
            <p className="text-sm text-zinc-400 font-medium">
              {hydrated ? "No upcoming renewals" : "Loading data..."}
            </p>
            {hydrated && <p className="text-xs text-neutral mt-1">All subscriptions are up to date</p>}
          </div>
        </div>
      ) : (
        <ul className="flex flex-col">
          {rows.map((s) => {
            const pm = pms?.find((p) => p.id === s.paymentMethodId);
            return (
              <li key={s.id} className="border-b border-[#333333] last:border-b-0 hover:bg-[#1a1a1a] transition-colors">
                <Link
                  to="/subscriptions/$id"
                  params={{ id: s.id }}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <p className="text-sm text-zinc-100 truncate">{s.name}</p>
                    <p className="text-xs text-neutral">
                      {pm?.detail ?? "No payment method"}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 shrink-0">
                    <span className="text-sm font-medium text-zinc-100 font-mono">{inr(s.amount)}</span>
                    <span className="text-xs w-20 text-right text-accent-amber">
                      {relativeDay(s.nextRenewal)}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}