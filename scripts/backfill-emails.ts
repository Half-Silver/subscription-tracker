import { chromium } from 'playwright';
import path from 'path';

const accountName = process.argv[2] || 'default';
const USER_DATA_DIR = path.resolve(process.cwd(), `.playwright-session-${accountName}`);

async function backfillEmails() {
  console.log(`Launching browser for historical backfill on account: ${accountName}...`);
  
  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: false, 
    viewport: { width: 1280, height: 720 },
    channel: 'chrome',
    ignoreDefaultArgs: ['--enable-automation'],
  });

  const page = await context.newPage();
  
  console.log('Navigating to Gmail...');
  await page.goto('https://mail.google.com/');
  
  try {
    await page.waitForSelector('div[role="main"]', { timeout: 10000 });
  } catch (e) {
    console.log('Please sign in to Gmail in the browser window. Waiting...');
    await page.waitForSelector('div[role="main"]', { timeout: 300000 });
  }

  // Broad search for historical subscriptions
  const searchQuery = '"debited" OR "will be charged" OR "thank you for your payment"';
  console.log(`Searching for: ${searchQuery}`);
  
  const searchInput = await page.waitForSelector('input[aria-label="Search in mail"]');
  await searchInput?.fill(searchQuery);
  await searchInput?.press('Enter');

  await page.waitForTimeout(5000); // Wait for results

  const emailRows = await page.$$('tr[role="row"]');
  console.log(`Found ${emailRows.length} emails on the first page. Processing up to 10 for backfill...`);
  
  // Iterate through a batch to backfill
  const limit = Math.min(emailRows.length, 10);
  for (let i = 0; i < limit; i++) {
    // We must re-query the rows because DOM changes when navigating back
    const currentRows = await page.$$('tr[role="row"]');
    if (!currentRows[i]) continue;

    console.log(`Opening email ${i + 1}...`);
    await currentRows[i].click();
    await page.waitForTimeout(2000); 
    
    const emailBody = await page.evaluate(() => {
      const bodyNode = document.querySelector('div.a3s');
      return bodyNode ? (bodyNode as HTMLElement).innerText : null;
    });

    if (emailBody) {
      console.log(`Sending email ${i + 1} to LM Studio API...`);
      try {
        const res = await fetch('http://localhost:3000/api/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailText: emailBody })
        });
        const data = await res.json();
        if (data.success) {
           console.log(`✅ Success: ${data.action} subscription for ${data.data?.merchant}`);
        } else {
           console.log(`❌ Skipped: Could not parse.`);
        }
      } catch (err) {
        console.error('Failed API call:', err);
      }
    }
    
    // Go back to the search results
    await page.goBack();
    await page.waitForSelector('div[role="main"]', { timeout: 5000 });
    await page.waitForTimeout(1500); // Small pause for stability
  }

  console.log('Backfill batch complete! Closing browser...');
  await context.close();
}

backfillEmails().catch(console.error);
