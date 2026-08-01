import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const db = getRequestContext().env.DB;
    
    // Step 1: Handle Payment Method
    let paymentMethodId = null;
    if (data.payment_method) {
      const { results: existingPMs } = await db.prepare(
        `SELECT id FROM payment_methods WHERE identifier = ?`
      ).bind(data.payment_method).all();

      if (existingPMs.length > 0) {
        paymentMethodId = (existingPMs[0] as any).id;
      } else {
        paymentMethodId = crypto.randomUUID();
        await db.prepare(`
          INSERT INTO payment_methods (id, type, identifier)
          VALUES (?, 'unknown', ?)
        `).bind(paymentMethodId, data.payment_method).run();
      }
    }

    const { results: existingSubs } = await db.prepare(
      `SELECT * FROM subscriptions WHERE name = ? COLLATE NOCASE`
    ).bind(data.merchant).all();

    const eventDate = data.date || new Date().toISOString().split('T')[0];
    const eventId = crypto.randomUUID();

    if (existingSubs.length > 0) {
      const sub = existingSubs[0] as any;
      let newStatus = sub.status;
      let nextRenewalDate = sub.next_renewal_date;
      let flagPriceChange = false;

      if (data.amount !== sub.amount && data.event_type !== 'charge_failed') {
        flagPriceChange = true;
      }

      if (data.event_type === 'pre_debit_alert') {
        newStatus = 'renewing_soon';
      } else if (data.event_type === 'charge_confirmed') {
        newStatus = 'active';
        const d = new Date(eventDate);
        d.setMonth(d.getMonth() + 1);
        nextRenewalDate = d.toISOString().split('T')[0];
      } else if (data.event_type === 'charge_failed') {
        newStatus = 'failed';
      }

      const finalPaymentMethodId = paymentMethodId || sub.payment_method_id;

      await db.prepare(`
        UPDATE subscriptions 
        SET amount = ?, status = ?, last_renewal_date = ?, next_renewal_date = ?, payment_method_id = ?
        WHERE id = ?
      `).bind(data.amount, newStatus, eventDate, nextRenewalDate, finalPaymentMethodId, sub.id).run();

      return NextResponse.json({ success: true, action: 'updated', sub_id: sub.id, flagged_price_change: flagPriceChange, newStatus });
    } else {
      const subId = crypto.randomUUID();
      const nextRenewal = new Date(eventDate);
      nextRenewal.setMonth(nextRenewal.getMonth() + 1);
      
      await db.prepare(`
        INSERT INTO subscriptions (id, name, amount, currency, billing_cycle, next_renewal_date, status, source, payment_method_id)
        VALUES (?, ?, ?, ?, '1 month', ?, 'active', 'auto', ?)
      `).bind(subId, data.merchant, data.amount, data.currency || 'INR', nextRenewal.toISOString().split('T')[0], paymentMethodId).run();

      return NextResponse.json({ success: true, action: 'created', sub_id: subId, newStatus: 'active' });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
