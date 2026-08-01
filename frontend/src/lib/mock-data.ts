export type SubStatus = "active" | "paused" | "cancelled" | "failed";
export type PayType = "credit" | "debit" | "upi";

export interface PaymentMethod {
  id: string;
  label: string;
  type: PayType;
  detail: string;
}

export interface Subscription {
  id: string;
  name: string;
  category: string;
  amount: number;
  cycle: "monthly" | "annual";
  nextRenewal: string; // ISO
  status: SubStatus;
  paymentMethodId: string;
  accountId: string;
  history: RenewalEvent[];
}

export interface RenewalEvent {
  id: string;
  date: string;
  amount: number;
  kind: "charged" | "price_changed" | "failed";
  note?: string;
}

export interface GmailAccount {
  id: string;
  email: string;
  status: "connected" | "reconnect" | "disconnected";
  lastSynced: string; // ISO
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
  idleHealth: "live" | "reconnecting" | "offline";
  isSmtpSender?: boolean;
}

export interface Alert {
  id: string;
  date: string;
  kind: "price_increase" | "sync" | "manual" | "failed";
  title: string;
  detail: string;
}

export interface Settings {
  alertLeadDays: number;
  notify: "desktop" | "email" | "none";
  smtpSenderAccountId: string | null;
  largeChargeThreshold: number;
}

const iso = (daysFromNow: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString();
};

export const mockPaymentMethods: PaymentMethod[] = [
  { id: "pm_1", label: "Visa Credit", type: "credit", detail: "VISA • 4242" },
  { id: "pm_2", label: "Amex Credit", type: "credit", detail: "AX • 1005" },
  { id: "pm_3", label: "HDFC Debit", type: "debit", detail: "DEBIT • 8821" },
  { id: "pm_4", label: "UPI Primary", type: "upi", detail: "UPI • HDFC" },
  { id: "pm_5", label: "UPI Secondary", type: "upi", detail: "UPI • ICICI" },
];

const emails = [
  "personal.main@gmail.com",
  "work.primary@nexus.io",
  "receipts.inbox@fastmail.com",
  "side.projects@gmail.com",
  "family.shared@gmail.com",
  "dev.sandbox@proton.me",
  "newsletters@gmail.com",
  "purchases.only@gmail.com",
  "old.account@gmail.com",
  "alerts.sender@fastmail.com",
];

const hostFor = (email: string) => {
  const d = email.split("@")[1];
  if (d.includes("gmail")) return { imap: "imap.gmail.com", smtp: "smtp.gmail.com" };
  if (d.includes("fastmail")) return { imap: "imap.fastmail.com", smtp: "smtp.fastmail.com" };
  if (d.includes("proton")) return { imap: "127.0.0.1", smtp: "127.0.0.1" };
  return { imap: `imap.${d}`, smtp: `smtp.${d}` };
};

export const mockAccounts: GmailAccount[] = emails.map((email, i) => {
  const h = hostFor(email);
  const status: GmailAccount["status"] = i === 6 ? "reconnect" : i === 8 ? "disconnected" : "connected";
  // Deterministic lastSynced so SSR and client hydration agree.
  return {
    id: `acc_${i + 1}`,
    email,
    status,
    lastSynced: iso(-((i % 3) + 0)),
    imapHost: h.imap,
    imapPort: 993,
    smtpHost: h.smtp,
    smtpPort: 465,
    idleHealth: status === "connected" ? (i === 3 ? "reconnecting" : "live") : "offline",
    isSmtpSender: i === 9,
  };
});

export const mockSubscriptions: Subscription[] = [
  {
    id: "sub_1",
    name: "ChatGPT Plus",
    category: "Productivity",
    amount: 1650,
    cycle: "monthly",
    nextRenewal: iso(2),
    status: "active",
    paymentMethodId: "pm_1",
    accountId: "acc_1",
    history: [
      { id: "h1", date: iso(-28), amount: 1650, kind: "charged" },
      { id: "h2", date: iso(-58), amount: 1650, kind: "charged" },
    ],
  },
  {
    id: "sub_2",
    name: "AWS Console",
    category: "Infrastructure",
    amount: 4892.4,
    cycle: "monthly",
    nextRenewal: iso(4),
    status: "active",
    paymentMethodId: "pm_2",
    accountId: "acc_2",
    history: [
      { id: "h1", date: iso(-26), amount: 4892.4, kind: "charged" },
      { id: "h2", date: iso(-56), amount: 4210, kind: "charged" },
    ],
  },
  {
    id: "sub_3",
    name: "Netflix Premium",
    category: "Entertainment",
    amount: 649,
    cycle: "monthly",
    nextRenewal: iso(6),
    status: "active",
    paymentMethodId: "pm_4",
    accountId: "acc_1",
    history: [{ id: "h1", date: iso(-24), amount: 649, kind: "charged" }],
  },
  {
    id: "sub_4",
    name: "Notion Team",
    category: "Productivity",
    amount: 820,
    cycle: "monthly",
    nextRenewal: iso(8),
    status: "active",
    paymentMethodId: "pm_1",
    accountId: "acc_2",
    history: [{ id: "h1", date: iso(-22), amount: 820, kind: "charged" }],
  },
  {
    id: "sub_5",
    name: "Spotify Family",
    category: "Entertainment",
    amount: 199,
    cycle: "monthly",
    nextRenewal: iso(11),
    status: "active",
    paymentMethodId: "pm_5",
    accountId: "acc_5",
    history: [
      { id: "h1", date: iso(-19), amount: 199, kind: "price_changed", note: "₹179 → ₹199" },
      { id: "h2", date: iso(-49), amount: 179, kind: "charged" },
    ],
  },
  {
    id: "sub_6",
    name: "GitHub Copilot",
    category: "Productivity",
    amount: 850,
    cycle: "monthly",
    nextRenewal: iso(14),
    status: "active",
    paymentMethodId: "pm_1",
    accountId: "acc_6",
    history: [{ id: "h1", date: iso(-16), amount: 850, kind: "charged" }],
  },
  {
    id: "sub_7",
    name: "Claude Pro",
    category: "Productivity",
    amount: 1650,
    cycle: "monthly",
    nextRenewal: iso(17),
    status: "active",
    paymentMethodId: "pm_4",
    accountId: "acc_1",
    history: [{ id: "h1", date: iso(-13), amount: 1650, kind: "charged" }],
  },
  {
    id: "sub_8",
    name: "Framer Pro",
    category: "Design",
    amount: 15600,
    cycle: "annual",
    nextRenewal: iso(120),
    status: "active",
    paymentMethodId: "pm_2",
    accountId: "acc_3",
    history: [{ id: "h1", date: iso(-245), amount: 15600, kind: "charged" }],
  },
  {
    id: "sub_9",
    name: "Vercel Pro",
    category: "Infrastructure",
    amount: 1700,
    cycle: "monthly",
    nextRenewal: iso(21),
    status: "active",
    paymentMethodId: "pm_2",
    accountId: "acc_4",
    history: [{ id: "h1", date: iso(-9), amount: 1700, kind: "charged" }],
  },
  {
    id: "sub_10",
    name: "Linear Standard",
    category: "Productivity",
    amount: 690,
    cycle: "monthly",
    nextRenewal: iso(24),
    status: "paused",
    paymentMethodId: "pm_1",
    accountId: "acc_2",
    history: [{ id: "h1", date: iso(-6), amount: 690, kind: "charged" }],
  },
  {
    id: "sub_11",
    name: "1Password Family",
    category: "Security",
    amount: 420,
    cycle: "monthly",
    nextRenewal: iso(27),
    status: "active",
    paymentMethodId: "pm_3",
    accountId: "acc_1",
    history: [{ id: "h1", date: iso(-3), amount: 420, kind: "charged" }],
  },
  {
    id: "sub_12",
    name: "Disney+ Hotstar",
    category: "Entertainment",
    amount: 299,
    cycle: "monthly",
    nextRenewal: iso(3),
    status: "failed",
    paymentMethodId: "pm_3",
    accountId: "acc_5",
    history: [{ id: "h1", date: iso(-1), amount: 299, kind: "failed", note: "Card declined" }],
  },
];

export const mockAlerts: Alert[] = [
  {
    id: "al_1",
    date: iso(-1),
    kind: "price_increase",
    title: "Price Increase Detected",
    detail: "Spotify Family plan increased from ₹179 to ₹199 per month. Updating records.",
  },
  {
    id: "al_2",
    date: iso(-1),
    kind: "sync",
    title: "OAuth Sync Complete",
    detail: "Synchronized 14 new transactions across 3 linked Google Workspace accounts.",
  },
  {
    id: "al_3",
    date: iso(-2),
    kind: "manual",
    title: "Manual Update",
    detail: "New annual subscription for Framer Pro added via dashboard override.",
  },
  {
    id: "al_4",
    date: iso(-2),
    kind: "failed",
    title: "Renewal Failed",
    detail: "Disney+ Hotstar charge declined on HDFC Debit • 8821.",
  },
];

export const mockSettings: Settings = {
  alertLeadDays: 1,
  notify: "desktop",
  smtpSenderAccountId: "acc_10",
  largeChargeThreshold: 5000,
};

// synthetic monthly spend trend (last 6 months)
export interface SpendPoint { month: string; total: number; }
export const mockSpendTrend: SpendPoint[] = (() => {
  const now = new Date();
  const arr: SpendPoint[] = [];
  const base = 9800;
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const jitter = Math.sin(i * 1.7) * 900 + i * 260;
    arr.push({
      month: d.toLocaleDateString("en-US", { month: "short" }),
      total: Math.round(base + jitter),
    });
  }
  return arr;
})();