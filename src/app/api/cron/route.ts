import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET(req: Request) {
  try {
    const db = getRequestContext().env.DB;

    // Get tomorrow's date for the 1-day alert
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const { results } = await db.prepare(
      `SELECT * FROM subscriptions WHERE next_renewal_date = ? AND status = 'active'`
    ).bind(tomorrowStr).all();

    console.log(`[CRON] Found ${results.length} subscriptions renewing tomorrow (${tomorrowStr}).`);

    const alertsSent = [];
    for (const sub of results as any[]) {
      // Here is where you would integrate Resend:
      // await resend.emails.send({ ... })
      
      const message = `[EMAIL ALERT SENT] 🚨 Heads up! Your ${sub.name} subscription will charge ₹${sub.amount} tomorrow!`;
      console.log(message);
      alertsSent.push(message);
    }

    return NextResponse.json({ success: true, count: results.length, alerts: alertsSent });
  } catch (err: any) {
    console.error("Cron Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
