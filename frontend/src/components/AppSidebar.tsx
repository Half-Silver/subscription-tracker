import { Link, useRouterState } from "@tanstack/react-router";

type IconName = "pulse" | "list" | "mail" | "card" | "gear";

const items: { to: string; label: string; icon: IconName }[] = [
  { to: "/", label: "Dashboard", icon: "pulse" },
  { to: "/subscriptions", label: "Subscriptions", icon: "list" },
  { to: "/accounts", label: "Connected accounts", icon: "mail" },
  { to: "/payment-methods", label: "Payment methods", icon: "card" },
  { to: "/settings", label: "Settings", icon: "gear" },
];

function Icon({ name, className }: { name: IconName; className?: string }) {
  const c = className ?? "w-4 h-4";
  const p: Record<IconName, string> = {
    pulse: "M3 12h4l2-6 4 12 2-6h6",
    list: "M4 6h16M4 12h16M4 18h10",
    mail: "M3 7l9 6 9-6M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z",
    card: "M3 9h18M4 6h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1z",
    gear: "M12 15a3 3 0 100-6 3 3 0 000 6zm7-3a7 7 0 00-.13-1.31l2.1-1.64-2-3.46-2.49 1a7 7 0 00-2.27-1.31l-.38-2.62h-4l-.38 2.62a7 7 0 00-2.27 1.31l-2.49-1-2 3.46 2.1 1.64A7 7 0 005 12a7 7 0 00.13 1.31l-2.1 1.64 2 3.46 2.49-1a7 7 0 002.27 1.31l.38 2.62h4l.38-2.62a7 7 0 002.27-1.31l2.49 1 2-3.46-2.1-1.64c.09-.42.13-.86.13-1.31z",
  };
  return (
    <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={p[name]} />
    </svg>
  );
}

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <aside className="w-[170px] shrink-0 flex flex-col py-6 px-4 bg-[#0e0e0f] border-r border-[#333333] relative overflow-hidden">
      <div className="absolute inset-0 scanline z-0" />
      <div className="relative z-10 flex flex-col h-full gap-8">
        <div className="flex flex-col gap-6">
          <Link to="/" aria-label="Home" className="group relative flex items-center gap-2">
            <div className="w-6 h-6 bg-accent-cyan/10 flex items-center justify-center border border-accent-cyan/30 shadow-[0_0_8px_-2px_rgba(0,212,255,0.5)] group-hover:border-accent-cyan/50 transition-colors">
              <div className="w-1.5 h-1.5 bg-accent-cyan animate-[pulse-glow_2s_infinite]" />
            </div>
            <span className="font-mono text-sm tracking-widest text-zinc-100 uppercase font-medium">Mayday</span>
          </Link>
          <div className="h-px bg-gradient-to-r from-transparent via-[#333] to-transparent w-full" />
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {items.map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-label={item.label}
              className={
                "group relative px-3 py-2 text-xs flex items-center transition-all " +
                (active
                  ? "bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20"
                  : "text-neutral hover:text-zinc-300 hover:bg-[#1a1a1a] border border-transparent")
              }
            >
              <Icon name={item.icon} className="mr-3 w-4 h-4 opacity-70" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

        <div className="mt-auto flex flex-col gap-2">
          <p className="text-[10px] text-[#333333] font-mono border-t border-[#222] pt-2 flex items-center gap-1.5">
            v1.0.4 // <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" /> SYS_OK
          </p>
        </div>
      </div>
    </aside>
  );
}