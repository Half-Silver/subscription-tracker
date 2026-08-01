import { ImapFlow } from 'imapflow';
import prisma from '../db';
import { decrypt } from '../utils/encryption';
import { processAccountEmails } from './fetcher';

// Store active connections so we can close them later if needed
const activeConnections: Map<string, ImapFlow> = new Map();

export async function startIdleForAccount(accountId: string) {
  const account = await prisma.connectedAccount.findUnique({ where: { id: accountId } });
  if (!account) return;

  if (activeConnections.has(accountId)) {
    // Already running
    return;
  }

  const client = new ImapFlow({
    host: account.imapHost,
    port: account.imapPort,
    secure: true,
    auth: {
      user: account.email,
      pass: decrypt(account.password)
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
      await processAccountEmails(accountId).catch(err => {
        console.error(`[IDLE] Fetch error for ${account.email}:`, err);
      });
    });

    client.on('error', (err) => {
      console.error(`[IDLE] Error for ${account.email}:`, err);
      activeConnections.delete(accountId);
      client.close();
    });

  } catch (err) {
    console.error(`[IDLE] Failed to start IDLE for ${account.email}`, err);
    activeConnections.delete(accountId);
  }
}

export async function initializeAllIdleConnections() {
  const accounts = await prisma.connectedAccount.findMany();
  for (const account of accounts) {
    await startIdleForAccount(account.id);
  }
}

export async function stopIdleForAccount(accountId: string) {
  const client = activeConnections.get(accountId);
  if (client) {
    await client.logout();
    activeConnections.delete(accountId);
    console.log(`[IDLE] Stopped listening for account ${accountId}`);
  }
}
