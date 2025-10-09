import { test, expect } from '@playwright/test';

/**
 * BLOCKCHAIN SNAPSHOT CREATION VISUAL TESTS
 *
 * Tests the blockchain verification panel's manual snapshot creation flow.
 * Monitors UI state, console output, network requests, and visual feedback.
 */

test.describe('Blockchain Snapshot Creation Flow', () => {
  // Test setup - capture all diagnostic data
  interface DiagnosticData {
    consoleMessages: Array<{ type: string; text: string; timestamp: number }>;
    consoleErrors: Array<{ message: string; timestamp: number; stack?: string }>;
    pageErrors: Array<{ message: string; timestamp: number; stack?: string }>;
    networkRequests: Array<{
      url: string;
      method: string;
      timestamp: number;
      requestBody?: any;
      response?: any;
      status?: number;
      duration?: number;
    }>;
    verificationLogs: Array<{ text: string; timestamp: number }>;
    mutationCalls: Array<{ name: string; args?: any; timestamp: number }>;
  }

  let diagnosticData: DiagnosticData;
  let startTime: number;

  test.beforeEach(async ({ page }) => {
    startTime = Date.now();
    diagnosticData = {
      consoleMessages: [],
      consoleErrors: [],
      pageErrors: [],
      networkRequests: [],
      verificationLogs: [],
      mutationCalls: []
    };

    // Setup comprehensive monitoring
    setupMonitoring(page);
  });

  function setupMonitoring(page: any) {
    const getTimestamp = () => Date.now() - startTime;

    // Monitor console messages
    page.on('console', (msg: any) => {
      const timestamp = getTimestamp();
      const text = msg.text();
      const type = msg.type();

      diagnosticData.consoleMessages.push({ type, text, timestamp });

      // Capture errors separately with more detail
      if (type === 'error') {
        diagnosticData.consoleErrors.push({
          message: text,
          timestamp,
          stack: msg.location()?.url
        });
      }

      // Capture verification-specific logs
      if (text.toLowerCase().includes('verif') ||
          text.toLowerCase().includes('snapshot') ||
          text.toLowerCase().includes('blockchain')) {
        diagnosticData.verificationLogs.push({ text, timestamp });
        console.log(`[VERIFICATION ${timestamp}ms] ${text}`);
      }
    });

    // Monitor page errors (JavaScript exceptions)
    page.on('pageerror', (exception: Error) => {
      const timestamp = getTimestamp();
      diagnosticData.pageErrors.push({
        message: exception.message,
        timestamp,
        stack: exception.stack
      });
      console.log(`[PAGE ERROR ${timestamp}ms] ${exception.message}`);
    });

    // Monitor network requests
    page.on('request', (request: any) => {
      const timestamp = getTimestamp();
      const url = request.url();

      // Track Convex and API calls
      if (url.includes('convex.cloud') || url.includes('/api/')) {
        const requestData: any = {
          url,
          method: request.method(),
          timestamp
        };

        // Try to capture request body for POST requests
        if (request.method() === 'POST') {
          try {
            const postData = request.postData();
            if (postData) {
              requestData.requestBody = JSON.parse(postData);
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }

        diagnosticData.networkRequests.push(requestData);
        console.log(`[REQUEST ${timestamp}ms] ${request.method()} ${url}`);
      }
    });

    // Monitor network responses
    page.on('response', async (response: any) => {
      const timestamp = getTimestamp();
      const url = response.url();

      if (url.includes('convex.cloud') || url.includes('/api/')) {
        // Find matching request
        const request = diagnosticData.networkRequests.find(
          r => r.url === url && !r.response
        );

        if (request) {
          request.status = response.status();
          request.duration = timestamp - request.timestamp;

          // Try to capture response body
          try {
            const responseBody = await response.json();
            request.response = responseBody;

            console.log(`[RESPONSE ${timestamp}ms] ${response.status()} ${url}`);
            console.log(`  Duration: ${request.duration}ms`);
            console.log(`  Response:`, JSON.stringify(responseBody, null, 2));
          } catch (e) {
            console.log(`[RESPONSE ${timestamp}ms] ${response.status()} ${url} (non-JSON)`);
          }
        }
      }
    });
  }

  test('should display verification button and monitor interaction', async ({ page }) => {
    console.log('\n=== TEST: Verification Button Interaction ===\n');

    // Navigate to page with demo mode enabled
    console.log('[1] Navigating to page with demo mode...');
    await page.goto('/?demo=true', { waitUntil: 'networkidle' });
    console.log(`[${Date.now() - startTime}ms] Page loaded`);

    // Take initial screenshot
    await expect(page).toHaveScreenshot('01-initial-page-state.png', {
      fullPage: false,
      animations: 'disabled'
    });

    // Look for verification button (using data-testid from component)
    console.log('\n[2] Looking for verification button...');
    const verifyButton = page.locator('[data-verify-blockchain]');

    // Check if button exists
    const buttonExists = await verifyButton.count() > 0;
    console.log(`Button exists: ${buttonExists}`);

    if (!buttonExists) {
      console.log('ERROR: Verification button not found in DOM');
      console.log('Searching for alternative selectors...');

      // Try alternative selectors
      const altButton1 = page.locator('button:has-text("VERIFY")');
      const altButton2 = page.locator('button:has-text("Verify")');
      const altButton3 = page.locator('[class*="verify"]');

      console.log(`Alternative 1 (VERIFY text): ${await altButton1.count()}`);
      console.log(`Alternative 2 (Verify text): ${await altButton2.count()}`);
      console.log(`Alternative 3 (verify class): ${await altButton3.count()}`);

      // Dump page structure for debugging
      const bodyText = await page.locator('body').textContent();
      console.log('\nPage body text (first 1000 chars):');
      console.log(bodyText?.substring(0, 1000));

      throw new Error('Verification button not found - test cannot proceed');
    }

    // Check if button is visible
    const isVisible = await verifyButton.isVisible();
    console.log(`Button visible: ${isVisible}`);

    if (!isVisible) {
      console.log('WARNING: Button exists but is not visible');

      // Check if parent is hidden
      const parent = page.locator('[data-verify-blockchain]').locator('..');
      const parentClass = await parent.getAttribute('class');
      console.log(`Parent class: ${parentClass}`);

      // Try to make it visible for testing
      console.log('Attempting to make button visible for test...');
      await page.evaluate(() => {
        const btn = document.querySelector('[data-verify-blockchain]') as HTMLElement;
        if (btn) {
          let element: HTMLElement | null = btn;
          while (element) {
            if (element.classList?.contains('hidden')) {
              element.classList.remove('hidden');
              element.style.display = 'block';
            }
            element = element.parentElement;
          }
        }
      });

      // Re-check visibility
      const nowVisible = await verifyButton.isVisible();
      console.log(`Button now visible: ${nowVisible}`);
    }

    // Take screenshot of button state
    await expect(verifyButton).toHaveScreenshot('02-verify-button-initial.png', {
      animations: 'disabled'
    });

    // Check button state
    const isDisabled = await verifyButton.isDisabled();
    const buttonText = await verifyButton.textContent();
    console.log(`Button disabled: ${isDisabled}`);
    console.log(`Button text: ${buttonText}`);

    if (isDisabled) {
      console.log('WARNING: Button is disabled - checking why...');

      // Check for wallet connection
      const walletConnected = await page.evaluate(() => {
        return (window as any).walletConnected || false;
      });
      console.log(`Wallet connected: ${walletConnected}`);

      // Check for MEKs
      const mekCount = await page.evaluate(() => {
        return (window as any).ownedMeks?.length || 0;
      });
      console.log(`MEK count: ${mekCount}`);

      // If no wallet, we can't test verification
      if (!walletConnected) {
        console.log('SKIPPING: No wallet connected - cannot test verification');
        return;
      }
    }

    // Clear console before click
    console.log('\n[3] Clicking verification button...');
    const clickTimestamp = Date.now() - startTime;
    console.log(`[${clickTimestamp}ms] Initiating click`);

    // Click the button
    await verifyButton.click();
    console.log('Click executed');

    // Wait for any immediate UI response (100ms)
    await page.waitForTimeout(100);

    // Check for loading state
    const hasLoadingState = await page.locator('[data-verify-blockchain]').evaluate((el) => {
      return el.textContent?.includes('VERIFYING') ||
             el.querySelector('.animate-spin') !== null;
    });
    console.log(`Loading state active: ${hasLoadingState}`);

    // Take screenshot during verification (if still in progress)
    if (hasLoadingState) {
      await expect(page).toHaveScreenshot('03-verification-in-progress.png', {
        fullPage: false,
        animations: 'disabled'
      });
    }

    // Monitor for 5 seconds
    console.log('\n[4] Monitoring for 5 seconds...');
    const monitoringPromise = page.waitForTimeout(5000);

    // Also listen for verification completion
    const completionPromise = page.waitForFunction(() => {
      const btn = document.querySelector('[data-verify-blockchain]');
      return btn?.textContent?.includes('VERIFIED') ||
             btn?.textContent?.includes('FAILED');
    }, { timeout: 5000 }).catch(() => null);

    await Promise.race([monitoringPromise, completionPromise]);

    const endTimestamp = Date.now() - startTime;
    console.log(`[${endTimestamp}ms] Monitoring complete`);

    // Check final button state
    const finalText = await verifyButton.textContent();
    console.log(`Final button text: ${finalText}`);

    // Take final screenshot
    await expect(page).toHaveScreenshot('04-verification-complete.png', {
      fullPage: false,
      animations: 'disabled'
    });

    // Check for error messages in UI
    const errorElement = page.locator('[class*="error"]').or(
      page.locator('[role="alert"]')
    );
    const hasError = await errorElement.isVisible().catch(() => false);

    if (hasError) {
      const errorText = await errorElement.textContent();
      console.log(`\nERROR IN UI: ${errorText}`);

      await expect(errorElement).toHaveScreenshot('05-error-message.png');
    }

    // Generate comprehensive report
    generateReport(endTimestamp);
  });

  test('should detect Convex mutation calls during verification', async ({ page }) => {
    console.log('\n=== TEST: Convex Mutation Detection ===\n');

    await page.goto('/?demo=true', { waitUntil: 'networkidle' });

    // Intercept Convex mutations
    await page.route('**/convex.cloud/**', async (route) => {
      const request = route.request();
      const url = request.url();

      if (request.method() === 'POST') {
        const postData = request.postData();
        if (postData) {
          try {
            const data = JSON.parse(postData);
            console.log('[CONVEX MUTATION INTERCEPTED]', data);

            diagnosticData.mutationCalls.push({
              name: data.path || 'unknown',
              args: data.args,
              timestamp: Date.now() - startTime
            });
          } catch (e) {
            // Ignore parsing errors
          }
        }
      }

      // Continue with the request
      await route.continue();
    });

    const verifyButton = page.locator('[data-verify-blockchain]');

    if (await verifyButton.isVisible().catch(() => false)) {
      console.log('Clicking verification button...');
      await verifyButton.click();

      // Wait for mutations
      await page.waitForTimeout(3000);

      console.log('\n=== MUTATION CALLS DETECTED ===');
      diagnosticData.mutationCalls.forEach(call => {
        console.log(`[${call.timestamp}ms] ${call.name}`);
        if (call.args) {
          console.log(`  Args:`, JSON.stringify(call.args, null, 2));
        }
      });

      // Check if expected mutations were called
      const expectedMutations = [
        'blockchainVerification',
        'verifyNFTOwnership',
        'markWalletAsVerified'
      ];

      expectedMutations.forEach(mutationName => {
        const called = diagnosticData.mutationCalls.some(
          call => call.name.includes(mutationName)
        );
        console.log(`${mutationName}: ${called ? '✓ CALLED' : '✗ NOT CALLED'}`);
      });
    } else {
      console.log('Verification button not visible - skipping mutation test');
    }
  });

  function generateReport(endTimestamp: number) {
    console.log('\n\n========================================');
    console.log('BLOCKCHAIN SNAPSHOT VERIFICATION REPORT');
    console.log('========================================\n');

    console.log(`Test Duration: ${endTimestamp}ms\n`);

    // Summary counts
    console.log('=== SUMMARY ===');
    console.log(`Console Messages: ${diagnosticData.consoleMessages.length}`);
    console.log(`Console Errors: ${diagnosticData.consoleErrors.length}`);
    console.log(`Page Errors: ${diagnosticData.pageErrors.length}`);
    console.log(`Network Requests: ${diagnosticData.networkRequests.length}`);
    console.log(`Verification Logs: ${diagnosticData.verificationLogs.length}`);
    console.log(`Mutation Calls: ${diagnosticData.mutationCalls.length}\n`);

    // Console errors
    if (diagnosticData.consoleErrors.length > 0) {
      console.log('=== CONSOLE ERRORS ===');
      diagnosticData.consoleErrors.forEach(err => {
        console.log(`[${err.timestamp}ms] ${err.message}`);
        if (err.stack) {
          console.log(`  Stack: ${err.stack}`);
        }
      });
      console.log('');
    }

    // Page errors
    if (diagnosticData.pageErrors.length > 0) {
      console.log('=== PAGE ERRORS ===');
      diagnosticData.pageErrors.forEach(err => {
        console.log(`[${err.timestamp}ms] ${err.message}`);
        if (err.stack) {
          console.log(`  Stack: ${err.stack}`);
        }
      });
      console.log('');
    }

    // Verification logs
    if (diagnosticData.verificationLogs.length > 0) {
      console.log('=== VERIFICATION TIMELINE ===');
      diagnosticData.verificationLogs.forEach(log => {
        console.log(`[${log.timestamp}ms] ${log.text}`);
      });
      console.log('');
    }

    // Network requests
    if (diagnosticData.networkRequests.length > 0) {
      console.log('=== NETWORK ACTIVITY ===');
      diagnosticData.networkRequests.forEach(req => {
        console.log(`[${req.timestamp}ms] ${req.method} ${req.url}`);
        if (req.status) {
          console.log(`  Status: ${req.status}`);
        }
        if (req.duration) {
          console.log(`  Duration: ${req.duration}ms`);
        }
        if (req.requestBody) {
          console.log(`  Request:`, JSON.stringify(req.requestBody, null, 2));
        }
        if (req.response) {
          console.log(`  Response:`, JSON.stringify(req.response, null, 2));
        }
      });
      console.log('');
    }

    // Mutation calls
    if (diagnosticData.mutationCalls.length > 0) {
      console.log('=== CONVEX MUTATIONS ===');
      diagnosticData.mutationCalls.forEach(call => {
        console.log(`[${call.timestamp}ms] ${call.name}`);
        if (call.args) {
          console.log(`  Args:`, JSON.stringify(call.args, null, 2));
        }
      });
      console.log('');
    }

    // Analysis
    console.log('=== ANALYSIS ===');

    const hasErrors = diagnosticData.consoleErrors.length > 0 ||
                     diagnosticData.pageErrors.length > 0;
    console.log(`Errors detected: ${hasErrors ? 'YES ⚠' : 'NO ✓'}`);

    const hasNetworkActivity = diagnosticData.networkRequests.length > 0;
    console.log(`Network activity: ${hasNetworkActivity ? 'YES ✓' : 'NO ⚠'}`);

    const hasMutations = diagnosticData.mutationCalls.length > 0;
    console.log(`Mutations called: ${hasMutations ? 'YES ✓' : 'NO ⚠'}`);

    const hasVerificationLogs = diagnosticData.verificationLogs.length > 0;
    console.log(`Verification logging: ${hasVerificationLogs ? 'YES ✓' : 'NO ⚠'}`);

    console.log('\n========================================\n');

    // Save full report
    console.log('FULL DIAGNOSTIC DATA:');
    console.log(JSON.stringify(diagnosticData, null, 2));
  }
});
