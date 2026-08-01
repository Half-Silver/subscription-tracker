"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const extractor_1 = require("../llm/extractor");
const fetcher_1 = require("../mail/fetcher");
const crypto_1 = __importDefault(require("crypto"));
const router = (0, express_1.Router)();
router.post('/', async (req, res) => {
    const { emailText } = req.body;
    if (!emailText) {
        return res.status(400).json({ error: 'emailText is required' });
    }
    try {
        const extraction = await (0, extractor_1.extractSubscriptionDetails)('Ingested Email', emailText);
        if (!extraction) {
            return res.status(500).json({ error: 'Failed to extract data' });
        }
        const result = await (0, fetcher_1.handleExtractedData)(extraction, 'ingest-' + crypto_1.default.randomUUID(), new Date());
        res.json({ success: true, ...result });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to process email text' });
    }
});
router.post('/test', async (req, res) => {
    const { merchant, amount, currency, paymentMethod, eventType, date } = req.body;
    if (!merchant || amount == null || !currency || !eventType) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
        const extraction = {
            merchantName: merchant,
            amount: amount,
            currency: currency,
            billingCycle: 'UNKNOWN',
            eventType: eventType,
            paymentMethod: paymentMethod
        };
        const emailDate = date ? new Date(date) : new Date();
        const result = await (0, fetcher_1.handleExtractedData)(extraction, 'test-' + crypto_1.default.randomUUID(), emailDate);
        res.json({ success: true, ...result });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to process test data' });
    }
});
exports.default = router;
