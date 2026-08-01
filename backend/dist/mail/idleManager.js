"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startIdleForAccount = startIdleForAccount;
exports.initializeAllIdleConnections = initializeAllIdleConnections;
exports.stopIdleForAccount = stopIdleForAccount;
const imapflow_1 = require("imapflow");
const db_1 = __importDefault(require("../db"));
const encryption_1 = require("../utils/encryption");
const fetcher_1 = require("./fetcher");
// Store active connections so we can close them later if needed
const activeConnections = new Map();
async function startIdleForAccount(accountId) {
    const account = await db_1.default.connectedAccount.findUnique({ where: { id: accountId } });
    if (!account)
        return;
    if (activeConnections.has(accountId)) {
        // Already running
        return;
    }
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
    activeConnections.set(accountId, client);
    try {
        await client.connect();
        // Select inbox and enter IDLE
        await client.mailboxOpen('INBOX');
        console.log(`[IDLE] Started listening for ${account.email}`);
        // Listen for new messages
        client.on('exists', async (data) => {
            console.log(`[IDLE] New mail for ${account.email}. Processing...`);
            // Since fetcher creates its own connection, it won't interrupt this IDLE state.
            await (0, fetcher_1.processAccountEmails)(accountId).catch(err => {
                console.error(`[IDLE] Fetch error for ${account.email}:`, err);
            });
        });
        client.on('error', (err) => {
            console.error(`[IDLE] Error for ${account.email}:`, err);
            activeConnections.delete(accountId);
            client.close();
        });
    }
    catch (err) {
        console.error(`[IDLE] Failed to start IDLE for ${account.email}`, err);
        activeConnections.delete(accountId);
    }
}
async function initializeAllIdleConnections() {
    const accounts = await db_1.default.connectedAccount.findMany();
    for (const account of accounts) {
        await startIdleForAccount(account.id);
    }
}
async function stopIdleForAccount(accountId) {
    const client = activeConnections.get(accountId);
    if (client) {
        await client.logout();
        activeConnections.delete(accountId);
        console.log(`[IDLE] Stopped listening for account ${accountId}`);
    }
}
