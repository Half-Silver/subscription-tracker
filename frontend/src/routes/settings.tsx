import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TopStrip } from "@/components/TopStrip";
import { useSettings, useUpdateSettings, useExportDatabase } from "@/hooks/useSettings";
import { useAccounts } from "@/hooks/useAccounts";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — MAYDAY" },
      { name: "description", content: "Configure alert lead time and notification method." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { data: settings } = useSettings();
  const { data: accounts } = useAccounts();
  const update = useUpdateSettings();
  const exportDb = useExportDatabase();
  const [exportState, setExportState] = useState<"idle" | "exporting" | "done">("idle");
  if (!settings) return null;

  return (
    <>
      <TopStrip title="Settings" />
      <div className="p-8 overflow-y-auto max-w-3xl space-y-0 flex-1 fade-in">
        <Section
          label="Alert lead time"
          hint="Number of days before a renewal to fire an alert."
          isFirst
        >
          <div className="flex items-center gap-4">
            <input
              type="number"
              min={0}
              max={30}
              value={settings.alertLeadDays}
              onChange={(e) =>
                update.mutate({ ...settings, alertLeadDays: Number(e.target.value) })
              }
              className="h-10 w-24 bg-transparent border border-[#333333] text-sm px-3 text-zinc-200 font-mono outline-none focus:border-accent-cyan"
            />
            <span className="text-[10px] uppercase tracking-widest text-neutral">
              day{settings.alertLeadDays === 1 ? "" : "s"} before renewal
            </span>
          </div>
        </Section>

        <Section label="Notification method" hint="How the backend delivers alerts.">
          <div className="flex gap-0 border border-[#333333] w-fit">
            {(["desktop", "email", "none"] as const).map((method) => (
              <button
                key={method}
                onClick={() => update.mutate({ ...settings, notify: method })}
                className={`h-10 px-6 text-[10px] font-medium transition-colors uppercase tracking-widest ${
                  settings.notify === method
                    ? "bg-accent-cyan text-[#0e0e0f]"
                    : "bg-transparent text-neutral hover:bg-[#1a1a1a] hover:text-zinc-300"
                } ${method !== "none" ? "border-r border-[#333333]" : ""}`}
              >
                {method}
              </button>
            ))}
          </div>
        </Section>

        <Section
          label="SMTP sender account"
          hint="Which connected inbox sends outbound alert emails."
        >
          <select
            value={settings.smtpSenderAccountId ?? ""}
            onChange={(e) =>
              update.mutate({
                ...settings,
                smtpSenderAccountId: e.target.value || null,
              })
            }
            className="h-10 bg-transparent border border-[#333333] text-xs px-3 text-zinc-200 font-mono outline-none focus:border-accent-cyan min-w-[280px] appearance-none"
          >
            <option value="" className="bg-[#0e0e0f]">— none —</option>
            {(accounts ?? [])
              .filter((a) => a.status === "connected")
              .map((a) => (
                <option key={a.id} value={a.id} className="bg-[#0e0e0f]">
                  {a.email}
                </option>
              ))}
          </select>
        </Section>

        <Section
          label="Large-charge threshold"
          hint="Flag any single charge above this amount as an anomaly."
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono text-neutral">₹</span>
            <input
              type="number"
              min={0}
              step={100}
              value={settings.largeChargeThreshold}
              onChange={(e) =>
                update.mutate({
                  ...settings,
                  largeChargeThreshold: Number(e.target.value),
                })
              }
              className="h-10 w-32 bg-transparent border border-[#333333] text-sm px-3 text-zinc-200 font-mono outline-none focus:border-accent-cyan"
            />
          </div>
        </Section>

        <Section
          label="Data management"
          hint="Trigger a manual backup of the local SQLite database."
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setExportState("exporting");
                exportDb.mutate(undefined, {
                  onSuccess: () => {
                    setExportState("done");
                    setTimeout(() => setExportState("idle"), 2000);
                  },
                });
              }}
              disabled={exportState === "exporting"}
              className="h-10 px-6 text-[10px] font-medium text-zinc-300 border border-[#333333] hover:bg-[#1a1a1a] hover:text-accent-cyan uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              {exportState === "exporting" ? "Exporting..." : "Export SQLite backup"}
            </button>
            {exportState === "done" ? (
              <span className="text-[10px] uppercase tracking-widest text-status-success font-mono">
                ✓ backup written to ~/.subscriptio/backups
              </span>
            ) : null}
          </div>
        </Section>
      </div>
    </>
  );
}

function Section({
  label,
  hint,
  children,
  isFirst = false,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
  isFirst?: boolean;
}) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 py-8 ${!isFirst ? "border-t border-[#333333]" : ""}`}>
      <div className="md:col-span-1">
        <p className="text-[10px] uppercase tracking-widest text-zinc-100 font-medium">
          {label}
        </p>
        <p className="text-[10px] uppercase tracking-widest text-neutral mt-2 leading-relaxed">{hint}</p>
      </div>
      <div className="md:col-span-2">
        {children}
      </div>
    </div>
  );
}