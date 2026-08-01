"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const encryption_1 = require("../utils/encryption");
const imapflow_1 = require("imapflow");
const fetcher_1 = require("../mail/fetcher");
const router = (0, express_1.Router)();
// Get all connected accounts
router.get('/', async (req, res) => {
    try {
        const accounts = await db_1.default.connectedAccount.findMany();
        const mapped = accounts.map(a => ({
            id: a.id,
            email: a.email,
            status: "connected",
            lastSynced: a.lastSyncAt ? a.lastSyncAt.toISOString() : new Date().toISOString(),
            imapHost: a.imapHost,
            imapPort: a.imapPort,
            smtpHost: a.smtpHost,
            smtpPort: a.smtpPort,
            idleHealth: "live",
            isSmtpSender: false,
        }));
        res.json(mapped);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch accounts' });
    }
});
// Connect (add) a new account
router.post('/connect', async (req, res) => {
    const { email, password, imapHost = 'imap.gmail.com', imapPort = 993, smtpHost = 'smtp.gmail.com', smtpPort = 465 } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    // Test IMAP connection
    const client = new imapflow_1.ImapFlow({
        host: imapHost,
        port: imapPort,
        secure: true,
        auth: {
            user: email,
            pass: password
        },
        logger: false
    });
    try {
        await client.connect();
        await client.logout();
        // Store in DB
        const account = await db_1.default.connectedAccount.create({
            data: {
                email,
                password: (0, encryption_1.encrypt)(password),
                imapHost,
                imapPort,
                smtpHost,
                smtpPort
            }
        });
        // Start IDLE listener for the new account immediately
        Promise.resolve().then(() => __importStar(require('../mail/idleManager'))).then(m => m.startIdleForAccount(account.id)).catch(console.error);
        res.json({ success: true, account: { id: account.id, email: account.email } });
    }
    catch (err) {
        console.error('IMAP Connection failed:', err);
        res.status(401).json({ error: 'Failed to authenticate with IMAP server. Check credentials or enable App Passwords.' });
    }
});
// Backfill / sync emails manually
router.post('/:id/backfill', async (req, res) => {
    const { id } = req.params;
    const { days = 365 } = req.body; // Default backfill goes back 1 year
    try {
        const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        // We don't await this completely so the request doesn't hang
        (0, fetcher_1.processAccountEmails)(id, sinceDate).catch(err => {
            console.error(`Background backfill failed for account ${id}:`, err);
        });
        res.json({ success: true, message: `Backfill started for the last ${days} days in the background` });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to start backfill' });
    }
});
// Delete account
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db_1.default.connectedAccount.delete({ where: { id } });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to delete account' });
    }
});
exports.default = router;
