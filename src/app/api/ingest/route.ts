import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';


export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { emailText } = await req.json();
    const db = getRequestContext().env.DB;
    
    // Use LM Studio's local OpenAI-compatible endpoint
    const prompt = `Extract subscription renewal data from this email. 
Return ONLY a valid JSON object with exactly these keys: 
- "merchant": string (e.g. Netflix, Adobe)
- "amount": number
- "currency": string (e.g. INR)
- "payment_method": string (e.g. HDFC 1234, SBI UPI)
- "event_type": string (must be one of: "pre_debit_alert", "charge_confirmed", "charge_failed", "amount_changed")
- "date": string (format: YYYY-MM-DD)

If you cannot find a value, use null.
Email text:
${emailText}`;

    console.log("Sending to LM Studio...");
    
    // Default LM Studio port is 1234
    const lmStudioResponse = await fetch('http://127.0.0.1:1234/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer lm-studio'
      },
      body: JSON.stringify({
        model: 'local-model', // LM studio usually ignores this or uses the loaded model
        messages: [
          { role: "system", content: "You are a data extraction assistant. You only output raw valid JSON without markdown wrapping." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        // Optional: you can force JSON mode if the model supports it
        // response_format: { type: "json_object" }
      })
    });

    if (!lmStudioResponse.ok) {
       throw new Error(`LM Studio Error: ${lmStudioResponse.statusText}`);
    }

    const lmData = await lmStudioResponse.json();
    let text = lmData.choices[0].message.content || '{}';
    
    // Strip markdown code blocks if the model accidentally includes them
    text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    
    console.log("LM Studio Output:", text);
    const data = JSON.parse(text);

    if (!data.merchant || !data.amount) {
      return NextResponse.json({ success: false, message: 'Could not extract valid merchant or amount', raw: data });
    }

    // Step 1: Handle Payment Method
    let paymentMethodId = null;
    if (data.payment_method) {
      // Find existing payment method
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

    // Step 2: Dedup logic - Find existing subscription by Merchant
    // In a full implementation, you'd match on merchant + payment_method
    const { results: existingSubs } = await db.prepare(
      `SELECT * FROM subscriptions WHERE name = ? COLLATE NOCASE`
    ).bind(data.merchant).all();

    const eventDate = data.date || new Date().toISOString().split('T')[0];
    const eventId = crypto.randomUUID();

    if (existingSubs.length > 0) {
      // Existing subscription found - Update State Machine
      const sub = existingSubs[0] as any;
      
      let newStatus = sub.status;
      let nextRenewalDate = sub.next_renewal_date;
      let flagPriceChange = false;

      // Price change detection
      if (data.amount !== sub.amount && data.event_type !== 'charge_failed') {
        console.log(`[ALERT] Price change detected for ${data.merchant}: ₹${sub.amount} -> ₹${data.amount}`);
        flagPriceChange = true;
      }

      // State Machine Logic based on event_type
      if (data.event_type === 'pre_debit_alert') {
        newStatus = 'renewing_soon';
      } else if (data.event_type === 'charge_confirmed') {
        newStatus = 'active';
        // Compute next renewal date (assuming 1 month cycle for MVP)
        const d = new Date(eventDate);
        d.setMonth(d.getMonth() + 1);
        nextRenewalDate = d.toISOString().split('T')[0];
      } else if (data.event_type === 'charge_failed') {
        newStatus = 'failed';
      }

      // Use existing payment method ID if we didn't extract a new one
      const finalPaymentMethodId = paymentMethodId || sub.payment_method_id;

      // Update Subscription
      await db.prepare(`
        UPDATE subscriptions 
        SET amount = ?, status = ?, last_renewal_date = ?, next_renewal_date = ?, payment_method_id = ?
        WHERE id = ?
      `).bind(data.amount, newStatus, eventDate, nextRenewalDate, finalPaymentMethodId, sub.id).run();

      // Log Renewal Event
      await db.prepare(`
        INSERT INTO renewal_events (id, subscription_id, event_type, amount, event_date, payment_method_used, raw_source)
        VALUES (?, ?, ?, ?, ?, ?, 'email_scraper')
      `).bind(eventId, sub.id, data.event_type, data.amount, eventDate, data.payment_method).run();

      return NextResponse.json({ success: true, action: 'updated', sub_id: sub.id, flagged_price_change: flagPriceChange, data });
    } else {
      // Step 2: Create new subscription if none exists
      const subId = crypto.randomUUID();
      const nextRenewal = new Date(eventDate);
      nextRenewal.setMonth(nextRenewal.getMonth() + 1);
      
      await db.prepare(`
        INSERT INTO subscriptions (id, name, amount, currency, billing_cycle, next_renewal_date, status, source, payment_method_id)
        VALUES (?, ?, ?, ?, '1 month', ?, 'active', 'auto', ?)
      `).bind(subId, data.merchant, data.amount, data.currency || 'INR', nextRenewal.toISOString().split('T')[0], paymentMethodId).run();

      // Log the initial event
      await db.prepare(`
        INSERT INTO renewal_events (id, subscription_id, event_type, amount, event_date, payment_method_used, raw_source)
        VALUES (?, ?, ?, ?, ?, ?, 'email_scraper')
      `).bind(eventId, subId, data.event_type || 'charge_confirmed', data.amount, eventDate, data.payment_method).run();

      return NextResponse.json({ success: true, action: 'created', sub_id: subId, data });
    }
  } catch (err: any) {
    console.error("Ingest Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
