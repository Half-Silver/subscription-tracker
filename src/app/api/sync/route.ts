import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs'; // Use nodejs runtime since we need fs and tcp sockets for IMAP

export async function POST() {
  try {
    const ACCOUNTS_FILE = path.resolve(process.cwd(), 'accounts.json');
    if (!fs.existsSync(ACCOUNTS_FILE)) {
      return NextResponse.json({ success: false, message: 'No accounts configured.' });
    }

    const accounts = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
    if (!Array.isArray(accounts) || accounts.length === 0) {
      return NextResponse.json({ success: false, message: 'No accounts configured.' });
    }

    let processedCount = 0;
    const logs = [];

    // Note: D1 bindings don't work natively in Node.js runtime for Next-on-Pages in dev,
    // but since we are running locally, we can just hit our own /api/ingest route like the script did!
    
    for (const account of accounts) {
      const { user, pass } = account;
      if (!user || !pass) continue;

      logs.push(`Connecting to IMAP for ${user}...`);

      const client = new ImapFlow({
        host: 'imap.gmail.com',
        port: 993,
        secure: true,
        auth: { user, pass },
        logger: false 
      });

      try {
        await client.connect();
        
        let lock = await client.getMailboxLock('INBOX');
        try {
          const sinceDate = new Date();
          sinceDate.setDate(sinceDate.getDate() - 14);

          const searchResult = await client.search({
             since: sinceDate,
             or: [ { text: 'debited' }, { text: 'will be charged' } ]
          });

          if (searchResult.length > 0) {
            const recentSequence = searchResult.slice(-5).join(',');
            
            for await (let message of client.fetch(recentSequence, { source: true })) {
               const parsed = await simpleParser(message.source);
               const emailBody = parsed.text || '';
               
               logs.push(`Sending to LLM API for parsing: "${parsed.subject}"`);
               
               // Hit our own ingest route
               const res = await fetch('http://localhost:3000/api/ingest', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ emailText: emailBody })
               });
               
               const data = await res.json();
               if (data.success) {
                  processedCount++;
                  logs.push(`Success: ${data.action} subscription for ${data.data?.merchant}`);
               } else {
                  logs.push(`Skipped: Could not parse.`);
               }
            }
          }
        } finally {
          lock.release();
        }
      } catch (err: any) {
        logs.push(`Connection error for ${user}: ${err.message}`);
      } finally {
        await client.logout();
      }
    }

    return NextResponse.json({ success: true, processedCount, logs });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
