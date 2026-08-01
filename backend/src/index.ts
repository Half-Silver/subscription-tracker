import 'dotenv/config';
import express from 'express';
import prisma from './db';
import cors from 'cors';
import subscriptionsRouter from './api/subscriptions';
import paymentMethodsRouter from './api/paymentMethods';
import accountsRouter from './api/accounts';
import ingestRouter from './api/ingest';
import { startScheduler } from './scheduler';
import { processAccountEmails } from './mail/fetcher';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/subscriptions', subscriptionsRouter);
app.use('/payment-methods', paymentMethodsRouter);
app.use('/accounts', accountsRouter);
app.use('/ingest', ingestRouter);

app.post('/sync', async (req, res) => {
  try {
    const accounts = await prisma.connectedAccount.findMany();
    let count = 0;
    for (const account of accounts) {
      await processAccountEmails(account.id);
      count++;
    }
    res.json({ success: true, accountsSynced: count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to sync accounts' });
  }
});

app.get('/settings', async (req, res) => {
  try {
    let settings = await prisma.appSettings.findUnique({ where: { id: "default" } });
    if (!settings) {
      settings = await prisma.appSettings.create({ data: { id: "default" } });
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

app.put('/settings', async (req, res) => {
  try {
    const { alertLeadDays, notify, smtpSenderAccountId, largeChargeThreshold } = req.body;
    const updated = await prisma.appSettings.upsert({
      where: { id: "default" },
      create: { id: "default", alertLeadDays, notify, smtpSenderAccountId, largeChargeThreshold },
      update: { alertLeadDays, notify, smtpSenderAccountId, largeChargeThreshold },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update settings" });
  }
});

app.get('/alerts', async (req, res) => {
  try {
    const alerts = await prisma.alert.findMany({ orderBy: { createdAt: 'desc' } });
    const mapped = alerts.map(a => ({
      id: a.id,
      type: a.type as any,
      title: a.title,
      body: a.body,
      isRead: a.isRead,
      date: a.createdAt.toISOString(),
      actionLink: a.actionLink || undefined,
    }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

app.post('/settings/export', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    const backupDir = path.join(os.homedir(), '.subscriptio', 'backups');
    fs.mkdirSync(backupDir, { recursive: true });
    
    const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
    const backupName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.db`;
    const destPath = path.join(backupDir, backupName);
    
    fs.copyFileSync(dbPath, destPath);
    res.json({ success: true, path: destPath });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to export database" });
  }
});

app.get('/dashboard/summary', async (req, res) => {
  try {
    const subs = await prisma.subscription.findMany({ include: { paymentMethod: true } });
    const alerts = await prisma.alert.findMany({ where: { isRead: false } });
    
    let totalMonthlySpend = 0;
    let activeCount = 0;
    let nextCharge: any = null;
    
    for (const sub of subs) {
      if (sub.status === 'ACTIVE' || sub.status === 'RENEWING_SOON') {
        activeCount++;
        if (sub.billingCycle === 'YEARLY') {
          totalMonthlySpend += sub.amount / 12;
        } else if (sub.billingCycle === 'WEEKLY') {
          totalMonthlySpend += sub.amount * 4.33;
        } else {
          totalMonthlySpend += sub.amount;
        }
      }
      
      if (sub.nextRenewalDate && sub.nextRenewalDate > new Date()) {
        if (!nextCharge || sub.nextRenewalDate < nextCharge.date) {
          nextCharge = { name: sub.name, amount: sub.amount, date: sub.nextRenewalDate };
        }
      }
    }
    
    res.json({ totalMonthlySpend, activeCount, nextCharge, alertCount: alerts.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
  startScheduler();
});
