import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import fs from 'fs';
import path from 'path';

const ACCOUNTS_FILE = path.resolve(process.cwd(), 'accounts.json');

if (!fs.existsSync(ACCOUNTS_FILE)) {
  console.error("❌ Cannot find accounts.json.");
  console.error("Please create an accounts.json file with an array of { user, pass } objects.");
  process.exit(1);
}

const accounts = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));

if (!Array.isArray(accounts) || accounts.length === 0) {
  console.error("❌ accounts.json must be an array of account objects with 'user' and 'pass' fields.");
  process.exit(1);
}

async function syncEmails() {
  for (const account of accounts) {
    const { user, pass } = account;
    if (!user || !pass) {
      console.warn(`Skipping invalid account entry: ${JSON.stringify(account)}`);
      continue;
    }

    console.log(`\n================================`);
    console.log(`Connecting to IMAP for ${user}...`);

    const client = new ImapFlow({
      host: 'imap.gmail.com',
      port: 993,
      secure: true,
      auth: { user, pass },
      logger: false 
    });

    try {
      await client.connect();
      console.log(`✅ Connected to ${user}!`);
      
      let lock = await client.getMailboxLock('INBOX');
      try {
        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - 14);

        const searchResult = await client.search({
           since: sinceDate,
           or: [ { text: 'debited' }, { text: 'will be charged' } ]
        });

        console.log(`Found ${searchResult.length} matching emails for ${user}.`);

        if (searchResult.length > 0) {
          const recentSequence = searchResult.slice(-5).join(',');
          
          for await (let message of client.fetch(recentSequence, { source: true })) {
             const parsed = await simpleParser(message.source);
             const emailBody = parsed.text || '';
             
             console.log(`Sending to API for parsing: "${parsed.subject}"`);
             try {
               const res = await fetch('http://localhost:3000/api/ingest', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ emailText: emailBody })
               });
               const data = await res.json();
               if (data.success) {
                  console.log(`  ✅ Success: ${data.action} subscription for ${data.data?.merchant}`);
               } else {
                  console.log(`  ❌ Skipped: Could not parse.`);
               }
             } catch (err) {
               console.error('  Failed to send to API. Is Next.js running on port 3000?', err);
             }
          }
        }
      } finally {
        lock.release();
      }
    } catch (err) {
      console.error(`❌ Connection error for ${user}:`, err);
    } finally {
      await client.logout();
      console.log(`Logged out of ${user}.`);
    }
  }
}

syncEmails().catch(console.error);
