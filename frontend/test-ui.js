import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const targetUrl = 'http://localhost:8080/';
  console.log(`Navigating to ${targetUrl}...`);
  await page.goto(targetUrl);
  
  // Wait a bit for React to hydrate
  await page.waitForTimeout(2000);
  
  // Find all buttons
  const buttons = await page.locator('button').all();
  console.log(`Found ${buttons.length} buttons on the Dashboard.`);
  
  for (let i = 0; i < buttons.length; i++) {
    const btn = buttons[i];
    const text = await btn.textContent();
    console.log(`\nTesting button: "${text?.trim()}"`);
    try {
      // Just click it and see if anything breaks
      await btn.click({ timeout: 2000 });
      console.log(`  -> Clicked successfully.`);
      await page.waitForTimeout(500); // Give it a sec to settle
    } catch (e) {
      console.error(`  -> Failed to click: ${e.message}`);
    }
  }

  // Go to Accounts page and test those buttons
  console.log('\nNavigating to Accounts page...');
  await page.goto('http://localhost:8080/accounts');
  await page.waitForTimeout(2000);

  const accButtons = await page.locator('button').all();
  console.log(`Found ${accButtons.length} buttons on Accounts page.`);
  for (let i = 0; i < accButtons.length; i++) {
    const btn = accButtons[i];
    const text = await btn.textContent();
    console.log(`\nTesting button: "${text?.trim()}"`);
    try {
      await btn.click({ timeout: 2000 });
      console.log(`  -> Clicked successfully.`);
      await page.waitForTimeout(500);
    } catch (e) {
      console.error(`  -> Failed to click: ${e.message}`);
    }
  }

  await browser.close();
})();
