import cron from 'node-cron';
import prisma from '../db';
import { processAccountEmails } from '../mail/fetcher';
import { initializeAllIdleConnections } from '../mail/idleManager';
import { sendAlert } from '../mail/sender';

export function startScheduler() {
  console.log('Starting background scheduler...');

  // Start IDLE connections on boot
  initializeAllIdleConnections().catch(console.error);

  // 1. Fallback poll job (every 30 minutes)
  cron.schedule('*/30 * * * *', async () => {
    console.log('[CRON] Running fallback poll for all accounts...');
    try {
      const accounts = await prisma.connectedAccount.findMany();
      for (const account of accounts) {
        await processAccountEmails(account.id).catch(err => {
          console.error(`Fallback poll failed for ${account.email}:`, err);
        });
      }
    } catch (err) {
      console.error('[CRON] Fallback poll error:', err);
    }
  });

  // 2. Daily alert job (every day at 9 AM)
  cron.schedule('0 9 * * *', async () => {
    console.log('[CRON] Checking for upcoming renewals (24h)...');
    try {
      let leadDays = 1;
      const settings = await prisma.appSettings.findUnique({ where: { id: "default" } });
      if (settings) {
        leadDays = settings.alertLeadDays;
      }

      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + leadDays);
      
      const targetStart = new Date(targetDate.setHours(0, 0, 0, 0));
      const targetEnd = new Date(targetDate.setHours(23, 59, 59, 999));

      const upcomingRenewals = await prisma.subscription.findMany({
        where: {
          nextRenewalDate: {
            gte: targetStart,
            lte: targetEnd
          },
          status: 'ACTIVE'
        }
      });

      for (const sub of upcomingRenewals) {
        console.log(`[ALERT] Upcoming renewal for ${sub.merchantName || sub.name}: ${sub.amount} ${sub.currency}`);
        await sendAlert(sub);
      }
    } catch (err) {
      console.error('[CRON] Daily alert error:', err);
    }
  });
}
