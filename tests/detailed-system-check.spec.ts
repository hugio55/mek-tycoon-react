import { test, expect } from '@playwright/test';

test.describe('Detailed System Comparison', () => {
  test('Port 3100 - Navigate and test functionality', async ({ page }) => {
    const consoleMessages: string[] = [];
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(`[${msg.type()}] ${text}`);
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
    });

    page.on('pageerror', exception => {
      pageErrors.push(exception.message);
    });

    console.log('=== PORT 3100 INVESTIGATION ===');

    // Try loading root
    await page.goto('http://localhost:3100', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/screenshots/3100-root.png', fullPage: true });

    const rootText = await page.textContent('body');
    console.log(`Root page text includes: ${rootText?.substring(0, 100)}`);

    // Try /hub
    try {
      await page.goto('http://localhost:3100/hub', { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'tests/screenshots/3100-hub.png', fullPage: true });
      console.log('Hub page loaded successfully');
    } catch (e) {
      console.log('Hub page failed:', e);
    }

    // Try /profile
    try {
      await page.goto('http://localhost:3100/profile', { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'tests/screenshots/3100-profile.png', fullPage: true });
      console.log('Profile page loaded successfully');
    } catch (e) {
      console.log('Profile page failed:', e);
    }

    console.log(`Total console errors on 3100: ${consoleErrors.length}`);
    console.log(`Total page errors on 3100: ${pageErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log('Sample errors:', consoleErrors.slice(0, 3));
    }
  });

  test('Port 3200 - Navigate and test functionality', async ({ page }) => {
    const consoleMessages: string[] = [];
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(`[${msg.type()}] ${text}`);
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
    });

    page.on('pageerror', exception => {
      pageErrors.push(exception.message);
    });

    console.log('=== PORT 3200 INVESTIGATION ===');

    await page.goto('http://localhost:3200', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for loading screen
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'tests/screenshots/3200-loading.png', fullPage: true });

    // Check if loading continues or if there's a button to click
    const bodyText = await page.textContent('body');
    console.log(`Loading screen shows: ${bodyText?.substring(0, 200)}`);

    // Wait longer to see if it transitions
    await page.waitForTimeout(10000);
    await page.screenshot({ path: 'tests/screenshots/3200-after-wait.png', fullPage: true });

    const bodyTextAfter = await page.textContent('body');
    console.log(`After 10s wait: ${bodyTextAfter?.substring(0, 200)}`);

    // Try clicking anywhere to bypass loading
    try {
      await page.click('body');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'tests/screenshots/3200-after-click.png', fullPage: true });
    } catch (e) {
      console.log('Click failed:', e);
    }

    console.log(`Total console errors on 3200: ${consoleErrors.length}`);
    console.log(`Total page errors on 3200: ${pageErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log('Sample errors:', consoleErrors.slice(0, 3));
    }

    // Log all console messages for debugging
    console.log('\n=== ALL CONSOLE MESSAGES (3200) ===');
    consoleMessages.slice(0, 30).forEach(msg => console.log(msg));
  });
});
