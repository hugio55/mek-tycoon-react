import { test, expect } from '@playwright/test';

test.describe('System Functionality Check', () => {
  test('Port 3100 - Load and capture initial state', async ({ page }) => {
    // Listen for console messages
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

    // Try to load the page with extended timeout
    try {
      await page.goto('http://localhost:3100', {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      // Wait a bit for any immediate errors
      await page.waitForTimeout(3000);

      // Capture screenshot
      await page.screenshot({
        path: 'tests/screenshots/port-3100-initial.png',
        fullPage: true
      });

      // Check for critical elements
      const bodyText = await page.textContent('body').catch(() => 'Failed to get body text');

      console.log('=== PORT 3100 STATUS ===');
      console.log('Page loaded successfully');
      console.log(`Body content length: ${bodyText?.length || 0} characters`);
      console.log(`Console messages: ${consoleMessages.length}`);
      console.log(`Console errors: ${consoleErrors.length}`);
      console.log(`Page errors: ${pageErrors.length}`);

      if (consoleErrors.length > 0) {
        console.log('\n=== CONSOLE ERRORS ===');
        consoleErrors.forEach(err => console.log(err));
      }

      if (pageErrors.length > 0) {
        console.log('\n=== PAGE ERRORS ===');
        pageErrors.forEach(err => console.log(err));
      }

      // Log first 20 console messages for context
      console.log('\n=== RECENT CONSOLE MESSAGES ===');
      consoleMessages.slice(0, 20).forEach(msg => console.log(msg));

    } catch (error) {
      console.error('=== FAILED TO LOAD PORT 3100 ===');
      console.error(error);

      // Try to capture screenshot even on error
      await page.screenshot({
        path: 'tests/screenshots/port-3100-error.png',
        fullPage: true
      }).catch(() => console.log('Could not capture error screenshot'));

      throw error;
    }
  });

  test('Port 3200 - Attempt to load', async ({ page }) => {
    console.log('=== ATTEMPTING PORT 3200 ===');

    try {
      await page.goto('http://localhost:3200', {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });

      await page.screenshot({
        path: 'tests/screenshots/port-3200-initial.png',
        fullPage: true
      });

      console.log('Port 3200 loaded successfully');
    } catch (error) {
      console.log('Port 3200 is not accessible (expected if not running)');
      console.log(error);
    }
  });
});
