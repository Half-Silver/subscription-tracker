"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const router = (0, express_1.Router)();
const mapPaymentMethod = (m) => ({
    id: m.id,
    label: m.name,
    type: "credit", // Default
    detail: m.last4 ? `${m.name} • ${m.last4}` : m.name,
});
// Get all payment methods
router.get('/', async (req, res) => {
    try {
        const methods = await db_1.default.paymentMethod.findMany();
        res.json(methods.map(mapPaymentMethod));
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch payment methods' });
    }
});
// Create a payment method
router.post('/', async (req, res) => {
    const { name, last4 } = req.body;
    try {
        const method = await db_1.default.paymentMethod.create({
            data: { name, last4 },
        });
        res.json(mapPaymentMethod(method));
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to create payment method' });
    }
});
// Update a payment method
router.patch('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, last4 } = req.body;
    try {
        const method = await db_1.default.paymentMethod.update({
            where: { id },
            data: { name, last4 },
        });
        res.json(mapPaymentMethod(method));
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to update payment method' });
    }
});
// Delete a payment method
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db_1.default.paymentMethod.delete({ where: { id } });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to delete payment method' });
    }
});
exports.default = router;
