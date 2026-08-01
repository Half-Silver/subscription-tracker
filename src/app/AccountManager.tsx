'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AccountManager() {
  const [accounts, setAccounts] = useState<{user: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    setLoading(true);
    try {
      const res = await fetch('/api/accounts');
      const data = await res.json();
      setAccounts(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const user = formData.get('user');
    const pass = formData.get('pass');
    
    if (user && pass) {
      await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, pass })
      });
      fetchAccounts();
      (e.target as HTMLFormElement).reset();
    }
  }

  async function handleDelete(user: string) {
    await fetch('/api/accounts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user })
    });
    fetchAccounts();
  }

  async function handleSync() {
    setSyncing(true);
    setSyncLogs(['Starting IMAP Sync...']);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();
      if (data.logs) {
        setSyncLogs(prev => [...prev, ...data.logs]);
      }
      setSyncLogs(prev => [...prev, 'Sync Complete!']);
      router.refresh(); // Refresh page to show new subs
    } catch (e) {
      setSyncLogs(prev => [...prev, 'Sync failed: ' + String(e)]);
    }
    setSyncing(false);
  }

  if (loading) return <div className="text-zinc-500 text-sm">Loading accounts...</div>;

  return (
    <div className="space-y-4">
      {/* Accounts List */}
      <div className="space-y-2">
        {accounts.map(acc => (
          <div key={acc.user} className="flex justify-between items-center bg-zinc-800/50 p-3 rounded-lg border border-white/5 text-sm">
            <span>{acc.user}</span>
            <button onClick={() => handleDelete(acc.user)} className="text-red-400 hover:text-red-300">Remove</button>
          </div>
        ))}
        {accounts.length === 0 && <div className="text-zinc-500 text-sm italic">No accounts linked yet.</div>}
      </div>

      {/* Add Account Form */}
      <form onSubmit={handleAdd} className="flex gap-2 items-end pt-2">
         <div className="flex-1">
           <input name="user" type="email" required className="w-full bg-zinc-950 border border-white/10 rounded-md px-3 py-2 text-sm" placeholder="Gmail Address" />
         </div>
         <div className="flex-1">
           <input name="pass" type="password" required className="w-full bg-zinc-950 border border-white/10 rounded-md px-3 py-2 text-sm" placeholder="16-letter App Password" />
         </div>
         <button type="submit" className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-md text-sm font-medium transition-colors">
           Add
         </button>
      </form>

      {/* Sync Button & Logs */}
      <div className="pt-4 mt-4 border-t border-white/5">
        <button 
          onClick={handleSync}
          disabled={syncing || accounts.length === 0}
          className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50 px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-lg flex items-center justify-center gap-2"
        >
          {syncing ? (
             <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"/> Syncing...</>
          ) : 'Sync All Inboxes Now'}
        </button>

        {syncLogs.length > 0 && (
          <div className="mt-4 p-3 bg-black/50 rounded-lg border border-white/5 max-h-40 overflow-y-auto">
            <h4 className="text-xs font-mono text-zinc-500 mb-2">SYNC LOGS</h4>
            <div className="space-y-1 text-xs font-mono text-zinc-300">
              {syncLogs.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
