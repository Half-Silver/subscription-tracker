import { Router } from 'express';
import prisma from '../db';
import { encrypt } from '../utils/encryption';
import { ImapFlow } from 'imapflow';
import { processAccountEmails } from '../mail/fetcher';

const router = Router();

// Get all connected accounts
router.get('/', async (req, res) => {
  try {
    const accounts = await prisma.connectedAccount.findMany();
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
  } catch (err) {
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
  const client = new ImapFlow({
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
    const account = await prisma.connectedAccount.create({
      data: {
        email,
        password: encrypt(password),
        imapHost,
        imapPort,
        smtpHost,
        smtpPort
      }
    });

    // Start IDLE listener for the new account immediately
    import('../mail/idleManager').then(m => m.startIdleForAccount(account.id)).catch(console.error);

    res.json({ success: true, account: { id: account.id, email: account.email } });
  } catch (err: any) {
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
    processAccountEmails(id, sinceDate).catch(err => {
      console.error(`Background backfill failed for account ${id}:`, err);
    });
    res.json({ success: true, message: `Backfill started for the last ${days} days in the background` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to start backfill' });
  }
});

// Delete account
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.connectedAccount.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;
