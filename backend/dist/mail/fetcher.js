"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processAccountEmails = processAccountEmails;
exports.handleExtractedData = handleExtractedData;
const imapflow_1 = require("imapflow");
const mailparser_1 = require("mailparser");
const db_1 = __importDefault(require("../db"));
const encryption_1 = require("../utils/encryption");
const extractor_1 = require("../llm/extractor");
async function processAccountEmails(accountId, sinceDateOverride) {
    const account = await db_1.default.connectedAccount.findUnique({ where: { id: accountId } });
    if (!account)
        throw new Error('Account not found');
    const client = new imapflow_1.ImapFlow({
        host: account.imapHost,
        port: account.imapPort,
        secure: true,
        auth: {
            user: account.email,
            pass: (0, encryption_1.decrypt)(account.password)
        },
        logger: false
    });
    await client.connect();
    // Select the inbox
    const lock = await client.getMailboxLock('INBOX');
    try {
        // Determine the date to search from. If override is provided, use it. Otherwise use lastSyncAt or default 30 days.
        const sinceDate = sinceDateOverride
            ? sinceDateOverride
            : (account.lastSyncAt ? account.lastSyncAt : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
        // Search for emails containing keywords like "receipt", "subscription", "invoice"
        // Note: complex OR searches vary by IMAP server. We'll do a simple since date and subject filter client side,
        // or just fetch all recent and filter.
        const searchOptions = { since: sinceDate };
        for await (const message of client.fetch(searchOptions, { envelope: true, source: true })) {
            const subject = message.envelope?.subject || '';
            const isLikelyReceipt = /receipt|invoice|payment|subscription|renew|order/i.test(subject);
            if (isLikelyReceipt && message.source) {
                const parsed = await (0, mailparser_1.simpleParser)(message.source);
                const textBody = parsed.text || parsed.html || '';
                console.log(`Analyzing email: ${subject}`);
                const extraction = await (0, extractor_1.extractSubscriptionDetails)(subject, textBody);
                if (extraction && extraction.merchantName && extraction.amount > 0) {
                    console.log('Extracted Subscription:', extraction);
                    await handleExtractedData(extraction, parsed.messageId || message.uid.toString(), parsed.date || new Date());
                }
            }
        }
        // Update lastSyncAt
        await db_1.default.connectedAccount.update({
            where: { id: account.id },
            data: { lastSyncAt: new Date() }
        });
    }
    finally {
        lock.release();
        await client.logout();
    }
}
async function handleExtractedData(data, emailId, emailDate) {
    let paymentMethodId = null;
    if (data.paymentMethod) {
        const parts = data.paymentMethod.trim().split(' ');
        let last4 = parts.length > 1 ? parts.pop() : data.paymentMethod;
        if (!last4)
            last4 = data.paymentMethod;
        const name = parts.length > 0 ? parts.join(' ') : data.paymentMethod;
        let pm = await db_1.default.paymentMethod.findFirst({
            where: { last4 }
        });
        if (!pm) {
            pm = await db_1.default.paymentMethod.create({
                data: { name, last4 }
            });
        }
        paymentMethodId = pm.id;
    }
    // Case insensitive match
    const subscriptions = await db_1.default.subscription.findMany();
    let subscription = subscriptions.find(s => s.merchantName?.toLowerCase() === data.merchantName.toLowerCase());
    let action = 'none';
    if (subscription) {
        let status = subscription.status;
        let nextRenewalDate = subscription.nextRenewalDate;
        if (data.eventType === 'charge_confirmed') {
            status = 'ACTIVE';
            if (nextRenewalDate) {
                const d = new Date(nextRenewalDate);
                if (data.billingCycle === 'MONTHLY')
                    d.setMonth(d.getMonth() + 1);
                else if (data.billingCycle === 'YEARLY')
                    d.setFullYear(d.getFullYear() + 1);
                nextRenewalDate = d;
            }
            else {
                const d = new Date(emailDate);
                if (data.billingCycle === 'MONTHLY')
                    d.setMonth(d.getMonth() + 1);
                else if (data.billingCycle === 'YEARLY')
                    d.setFullYear(d.getFullYear() + 1);
                nextRenewalDate = d;
            }
            action = 'updated_charge';
        }
        else if (data.eventType === 'pre_debit_alert') {
            status = 'RENEWING_SOON';
            action = 'updated_pre_debit';
        }
        else if (data.eventType === 'charge_failed') {
            status = 'FAILED';
            action = 'updated_failed';
        }
        if (data.amount !== subscription.amount && data.eventType !== 'charge_failed') {
            await db_1.default.alert.create({
                data: {
                    type: "price_change",
                    title: `Price Changed: ${data.merchantName}`,
                    body: `The amount changed from ${subscription.amount} to ${data.amount} ${data.currency}.`,
                    actionLink: `/subscriptions/${subscription.id}`,
                }
            });
            action = 'price_changed';
        }
        subscription = await db_1.default.subscription.update({
            where: { id: subscription.id },
            data: {
                status,
                amount: data.amount,
                nextRenewalDate,
                ...(paymentMethodId && { paymentMethodId })
            }
        });
    }
    else if (data.eventType === 'charge_confirmed') {
        let nextRenewalDate = data.nextRenewalDate ? new Date(data.nextRenewalDate) : null;
        if (!nextRenewalDate) {
            const d = new Date(emailDate);
            if (data.billingCycle === 'MONTHLY')
                d.setMonth(d.getMonth() + 1);
            else if (data.billingCycle === 'YEARLY')
                d.setFullYear(d.getFullYear() + 1);
            nextRenewalDate = d;
        }
        subscription = await db_1.default.subscription.create({
            data: {
                name: data.merchantName,
                merchantName: data.merchantName,
                amount: data.amount,
                currency: data.currency,
                billingCycle: data.billingCycle,
                nextRenewalDate,
                status: 'ACTIVE',
                ...(paymentMethodId && { paymentMethodId })
            }
        });
        action = 'created';
    }
    if (subscription) {
        await db_1.default.renewalEvent.create({
            data: {
                subscriptionId: subscription.id,
                amount: data.amount,
                currency: data.currency,
                date: emailDate,
                emailId: emailId
            }
        });
        const settings = await db_1.default.appSettings.findUnique({ where: { id: "default" } });
        const threshold = settings?.largeChargeThreshold || 5000;
        if (data.amount >= threshold) {
            await db_1.default.alert.create({
                data: {
                    type: "large_charge",
                    title: `Large Charge Detected: ${data.merchantName}`,
                    body: `A charge of ${data.amount} ${data.currency} was processed for ${data.merchantName}.`,
                    actionLink: `/subscriptions/${subscription.id}`,
                }
            });
        }
    }
    return { action, subscription, eventType: data.eventType };
}
