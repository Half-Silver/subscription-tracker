"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startScheduler = startScheduler;
const node_cron_1 = __importDefault(require("node-cron"));
const db_1 = __importDefault(require("../db"));
const fetcher_1 = require("../mail/fetcher");
const idleManager_1 = require("../mail/idleManager");
const sender_1 = require("../mail/sender");
function startScheduler() {
    console.log('Starting background scheduler...');
    // Start IDLE connections on boot
    (0, idleManager_1.initializeAllIdleConnections)().catch(console.error);
    // 1. Fallback poll job (every 30 minutes)
    node_cron_1.default.schedule('*/30 * * * *', async () => {
        console.log('[CRON] Running fallback poll for all accounts...');
        try {
            const accounts = await db_1.default.connectedAccount.findMany();
            for (const account of accounts) {
                await (0, fetcher_1.processAccountEmails)(account.id).catch(err => {
                    console.error(`Fallback poll failed for ${account.email}:`, err);
                });
            }
        }
        catch (err) {
            console.error('[CRON] Fallback poll error:', err);
        }
    });
    // 2. Daily alert job (every day at 9 AM)
    node_cron_1.default.schedule('0 9 * * *', async () => {
        console.log('[CRON] Checking for upcoming renewals (24h)...');
        try {
            let leadDays = 1;
            const settings = await db_1.default.appSettings.findUnique({ where: { id: "default" } });
            if (settings) {
                leadDays = settings.alertLeadDays;
            }
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + leadDays);
            const targetStart = new Date(targetDate.setHours(0, 0, 0, 0));
            const targetEnd = new Date(targetDate.setHours(23, 59, 59, 999));
            const upcomingRenewals = await db_1.default.subscription.findMany({
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
                await (0, sender_1.sendAlert)(sub);
            }
        }
        catch (err) {
            console.error('[CRON] Daily alert error:', err);
        }
    });
}
