export const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export const relativeDays = (iso: string) => {
  const ms = new Date(iso).getTime() - Date.now();
  const days = Math.round(ms / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "In 1 day";
  if (days > 0) return `In ${days} days`;
  if (days === -1) return "1 day ago";
  return `${Math.abs(days)} days ago`;
};

export const relativeTime = (iso: string) => {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};