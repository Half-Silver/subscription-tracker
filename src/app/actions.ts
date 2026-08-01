'use server'

import { getRequestContext } from '@cloudflare/next-on-pages'
import { revalidatePath } from 'next/cache'

// --- Database Subscription Actions ---

export async function addSubscription(formData: FormData) {
  const db = getRequestContext().env.DB;
  
  const name = formData.get('name') as string;
  const amount = parseFloat(formData.get('amount') as string);
  const billing_cycle = formData.get('billing_cycle') as string;
  const next_renewal_date = formData.get('next_renewal_date') as string;
  // const payment_method = formData.get('payment_method') as string; // Will link to PM later

  const id = crypto.randomUUID();

  await db.prepare(`
    INSERT INTO subscriptions (id, name, amount, billing_cycle, next_renewal_date, status, source)
    VALUES (?, ?, ?, ?, ?, 'active', 'manual')
  `).bind(id, name, amount, billing_cycle, next_renewal_date).run();

  revalidatePath('/');
}



export async function getSubscriptions() {
  const db = getRequestContext().env.DB;
  const { results } = await db.prepare(`
    SELECT s.*, p.identifier as payment_method 
    FROM subscriptions s 
    LEFT JOIN payment_methods p ON s.payment_method_id = p.id 
    ORDER BY s.next_renewal_date ASC
  `).all();
  return results;
}
