import { inr } from "@/lib/format";
import type { Subscription } from "@/lib/mock-data";

export function SpendTrendChart({ subscriptions = [] }: { subscriptions?: Subscription[] }) {
  const today = new Date();
  
  const pts = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
    const month = d.toLocaleString("default", { month: "short" });
    
    let total = 0;
    subscriptions.forEach(sub => {
      if (sub.status === "active") {
        total += sub.amount;
      }
    });
    return { month, total };
  });

  const values = pts.map((p) => p.total);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const W = 1000;
  const H = 100;

  const toXY = (v: number, i: number) => {
    const x = (i / (pts.length - 1)) * W;
    const y = H - 10 - ((v - min) / Math.max(1, range)) * (H - 20);
    return [x, y] as const;
  };
  const coords = pts.map((p, i) => toXY(p.total, i));

  // straight lines for industrial look instead of smooth curves
  let d = `M ${coords[0][0]},${coords[0][1]}`;
  for (let i = 1; i < coords.length; i++) {
    d += ` L ${coords[i][0]},${coords[i][1]}`;
  }
  const fillD = `${d} L ${W},${H} L 0,${H} Z`;
  const marker = coords[coords.length - 1];
  const latest = pts[pts.length - 1] || { total: 0 };

  const catMap = new Map<string, number>();
  let currentTotal = 0;
  subscriptions.forEach(sub => {
    if (sub.status === "active") {
      currentTotal += sub.amount;
      catMap.set(sub.category, (catMap.get(sub.category) || 0) + sub.amount);
    }
  });

  const categoryColors = ["bg-accent-cyan", "bg-[#0088aa]", "bg-neutral", "bg-[#333333]"];
  const categories = Array.from(catMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, amount], i) => ({
      name,
      amount,
      color: categoryColors[i % categoryColors.length]
    }));

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      <div className="panel relative flex-1 h-56 overflow-hidden p-6 flex flex-col">
        <div className="flex justify-between items-start z-10 relative">
          <div>
            <span className="text-xs text-neutral tracking-widest uppercase">Monthly trend</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-neutral uppercase tracking-widest">Latest</span>
            <p className="text-lg text-accent-cyan mt-1">{inr(latest.total)}</p>
          </div>
        </div>

        <div className="absolute inset-0 pt-16 px-6 pointer-events-none circuit-grid opacity-30"></div>

        <svg
          className="absolute inset-x-0 bottom-6 w-full h-28"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          style={{ filter: "drop-shadow(0 0 4px rgba(0,212,255,0.4))" }}
        >
          <g className="text-[#333333] opacity-50" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" vectorEffect="non-scaling-stroke">
            <line x1="0" y1="25" x2={W} y2="25" />
            <line x1="0" y1="50" x2={W} y2="50" />
            <line x1="0" y1="75" x2={W} y2="75" />
          </g>
          <path
            d={d}
            fill="none"
            stroke="#00d4ff"
            strokeWidth="2"
            strokeLinejoin="miter"
            vectorEffect="non-scaling-stroke"
            className="animate-[draw-line_1s_ease-out_forwards]"
            strokeDasharray="2000"
            strokeDashoffset="2000"
          />
          <path d={fillD} fill="#00d4ff" opacity="0.05" />
          <rect x={marker[0]-3} y={marker[1]-3} width="6" height="6" fill="#00d4ff" className="animate-[pulse-glow_2s_infinite]" />
        </svg>

        <div className="absolute inset-x-6 bottom-6 h-28 pointer-events-none">
          {pts.map((p, i) => {
             const xPercent = (i / (pts.length - 1)) * 100;
             const yPercent = (coords[i][1] / H) * 100;
             return (
               <div key={p.month} className="absolute text-[10px] text-accent-cyan/80 font-mono" style={{ left: `${xPercent}%`, top: `${yPercent}%`, transform: 'translate(-50%, -100%)', marginTop: '-4px' }}>
                 {inr(p.total)}
               </div>
             );
          })}
        </div>

        <div className="absolute bottom-2 inset-x-6 flex justify-between text-[10px] text-neutral uppercase tracking-widest pointer-events-none border-t border-[#333333] pt-2 mt-2">
          {pts.map((p) => (
            <span key={p.month}>{p.month}</span>
          ))}
        </div>
      </div>
      
      <div className="panel w-full lg:w-72 p-6 flex flex-col">
        <span className="text-xs text-neutral tracking-widest uppercase mb-4">Category breakdown</span>
        <div className="flex flex-col gap-4 flex-1 justify-center">
          {categories.map((c) => (
            <div key={c.name} className="flex flex-col gap-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-300">{c.name}</span>
                <span className="text-zinc-400">{inr(c.amount)}</span>
              </div>
              <div className="h-1 w-full bg-[#111111] overflow-hidden">
                <div className={`h-full ${c.color}`} style={{ width: `${currentTotal > 0 ? (c.amount / currentTotal) * 100 : 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}