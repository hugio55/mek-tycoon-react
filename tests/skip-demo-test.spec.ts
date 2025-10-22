import { test, expect } from '@playwright/test';

test.describe('Skip Demo Mode Button Test', () => {
  test('Port 3100 - Click Skip Demo and navigate', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    console.log('=== PORT 3100 - SKIP DEMO TEST ===');

    await page.goto('http://localhost:3100', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Find and click the Skip Demo Mode button
    const skipButton = page.locator('text=SKIP (DEMO MODE)');
    await skipButton.waitFor({ state: 'visible', timeout: 5000 });
    await skipButton.click();

    console.log('Clicked SKIP (DEMO MODE) button');

    // Wait for navigation
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'tests/screenshots/3100-after-skip.png', fullPage: true });

    const currentUrl = page.url();
    console.log(`Current URL after skip: ${currentUrl}`);

    // Try clicking HUB button
    try {
      const hubButton = page.locator('text=HUB').first();
      await hubButton.waitFor({ state: 'visible', timeout: 5000 });
      await hubButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'tests/screenshots/3100-hub-page.png', fullPage: true });
      console.log('Successfully navigated to HUB');
    } catch (e) {
      console.log('Could not navigate to HUB:', e);
    }

    console.log(`Total console errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log('Errors:', consoleErrors.slice(0, 5));
    }
  });

  test('Port 3200 - Click Skip Demo and navigate', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    console.log('=== PORT 3200 - SKIP DEMO TEST ===');

    await page.goto('http://localhost:3200', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    // Find and click the Skip Demo Mode button
    const skipButton = page.locator('text=SKIP (DEMO MODE)');
    const isVisible = await skipButton.isVisible().catch(() => false);

    if (!isVisible) {
      console.log('Skip button not visible, waiting longer...');
      await page.waitForTimeout(5000);
    }

    await skipButton.waitFor({ state: 'visible', timeout: 10000 });
    await skipButton.click();

    console.log('Clicked SKIP (DEMO MODE) button');

    // Wait for navigation
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'tests/screenshots/3200-after-skip.png', fullPage: true });

    const currentUrl = page.url();
    console.log(`Current URL after skip: ${currentUrl}`);

    // Try clicking HUB button
    try {
      const hubButton = page.locator('text=HUB').first();
      await hubButton.waitFor({ state: 'visible', timeout: 5000 });
      await hubButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'tests/screenshots/3200-hub-page.png', fullPage: true });
      console.log('Successfully navigated to HUB');
    } catch (e) {
      console.log('Could not navigate to HUB:', e);
    }

    console.log(`Total console errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log('Errors:', consoleErrors.slice(0, 5));
    }
  });
});
