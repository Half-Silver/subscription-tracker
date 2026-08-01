"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const router = (0, express_1.Router)();
const mapSubscription = (s) => ({
    id: s.id,
    name: s.name,
    category: "Software",
    amount: s.amount,
    cycle: s.billingCycle.toLowerCase(),
    nextRenewal: s.nextRenewalDate ? s.nextRenewalDate.toISOString() : new Date().toISOString(),
    status: s.status.toLowerCase(),
    paymentMethodId: s.paymentMethodId || "",
    accountId: null,
    history: (s.renewalEvents || []).map((e) => ({
        id: e.id,
        date: e.date.toISOString(),
        amount: e.amount,
        kind: "charged",
        note: e.emailSnippet,
    })),
});
// Get all subscriptions
router.get('/', async (req, res) => {
    try {
        const subs = await db_1.default.subscription.findMany({
            include: { paymentMethod: true, renewalEvents: true },
        });
        res.json(subs.map(mapSubscription));
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
});
// Create a subscription
router.post('/', async (req, res) => {
    const { name, merchantName, amount, currency, billingCycle, startDate, nextRenewalDate, status, paymentMethodId } = req.body;
    try {
        const sub = await db_1.default.subscription.create({
            data: {
                name,
                merchantName,
                amount,
                currency: currency || 'USD',
                billingCycle,
                startDate: startDate ? new Date(startDate) : null,
                nextRenewalDate: nextRenewalDate ? new Date(nextRenewalDate) : null,
                status: status || 'ACTIVE',
                paymentMethodId,
            },
            include: { paymentMethod: true, renewalEvents: true }
        });
        res.json(mapSubscription(sub));
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create subscription' });
    }
});
// Update a subscription
router.patch('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, merchantName, amount, currency, billingCycle, startDate, nextRenewalDate, status, paymentMethodId } = req.body;
    try {
        const sub = await db_1.default.subscription.update({
            where: { id },
            data: {
                name,
                merchantName,
                amount,
                currency,
                billingCycle,
                ...(startDate && { startDate: new Date(startDate) }),
                ...(nextRenewalDate && { nextRenewalDate: new Date(nextRenewalDate) }),
                status,
                paymentMethodId,
            },
            include: { paymentMethod: true, renewalEvents: true }
        });
        res.json(mapSubscription(sub));
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to update subscription' });
    }
});
// Delete a subscription
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db_1.default.subscription.delete({ where: { id } });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to delete subscription' });
    }
});
exports.default = router;
