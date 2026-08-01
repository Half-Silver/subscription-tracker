export type SubscriptionStatus = "active" | "trial" | "cancelled" | "paused";
export type BillingCycle = "monthly" | "annual" | "weekly" | "quarterly";

export type Subscription = {
  id: string;
  name: string;
  category: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  cost: number;
  currency: string;
  nextRenewal: string;
  paymentMethod: string;
  detectedFrom: {
    sender: string;
    subject: string;
    date: string;
  };
  confidence: number;
  notes: string;
  createdAt: string;
};

export type Stats = {
  totalMonthly: number;
  totalAnnual: number;
  activeCount: number;
  trialCount: number;
  cancelledCount: number;
  upcomingRenewals: number;
  categoryBreakdown: { category: string; amount: number; count: number }[];
  monthlySpend: { month: string; amount: number }[];
};

export const categories = [
  "Entertainment",
  "Software",
  "Cloud",
  "Music",
  "Productivity",
  "Finance",
  "Shopping",
  "News",
  "Gaming",
  "Other",
];

export const mockSubscriptions: Subscription[] = [
  {
    id: "sub-1",
    name: "Netflix",
    category: "Entertainment",
    status: "active",
    billingCycle: "monthly",
    cost: 15.49,
    currency: "USD",
    nextRenewal: "2026-08-15",
    paymentMethod: "Visa ending in 4242",
    detectedFrom: {
      sender: "Netflix <info@netflix.com>",
      subject: "Your Netflix subscription receipt",
      date: "2026-07-15",
    },
    confidence: 98,
    notes: "Standard plan, shared with family.",
    createdAt: "2026-01-10",
  },
  {
    id: "sub-2",
    name: "Spotify",
    category: "Music",
    status: "active",
    billingCycle: "monthly",
    cost: 10.99,
    currency: "USD",
    nextRenewal: "2026-08-03",
    paymentMethod: "PayPal",
    detectedFrom: {
      sender: "Spotify <receipts@spotify.com>",
      subject: "Your Spotify Premium receipt",
      date: "2026-07-03",
    },
    confidence: 97,
    notes: "Individual Premium plan.",
    createdAt: "2025-03-22",
  },
  {
    id: "sub-3",
    name: "Notion",
    category: "Productivity",
    status: "active",
    billingCycle: "annual",
    cost: 96,
    currency: "USD",
    nextRenewal: "2027-02-18",
    paymentMethod: "Visa ending in 4242",
    detectedFrom: {
      sender: "Notion <billing@notion.so>",
      subject: "Your Notion invoice",
      date: "2026-02-18",
    },
    confidence: 95,
    notes: "Plus plan, billed yearly.",
    createdAt: "2025-02-18",
  },
  {
    id: "sub-4",
    name: "GitHub Copilot",
    category: "Software",
    status: "active",
    billingCycle: "monthly",
    cost: 19,
    currency: "USD",
    nextRenewal: "2026-08-22",
    paymentMethod: "Mastercard ending in 8899",
    detectedFrom: {
      sender: "GitHub <noreply@github.com>",
      subject: "Your GitHub Copilot subscription receipt",
      date: "2026-07-22",
    },
    confidence: 99,
    notes: "Pro plan for individual use.",
    createdAt: "2025-07-15",
  },
  {
    id: "sub-5",
    name: "Adobe Creative Cloud",
    category: "Software",
    status: "active",
    billingCycle: "monthly",
    cost: 59.99,
    currency: "USD",
    nextRenewal: "2026-08-09",
    paymentMethod: "Visa ending in 4242",
    detectedFrom: {
      sender: "Adobe <accounts@adobe.com>",
      subject: "Your Adobe invoice",
      date: "2026-07-09",
    },
    confidence: 94,
    notes: "All Apps plan.",
    createdAt: "2024-08-10",
  },
  {
    id: "sub-6",
    name: "Amazon Prime",
    category: "Shopping",
    status: "active",
    billingCycle: "annual",
    cost: 139,
    currency: "USD",
    nextRenewal: "2026-11-30",
    paymentMethod: "Visa ending in 4242",
    detectedFrom: {
      sender: "Amazon <auto-confirm@amazon.com>",
      subject: "Your Amazon Prime membership renewal",
      date: "2025-11-30",
    },
    confidence: 96,
    notes: "Annual membership with shipping benefits.",
    createdAt: "2020-11-30",
  },
  {
    id: "sub-7",
    name: "Figma",
    category: "Software",
    status: "trial",
    billingCycle: "monthly",
    cost: 45,
    currency: "USD",
    nextRenewal: "2026-08-12",
    paymentMethod: "Visa ending in 4242",
    detectedFrom: {
      sender: "Figma <billing@figma.com>",
      subject: "Your Figma trial is ending soon",
      date: "2026-07-28",
    },
    confidence: 92,
    notes: "Professional plan trial, considering upgrade.",
    createdAt: "2026-07-12",
  },
  {
    id: "sub-8",
    name: "The New York Times",
    category: "News",
    status: "active",
    billingCycle: "monthly",
    cost: 17,
    currency: "USD",
    nextRenewal: "2026-08-07",
    paymentMethod: "PayPal",
    detectedFrom: {
      sender: "The New York Times <member@nytimes.com>",
      subject: "Your New York Times subscription receipt",
      date: "2026-07-07",
    },
    confidence: 98,
    notes: "All Access digital subscription.",
    createdAt: "2025-01-05",
  },
  {
    id: "sub-9",
    name: "Dropbox",
    category: "Cloud",
    status: "cancelled",
    billingCycle: "monthly",
    cost: 11.99,
    currency: "USD",
    nextRenewal: "2026-06-15",
    paymentMethod: "Visa ending in 4242",
    detectedFrom: {
      sender: "Dropbox <billing@dropbox.com>",
      subject: "Your Dropbox subscription has been cancelled",
      date: "2026-06-15",
    },
    confidence: 90,
    notes: "Cancelled after switching to Google Drive.",
    createdAt: "2024-04-20",
  },
  {
    id: "sub-10",
    name: "Xbox Game Pass",
    category: "Gaming",
    status: "active",
    billingCycle: "monthly",
    cost: 14.99,
    currency: "USD",
    nextRenewal: "2026-08-19",
    paymentMethod: "Microsoft account balance",
    detectedFrom: {
      sender: "Microsoft <billing@microsoft.com>",
      subject: "Your Xbox Game Pass subscription receipt",
      date: "2026-07-19",
    },
    confidence: 97,
    notes: "Ultimate plan.",
    createdAt: "2025-06-10",
  },
];

function monthlyEquivalent(cost: number, cycle: BillingCycle): number {
  switch (cycle) {
    case "weekly":
      return cost * 4.33;
    case "monthly":
      return cost;
    case "quarterly":
      return cost / 3;
    case "annual":
      return cost / 12;
    default:
      return cost;
  }
}

import { apiFetch } from "./api-client";

export async function getSubscriptions(): Promise<Subscription[]> {
  try {
    const rawSubs = await apiFetch<any[]>("/subscriptions");
    if (Array.isArray(rawSubs) && rawSubs.length > 0) {
      return rawSubs.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category || "Software",
        status: (s.status === "renewing_soon" ? "trial" : s.status) as SubscriptionStatus,
        billingCycle: (s.billing_cycle?.toLowerCase() || "monthly") as BillingCycle,
        cost: s.amount || 0,
        currency: s.currency || "USD",
        nextRenewal: s.next_renewal_date || new Date().toISOString().split("T")[0],
        paymentMethod: s.paymentMethod?.identifier || s.payment_method || "Card",
        detectedFrom: {
          sender: "Email Scanner",
          subject: `Renewal notice for ${s.name}`,
          date: s.last_renewal_date || new Date().toISOString().split("T")[0],
        },
        confidence: 95,
        notes: s.notes || "Auto-detected subscription",
        createdAt: s.created_at || new Date().toISOString().split("T")[0],
      }));
    }
  } catch (err) {
    // Fallback to mock data if backend not reachable
  }
  return [...mockSubscriptions];
}

export async function getSubscriptionById(id: string): Promise<Subscription | undefined> {
  const subs = await getSubscriptions();
  return subs.find((sub) => sub.id === id);
}

export async function getStats(): Promise<Stats> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const active = mockSubscriptions.filter((s) => s.status === "active" || s.status === "trial");
  const totalMonthly = active.reduce((sum, s) => sum + monthlyEquivalent(s.cost, s.billingCycle), 0);
  const totalAnnual = totalMonthly * 12;

  const categoryMap = new Map<string, { amount: number; count: number }>();
  for (const sub of active) {
    const monthly = monthlyEquivalent(sub.cost, sub.billingCycle);
    const existing = categoryMap.get(sub.category) ?? { amount: 0, count: 0 };
    existing.amount += monthly;
    existing.count += 1;
    categoryMap.set(sub.category, existing);
  }

  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([category, data]) => ({ category, amount: data.amount, count: data.count }))
    .sort((a, b) => b.amount - a.amount);

  const today = new Date("2026-08-01");
  const thirtyDays = new Date(today);
  thirtyDays.setDate(today.getDate() + 30);
  const upcomingRenewals = active.filter((s) => {
    const renewal = new Date(s.nextRenewal);
    return renewal >= today && renewal <= thirtyDays;
  }).length;

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlySpend = months.map((month, index) => {
    const base = totalMonthly;
    const variation = Math.sin(index * 0.5) * base * 0.15;
    return { month, amount: Math.round((base + variation) * 100) / 100 };
  });

  return {
    totalMonthly: Math.round(totalMonthly * 100) / 100,
    totalAnnual: Math.round(totalAnnual * 100) / 100,
    activeCount: active.filter((s) => s.status === "active").length,
    trialCount: active.filter((s) => s.status === "trial").length,
    cancelledCount: mockSubscriptions.filter((s) => s.status === "cancelled").length,
    upcomingRenewals,
    categoryBreakdown,
    monthlySpend,
  };
}
