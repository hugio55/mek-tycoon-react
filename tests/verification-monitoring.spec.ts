import { test, expect } from '@playwright/test';

test.describe('Wallet Verification Flow Monitoring', () => {
  test('Monitor console and network during verification attempt', async ({ page }) => {
    // Arrays to capture monitoring data
    const consoleMessages: Array<{ type: string; text: string; timestamp: number }> = [];
    const consoleErrors: Array<{ message: string; timestamp: number }> = [];
    const pageErrors: Array<{ message: string; timestamp: number }> = [];
    const networkRequests: Array<{
      url: string;
      method: string;
      timestamp: number;
      response?: any;
      duration?: number;
    }> = [];

    const startTime = Date.now();

    // Monitor console messages
    page.on('console', msg => {
      const timestamp = Date.now() - startTime;
      const text = msg.text();

      consoleMessages.push({
        type: msg.type(),
        text,
        timestamp
      });

      // Capture errors separately
      if (msg.type() === 'error') {
        consoleErrors.push({ message: text, timestamp });
      }

      // Log in real-time
      console.log(`[${timestamp}ms] [${msg.type().toUpperCase()}] ${text}`);
    });

    // Monitor page errors
    page.on('pageerror', exception => {
      const timestamp = Date.now() - startTime;
      const message = exception.message;

      pageErrors.push({ message, timestamp });
      console.log(`[${timestamp}ms] [PAGE ERROR] ${message}`);
    });

    // Monitor network requests
    page.on('request', request => {
      const timestamp = Date.now() - startTime;
      const url = request.url();

      // Only track Convex and API calls
      if (url.includes('convex.cloud') || url.includes('/api/')) {
        networkRequests.push({
          url,
          method: request.method(),
          timestamp
        });
        console.log(`[${timestamp}ms] [REQUEST] ${request.method()} ${url}`);
      }
    });

    page.on('response', async response => {
      const timestamp = Date.now() - startTime;
      const url = response.url();

      // Only track Convex and API calls
      if (url.includes('convex.cloud') || url.includes('/api/')) {
        try {
          const responseData = await response.json().catch(() => null);

          // Find matching request
          const request = networkRequests.find(r => r.url === url && !r.response);
          if (request) {
            request.response = responseData;
            request.duration = timestamp - request.timestamp;
          }

          console.log(`[${timestamp}ms] [RESPONSE] ${response.status()} ${url}`);
          if (responseData) {
            console.log(`  Data:`, JSON.stringify(responseData, null, 2));
          }
        } catch (e) {
          console.log(`[${timestamp}ms] [RESPONSE] ${response.status()} ${url} (non-JSON)`);
        }
      }
    });

    // Navigate to the page
    console.log('\n=== NAVIGATING TO PAGE ===\n');
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
    console.log(`\n[${Date.now() - startTime}ms] Page loaded\n`);

    // Check if wallet dropdown is visible
    const walletDropdown = page.locator('[data-testid="wallet-dropdown"]').or(page.locator('text=Connect Wallet'));
    await expect(walletDropdown).toBeVisible({ timeout: 10000 });
    console.log(`\n[${Date.now() - startTime}ms] Wallet UI visible\n`);

    // Check current verification state
    const verificationStatus = page.locator('text=/Verified|Verify|Unverified/i');
    if (await verificationStatus.isVisible()) {
      const statusText = await verificationStatus.textContent();
      console.log(`\n[${Date.now() - startTime}ms] Current status: ${statusText}\n`);
    }

    // Look for verification button/link
    const verifyButton = page.locator('button:has-text("Verify")').or(
      page.locator('a:has-text("Verify")')
    );

    if (await verifyButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('\n=== CLICKING VERIFY BUTTON ===\n');
      const clickTime = Date.now() - startTime;
      console.log(`[${clickTime}ms] Clicking verify button`);

      await verifyButton.click();

      // Monitor for 15 seconds after click
      console.log('\n=== MONITORING FOR 15 SECONDS ===\n');
      await page.waitForTimeout(15000);

      const endTime = Date.now() - startTime;
      console.log(`\n[${endTime}ms] Monitoring complete\n`);

      // Check for error messages in UI
      const errorElement = page.locator('[class*="error"]').or(
        page.locator('[role="alert"]')
      ).or(
        page.locator('text=/error|failed|invalid/i')
      );

      if (await errorElement.isVisible({ timeout: 1000 }).catch(() => false)) {
        const errorText = await errorElement.textContent();
        console.log(`\n[ERROR IN UI] ${errorText}\n`);
      }

      // Check final verification status
      if (await verificationStatus.isVisible()) {
        const finalStatus = await verificationStatus.textContent();
        console.log(`\n[${endTime}ms] Final status: ${finalStatus}\n`);
      }
    } else {
      console.log('\n=== NO VERIFY BUTTON FOUND ===\n');
      console.log('Current page state:');
      const bodyText = await page.locator('body').textContent();
      console.log(bodyText?.substring(0, 500));
    }

    // Generate comprehensive report
    console.log('\n\n========================================');
    console.log('VERIFICATION MONITORING REPORT');
    console.log('========================================\n');

    console.log(`Total Duration: ${Date.now() - startTime}ms\n`);

    console.log(`Console Messages: ${consoleMessages.length}`);
    console.log(`Console Errors: ${consoleErrors.length}`);
    console.log(`Page Errors: ${pageErrors.length}`);
    console.log(`Network Requests: ${networkRequests.length}\n`);

    if (consoleErrors.length > 0) {
      console.log('=== CONSOLE ERRORS ===');
      consoleErrors.forEach(err => {
        console.log(`[${err.timestamp}ms] ${err.message}`);
      });
      console.log('');
    }

    if (pageErrors.length > 0) {
      console.log('=== PAGE ERRORS ===');
      pageErrors.forEach(err => {
        console.log(`[${err.timestamp}ms] ${err.message}`);
      });
      console.log('');
    }

    if (networkRequests.length > 0) {
      console.log('=== NETWORK REQUESTS ===');
      networkRequests.forEach(req => {
        console.log(`[${req.timestamp}ms] ${req.method} ${req.url}`);
        if (req.duration) {
          console.log(`  Duration: ${req.duration}ms`);
        }
        if (req.response) {
          console.log(`  Response:`, JSON.stringify(req.response, null, 2));
        }
      });
      console.log('');
    }

    // Look for specific verification-related messages
    const verificationMessages = consoleMessages.filter(msg =>
      msg.text.toLowerCase().includes('verif') ||
      msg.text.toLowerCase().includes('wallet') ||
      msg.text.toLowerCase().includes('signature')
    );

    if (verificationMessages.length > 0) {
      console.log('=== VERIFICATION-RELATED MESSAGES ===');
      verificationMessages.forEach(msg => {
        console.log(`[${msg.timestamp}ms] [${msg.type}] ${msg.text}`);
      });
      console.log('');
    }

    console.log('========================================\n');

    // Save detailed report to file
    const report = {
      totalDuration: Date.now() - startTime,
      consoleMessages,
      consoleErrors,
      pageErrors,
      networkRequests,
      verificationMessages
    };

    console.log('Full report saved to monitoring data');
    console.log(JSON.stringify(report, null, 2));
  });
});
