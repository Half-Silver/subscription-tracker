import { useAlerts } from "@/hooks/useAlerts";
import { relativeTime } from "@/lib/format";

const dotByKind: Record<string, string> = {
  price_increase: "bg-status-danger",
  sync: "bg-status-success",
  manual: "bg-neutral",
  failed: "bg-status-danger",
};

export function AlertsFeed() {
  const { data } = useAlerts();
  return (
    <div className="panel p-0 h-full flex flex-col">
      <div className="flex justify-between items-center p-4 border-b border-[#333333]">
        <h3 className="text-xs uppercase tracking-widest text-neutral">Recent activity</h3>
        <span className="text-[10px] text-accent-cyan uppercase tracking-widest animate-pulse">Live</span>
      </div>
      
      {(!data || data.length === 0) ? (
        <div className="flex-1 p-4 circuit-grid flex flex-col items-center justify-center opacity-50 gap-3">
          <svg className="w-12 h-12 text-[#333333]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <div className="text-center">
            <p className="text-sm text-zinc-400 font-medium">All quiet</p>
            <p className="text-xs text-neutral mt-1">No new alerts to report</p>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-[#333333]">
          {data.map((a) => (
            <li key={a.id} className="flex gap-4 p-4 hover:bg-[#1a1a1a] transition-colors">
              <div className="mt-1 flex items-start">
                <div className={`w-1.5 h-1.5 rounded-sm ${dotByKind[a.kind] ?? "bg-neutral"}`} />
              </div>
              <div className="min-w-0 flex-1 flex flex-col gap-1">
                <div className="flex justify-between items-baseline gap-2">
                  <p className="text-sm font-medium text-zinc-100 truncate">{a.title}</p>
                  <span className="text-[10px] text-neutral shrink-0">{relativeTime(a.date).toUpperCase()}</span>
                </div>
                <p className="text-xs text-neutral leading-relaxed">
                  {a.detail}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}