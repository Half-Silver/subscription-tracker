import React from 'react';
import { getSubscriptions, addSubscription, deleteSubscription } from './actions';
import AccountManager from './AccountManager';

export const runtime = 'edge';

export default async function Dashboard() {
  const subscriptions = await getSubscriptions();

  const totalSpend = subscriptions.reduce((acc: number, sub: any) => {
    return sub.status !== 'cancelled' && sub.status !== 'failed' ? acc + sub.amount : acc;
  }, 0);

  return (
    <div className="min-h-screen bg-black text-zinc-100 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">Silo Subscriptions</h1>
          <div className="text-sm font-medium text-zinc-500 bg-zinc-900 px-4 py-2 rounded-full border border-white/5">
            Phase 3 MVP
          </div>
        </header>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 rounded-xl border border-white/5 bg-zinc-900/50 flex flex-col gap-1 shadow-sm">
            <span className="text-sm font-medium text-zinc-500">Monthly Spend</span>
            <span className="text-3xl font-semibold">₹{totalSpend.toLocaleString()}</span>
          </div>
          <div className="p-6 rounded-xl border border-white/5 bg-zinc-900/50 flex flex-col gap-1 shadow-sm">
            <span className="text-sm font-medium text-zinc-500">Active Subscriptions</span>
            <span className="text-3xl font-semibold">{subscriptions.filter((s: any) => s.status === 'active' || s.status === 'renewing_soon').length}</span>
          </div>
          <div className="p-6 rounded-xl border border-orange-500/20 bg-orange-500/5 flex flex-col gap-1 shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent pointer-events-none" />
            <span className="text-sm font-medium text-orange-500/80">Next Charge</span>
            {subscriptions.length > 0 ? (
               <>
                 <span className="text-3xl font-semibold">₹{subscriptions[0].amount}</span>
                 <span className="text-xs text-orange-500/50 mt-1">{subscriptions[0].next_renewal_date} · {subscriptions[0].name}</span>
               </>
            ) : (
               <span className="text-3xl font-semibold">-</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left Column: Subscriptions & Accounts */}
          <div className="md:col-span-2 space-y-8">
            {/* Subscriptions Table */}
            <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-medium tracking-tight">Active Subscriptions</h2>
                <span className="text-xs text-zinc-500 font-medium tracking-wider uppercase">Auto-updating via IMAP</span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-zinc-500">
                      <th className="px-6 py-4 font-medium">Merchant</th>
                      <th className="px-6 py-4 font-medium">Amount</th>
                      <th className="px-6 py-4 font-medium">Next Renewal</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {subscriptions.map((sub: any) => (
                      <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-zinc-200">{sub.name}</div>
                          <div className="text-xs text-zinc-500">{sub.payment_method}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium">₹{sub.amount}</div>
                          <div className="text-xs text-zinc-500">{sub.currency}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">{sub.next_renewal_date}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium capitalize
                            ${sub.status === 'renewing_soon' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400 animate-pulse' : ''}
                            ${sub.status === 'active' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : ''}
                            ${sub.status === 'failed' ? 'bg-red-500/10 border-red-500/20 text-red-400' : ''}
                            ${sub.status === 'cancelled' ? 'bg-gray-500/10 border-gray-500/20 text-gray-400' : ''}
                          `}>
                            {sub.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {subscriptions.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-zinc-500 text-sm">
                          No subscriptions found yet. Sync your inbox to populate!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Connected Email Accounts */}
            <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500" />
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-xl font-medium tracking-tight">Connected Inboxes</h2>
                 <span className="text-xs text-zinc-500 font-medium tracking-wider uppercase">IMAP Configuration</span>
               </div>
               <AccountManager />
            </div>
          </div>

          {/* Right Column: Add Manual Subscription */}
          <div>
            <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6 shadow-xl sticky top-8">
              <h2 className="text-lg font-medium mb-6 tracking-tight">Add Manual Record</h2>
              <form action={addSubscription} className="space-y-4">
                 <div>
                   <label className="block text-xs font-medium text-zinc-400 mb-1.5">Merchant Name</label>
                   <input name="name" required className="w-full bg-black border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition-colors" placeholder="e.g. Netflix" />
                 </div>
                 <div>
                   <label className="block text-xs font-medium text-zinc-400 mb-1.5">Amount (₹)</label>
                   <input name="amount" type="number" step="0.01" required className="w-full bg-black border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition-colors" placeholder="499" />
                 </div>
                 <div>
                   <label className="block text-xs font-medium text-zinc-400 mb-1.5">Next Renewal</label>
                   <input name="next_renewal_date" type="date" required className="w-full bg-black border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition-colors" />
                 </div>
                 <div>
                   <label className="block text-xs font-medium text-zinc-400 mb-1.5">Payment Method</label>
                   <input name="payment_method" className="w-full bg-black border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition-colors" placeholder="e.g. HDFC 1234" />
                 </div>
                 <button type="submit" className="w-full bg-white text-black hover:bg-zinc-200 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors mt-2">
                   Add Record
                 </button>
              </form>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
