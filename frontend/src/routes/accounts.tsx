import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TopStrip } from "@/components/TopStrip";
import { useAccounts, useBackfillAccount, useConnectAccount } from "@/hooks/useAccounts";
import { relativeDays } from "@/lib/format";
import type { GmailAccount } from "@/lib/mock-data";

export const Route = createFileRoute("/accounts")({
  head: () => ({
    meta: [
      { title: "Email accounts — MAYDAY" },
      { name: "description", content: "Connected IMAP inboxes, connection health, and backfill controls." },
    ],
  }),
  component: AccountsPage,
});

const statusStyle: Record<GmailAccount["status"], { dot: string; text: string; label: string }> = {
  connected: { dot: "bg-status-success", text: "text-status-success", label: "Connected" },
  reconnect: { dot: "bg-accent-amber", text: "text-accent-amber", label: "Needs attention" },
  disconnected: { dot: "bg-neutral", text: "text-neutral", label: "Not connected" },
};

const idleStyle: Record<GmailAccount["idleHealth"], { dot: string; label: string }> = {
  live: { dot: "bg-status-success animate-pulse", label: "IDLE live" },
  reconnecting: { dot: "bg-accent-amber animate-pulse", label: "reconnecting" },
  offline: { dot: "bg-neutral", label: "offline" },
};

function AccountsPage() {
  const { data: accounts } = useAccounts();
  const [addMode, setAddMode] = useState<{ open: boolean; email?: string }>({ open: false });

  return (
    <>
      <TopStrip
        title="Email accounts"
        actions={
          <button
            onClick={() => setAddMode((v) => ({ ...v, open: !v.open }))}
            className="h-8 px-4 border border-[#333333] text-xs font-medium text-zinc-300 hover:bg-[#1a1a1a] transition-colors uppercase tracking-widest"
          >
            {addMode.open ? "Cancel" : "Add account"}
          </button>
        }
      />
      <div className="p-8 overflow-y-auto space-y-4 flex-1 fade-in">
        {addMode.open ? <AddAccountForm onClose={() => setAddMode({ open: false })} initialEmail={addMode.email} /> : null}
        {(accounts ?? []).map((a) => (
          <AccountRow key={a.id} account={a} onConnect={() => setAddMode({ open: true, email: a.email })} />
        ))}
      </div>
    </>
  );
}

function AccountRow({ account: a, onConnect }: { account: GmailAccount; onConnect: () => void }) {
  const backfill = useBackfillAccount();
  const [progress, setProgress] = useState<number | null>(null);
  const isBackfilling = backfill.isPending && backfill.variables === a.id;

  useEffect(() => {
    if (!isBackfilling) {
      setProgress(null);
      return;
    }
    setProgress(4);
    const id = setInterval(() => {
      setProgress((p) => (p === null ? null : Math.min(p + Math.random() * 12, 96)));
    }, 350);
    return () => clearInterval(id);
  }, [isBackfilling]);

  const s = statusStyle[a.status];
  const idle = idleStyle[a.idleHealth];

  return (
    <div className="panel p-0 relative hover:bg-[#1a1a1a] transition-colors group">
      <div className="absolute top-0 left-0 w-1 h-full bg-neutral/20 group-hover:bg-accent-cyan transition-colors" />
      <div className="flex items-start justify-between gap-4 p-6 pl-8">
        <div className="flex items-start gap-4 min-w-0">
          <div className={`w-1.5 h-1.5 ${s.dot} shrink-0 mt-2`} />
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-sm text-zinc-100 truncate">{a.email}</p>
              {a.isSmtpSender ? (
                <span className="text-[10px] px-2 py-0.5 border border-accent-cyan text-accent-cyan uppercase tracking-widest">
                  SMTP sender
                </span>
              ) : null}
            </div>
            <p className="text-[10px] uppercase tracking-widest text-neutral mt-2 flex items-center flex-wrap gap-x-2 gap-y-1">
              <span className={s.text}>{s.label}</span>
              <span className="text-[#333333]">/</span>
              <span className="inline-flex items-center gap-1.5">
                <span className={`w-1 h-1 ${idle.dot}`} />
                {idle.label}
              </span>
              <span className="text-[#333333]">/</span>
              <span>synced {relativeDays(a.lastSynced).toLowerCase()}</span>
            </p>
            <p className="text-[10px] text-neutral mt-1">
              imap {a.imapHost}:{a.imapPort} · smtp {a.smtpHost}:{a.smtpPort}
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {a.status === "reconnect" ? (
            <button 
              onClick={onConnect}
              className="h-8 px-4 text-[10px] uppercase tracking-widest bg-accent-amber text-[#0e0e0f] hover:brightness-110 transition-colors"
            >
              Reconnect
            </button>
          ) : a.status === "disconnected" ? (
            <button 
              onClick={onConnect}
              className="h-8 px-4 text-[10px] uppercase tracking-widest bg-accent-cyan text-[#0e0e0f] hover:brightness-110 transition-colors"
            >
              Connect
            </button>
          ) : (
            <button
              onClick={() => backfill.mutate(a.id)}
              disabled={isBackfilling}
              className="h-8 px-4 border border-[#333333] text-[10px] uppercase tracking-widest text-zinc-300 hover:bg-[#333333] disabled:opacity-50 transition-colors"
            >
              {isBackfilling ? "Backfilling..." : "Backfill"}
            </button>
          )}
        </div>
      </div>
      {isBackfilling && progress !== null ? (
        <div className="px-8 pb-4 pt-2 border-t border-[#333333] space-y-2">
          <p className="text-[10px] text-neutral uppercase tracking-widest">
            Scanning history... {Math.round(progress)}%
          </p>
          <div className="h-1 w-full bg-[#111111]">
            <div
              className="h-full bg-accent-cyan transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AddAccountForm({ onClose, initialEmail }: { onClose: () => void; initialEmail?: string }) {
  const [email, setEmail] = useState(initialEmail || "");
  const [password, setPassword] = useState("");
  const [imapHost, setImapHost] = useState("");
  const [imapPort, setImapPort] = useState(993);
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState(465);

  const connect = useConnectAccount();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        connect.mutate(
          {
            email,
            password,
            imapHost: imapHost || "imap.gmail.com",
            imapPort,
            smtpHost: smtpHost || "smtp.gmail.com",
            smtpPort,
          },
          {
            onSuccess: () => {
              onClose();
            },
          }
        );
      }}
      className="panel p-6 space-y-6 bg-[#1a1a1a]"
    >
      <h3 className="text-xs uppercase tracking-widest text-neutral">New IMAP / SMTP account</h3>
      
      {connect.isError ? (
        <div className="text-[10px] text-status-danger border border-status-danger p-3 uppercase tracking-widest">
          Failed to connect. Please verify credentials and app passwords.
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Email address">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alerts@example.com"
            className="w-full h-10 bg-transparent border border-[#333333] text-xs px-3 text-zinc-200 outline-none focus:border-accent-cyan"
          />
        </FormField>
        <FormField label="App password">
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="•••• •••• •••• ••••"
            className="w-full h-10 bg-transparent border border-[#333333] text-xs px-3 text-zinc-200 outline-none focus:border-accent-cyan"
          />
        </FormField>
        <FormField label="IMAP host">
          <input
            value={imapHost}
            onChange={(e) => setImapHost(e.target.value)}
            placeholder="imap.example.com"
            className="w-full h-10 bg-transparent border border-[#333333] text-xs px-3 text-zinc-200 outline-none focus:border-accent-cyan"
          />
        </FormField>
        <FormField label="IMAP port">
          <input
            type="number"
            value={imapPort}
            onChange={(e) => setImapPort(parseInt(e.target.value))}
            className="w-full h-10 bg-transparent border border-[#333333] text-xs px-3 text-zinc-200 outline-none focus:border-accent-cyan"
          />
        </FormField>
        <FormField label="SMTP host">
          <input
            value={smtpHost}
            onChange={(e) => setSmtpHost(e.target.value)}
            placeholder="smtp.example.com"
            className="w-full h-10 bg-transparent border border-[#333333] text-xs px-3 text-zinc-200 outline-none focus:border-accent-cyan"
          />
        </FormField>
        <FormField label="SMTP port">
          <input
            type="number"
            value={smtpPort}
            onChange={(e) => setSmtpPort(parseInt(e.target.value))}
            className="w-full h-10 bg-transparent border border-[#333333] text-xs px-3 text-zinc-200 outline-none focus:border-accent-cyan"
          />
        </FormField>
      </div>
      <div className="flex items-center gap-3 pt-2">
        <div className="ml-auto flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-4 text-[10px] uppercase tracking-widest font-medium text-neutral hover:text-zinc-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={connect.isPending}
            className="h-8 px-4 text-[10px] uppercase tracking-widest font-medium bg-accent-cyan text-[#0e0e0f] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {connect.isPending ? "Connecting..." : "Save account"}
          </button>
        </div>
      </div>
    </form>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-[10px] uppercase tracking-widest text-neutral">
        {label}
      </span>
      {children}
    </label>
  );
}