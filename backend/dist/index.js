"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const db_1 = __importDefault(require("./db"));
const cors_1 = __importDefault(require("cors"));
const subscriptions_1 = __importDefault(require("./api/subscriptions"));
const paymentMethods_1 = __importDefault(require("./api/paymentMethods"));
const accounts_1 = __importDefault(require("./api/accounts"));
const ingest_1 = __importDefault(require("./api/ingest"));
const scheduler_1 = require("./scheduler");
const fetcher_1 = require("./mail/fetcher");
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/subscriptions', subscriptions_1.default);
app.use('/payment-methods', paymentMethods_1.default);
app.use('/accounts', accounts_1.default);
app.use('/ingest', ingest_1.default);
app.post('/sync', async (req, res) => {
    try {
        const accounts = await db_1.default.connectedAccount.findMany();
        let count = 0;
        for (const account of accounts) {
            await (0, fetcher_1.processAccountEmails)(account.id);
            count++;
        }
        res.json({ success: true, accountsSynced: count });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to sync accounts' });
    }
});
app.get('/settings', async (req, res) => {
    try {
        let settings = await db_1.default.appSettings.findUnique({ where: { id: "default" } });
        if (!settings) {
            settings = await db_1.default.appSettings.create({ data: { id: "default" } });
        }
        res.json(settings);
    }
    catch (err) {
        res.status(500).json({ error: "Failed to fetch settings" });
    }
});
app.put('/settings', async (req, res) => {
    try {
        const { alertLeadDays, notify, smtpSenderAccountId, largeChargeThreshold } = req.body;
        const updated = await db_1.default.appSettings.upsert({
            where: { id: "default" },
            create: { id: "default", alertLeadDays, notify, smtpSenderAccountId, largeChargeThreshold },
            update: { alertLeadDays, notify, smtpSenderAccountId, largeChargeThreshold },
        });
        res.json(updated);
    }
    catch (err) {
        res.status(500).json({ error: "Failed to update settings" });
    }
});
app.get('/alerts', async (req, res) => {
    try {
        const alerts = await db_1.default.alert.findMany({ orderBy: { createdAt: 'desc' } });
        const mapped = alerts.map(a => ({
            id: a.id,
            type: a.type,
            title: a.title,
            body: a.body,
            isRead: a.isRead,
            date: a.createdAt.toISOString(),
            actionLink: a.actionLink || undefined,
        }));
        res.json(mapped);
    }
    catch (err) {
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to export database" });
    }
});
app.get('/dashboard/summary', async (req, res) => {
    try {
        const subs = await db_1.default.subscription.findMany({ include: { paymentMethod: true } });
        const alerts = await db_1.default.alert.findMany({ where: { isRead: false } });
        let totalMonthlySpend = 0;
        let activeCount = 0;
        let nextCharge = null;
        for (const sub of subs) {
            if (sub.status === 'ACTIVE' || sub.status === 'RENEWING_SOON') {
                activeCount++;
                if (sub.billingCycle === 'YEARLY') {
                    totalMonthlySpend += sub.amount / 12;
                }
                else if (sub.billingCycle === 'WEEKLY') {
                    totalMonthlySpend += sub.amount * 4.33;
                }
                else {
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
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch summary' });
    }
});
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
app.listen(port, () => {
    console.log(`Backend server running on port ${port}`);
    (0, scheduler_1.startScheduler)();
});
