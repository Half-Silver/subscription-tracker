import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useHydrated } from "@/hooks/useHydrated";

interface Props {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function TopStrip({ title, subtitle, actions, onRefresh, isRefreshing }: Props) {
  const { data: subs } = useSubscriptions();
  const hydrated = useHydrated();
  const activeCount = hydrated ? (subs ?? []).filter((s) => s.status === "active").length : 0;

  return (
    <header className="flex justify-between items-end px-8 pt-8 pb-4 shrink-0 border-b border-[#333333] relative">
      <div className="absolute top-0 left-0 w-full glow-line bg-gradient-to-r from-transparent via-accent-cyan to-transparent opacity-50" />
      <div>
        <h1 className="text-xl font-medium text-zinc-100 tracking-tight">
          {title ?? "Dashboard"}
        </h1>
        <p className="text-neutral text-xs mt-1 uppercase tracking-widest">
          {subtitle ?? `Monitoring ${activeCount} active subscriptions`}
        </p>
      </div>
      <div className="flex gap-4">
        {actions ?? (
          <>
            {onRefresh ? (
              <button 
                onClick={onRefresh}
                disabled={isRefreshing}
                className="px-4 py-2 border border-[#333333] text-xs uppercase tracking-widest text-zinc-300 hover:bg-[#1a1a1a] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isRefreshing ? (
                  <>
                    <svg className="animate-spin h-3 w-3 text-zinc-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Syncing...
                  </>
                ) : "Refresh sync"}
              </button>
            ) : (
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 border border-[#333333] text-xs uppercase tracking-widest text-zinc-300 hover:bg-[#1a1a1a] transition-colors"
              >
                Refresh sync
              </button>
            )}
            <Link 
              to="/accounts" 
              className="px-4 py-2 bg-accent-cyan text-[#0e0e0f] text-xs font-semibold uppercase tracking-widest hover:brightness-110 transition-all hover:shadow-[0_0_15px_-5px_rgba(0,212,255,0.8)] flex items-center justify-center"
            >
              New connection
            </Link>
          </>
        )}
      </div>
    </header>
  );
}