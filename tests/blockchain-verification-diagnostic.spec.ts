import { test, expect } from '@playwright/test';

/**
 * BLOCKCHAIN VERIFICATION DIAGNOSTIC TEST
 *
 * Simplified diagnostic to identify why manual snapshot creation is failing.
 * Focus on console monitoring and network activity without screenshot dependencies.
 */

test.describe('Blockchain Verification Diagnostic', () => {
  test('diagnose verification button accessibility and interaction', async ({ page }) => {
    const startTime = Date.now();
    const logs: string[] = [];
    const errors: string[] = [];
    const networkCalls: Array<{ url: string; method: string; status?: number }> = [];

    const log = (message: string) => {
      const timestamp = Date.now() - startTime;
      const logMessage = `[${timestamp}ms] ${message}`;
      logs.push(logMessage);
      console.log(logMessage);
    };

    // Monitor console
    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        errors.push(text);
      }
      if (text.includes('Verification') || text.includes('snapshot') || text.includes('blockchain')) {
        log(`CONSOLE: ${text}`);
      }
    });

    // Monitor page errors
    page.on('pageerror', exception => {
      errors.push(exception.message);
      log(`PAGE ERROR: ${exception.message}`);
    });

    // Monitor network
    page.on('response', async response => {
      const url = response.url();
      if (url.includes('convex.cloud') || url.includes('blockfrost') || url.includes('koios')) {
        networkCalls.push({
          url: url.substring(0, 100),
          method: 'response',
          status: response.status()
        });
        log(`NETWORK: ${response.status()} ${url.substring(0, 100)}`);
      }
    });

    // Navigate to page in demo mode
    log('Navigating to page with demo mode');
    await page.goto('/?demo=true', { waitUntil: 'networkidle' });
    log('Page loaded');

    // Wait for any initial React hydration
    await page.waitForTimeout(2000);

    // Check page state
    log('\n=== PAGE STATE ANALYSIS ===');

    // 1. Check if wallet is connected
    const walletConnected = await page.evaluate(() => {
      return (window as any).walletConnected || false;
    });
    log(`Wallet connected: ${walletConnected}`);

    // 2. Check if MEKs are loaded
    const mekCount = await page.evaluate(() => {
      return (window as any).ownedMeks?.length || 0;
    });
    log(`MEK count: ${mekCount}`);

    // 3. Look for verification panel in DOM (even if hidden)
    const panelExists = await page.locator('[data-verify-blockchain]').count() > 0;
    log(`Verification panel exists: ${panelExists}`);

    if (panelExists) {
      const isVisible = await page.locator('[data-verify-blockchain]').isVisible();
      log(`Verification panel visible: ${isVisible}`);

      if (!isVisible) {
        log('Panel exists but is hidden - checking parent elements');

        // Check parent visibility
        const parentInfo = await page.evaluate(() => {
          const btn = document.querySelector('[data-verify-blockchain]');
          if (!btn) return 'Button not found';

          let element: HTMLElement | null = btn.parentElement;
          const hiddenParents: string[] = [];

          while (element) {
            const classes = element.className || '';
            const styles = window.getComputedStyle(element);

            if (classes.includes('hidden') || styles.display === 'none') {
              hiddenParents.push(`${element.tagName}.${classes} (display: ${styles.display})`);
            }

            element = element.parentElement;
          }

          return hiddenParents.length > 0
            ? `Hidden parents: ${hiddenParents.join(', ')}`
            : 'No hidden parents found';
        });

        log(parentInfo);
      }

      // Get button state
      const buttonState = await page.evaluate(() => {
        const btn = document.querySelector('[data-verify-blockchain]');
        if (!btn) return null;

        return {
          text: btn.textContent?.trim(),
          disabled: (btn as HTMLButtonElement).disabled,
          className: btn.className
        };
      });

      if (buttonState) {
        log(`Button text: "${buttonState.text}"`);
        log(`Button disabled: ${buttonState.disabled}`);
        log(`Button classes: ${buttonState.className}`);
      }
    } else {
      log('Verification panel does NOT exist in DOM');
      log('Searching for any verification-related elements...');

      // Check if component is rendered at all
      const verificationText = await page.locator('text=/verif/i').count();
      log(`Elements with "verif" text: ${verificationText}`);

      // Check for blockchain-related elements
      const blockchainText = await page.locator('text=/blockchain/i').count();
      log(`Elements with "blockchain" text: ${blockchainText}`);
    }

    // 4. Check for error messages in UI
    const errorMessages = await page.locator('[class*="error"]').allTextContents();
    if (errorMessages.length > 0) {
      log(`UI Error messages found: ${errorMessages.join(', ')}`);
    }

    // 5. Check session state
    const sessionExpired = await page.locator('text=/session.*expired/i').count() > 0;
    log(`Session expired message: ${sessionExpired}`);

    // 6. Try to make panel visible for testing
    if (panelExists && !(await page.locator('[data-verify-blockchain]').isVisible())) {
      log('\nAttempting to make verification panel visible for testing...');

      await page.evaluate(() => {
        const btn = document.querySelector('[data-verify-blockchain]');
        if (btn) {
          let element: HTMLElement | null = btn as HTMLElement;
          while (element) {
            element.classList.remove('hidden');
            element.style.display = 'block';
            element.style.visibility = 'visible';
            element = element.parentElement;
          }
        }
      });

      const nowVisible = await page.locator('[data-verify-blockchain]').isVisible();
      log(`Panel now visible: ${nowVisible}`);

      if (nowVisible) {
        log('\n=== ATTEMPTING VERIFICATION CLICK ===');

        // Check if button is still disabled
        const isDisabled = await page.locator('[data-verify-blockchain]').isDisabled();
        log(`Button disabled: ${isDisabled}`);

        if (!isDisabled) {
          log('Clicking verification button...');
          await page.locator('[data-verify-blockchain]').click();
          log('Click executed');

          // Monitor for 3 seconds
          log('Monitoring for 3 seconds...');
          await page.waitForTimeout(3000);
          log('Monitoring complete');

          // Check button state after click
          const afterClickState = await page.evaluate(() => {
            const btn = document.querySelector('[data-verify-blockchain]');
            return btn ? btn.textContent?.trim() : 'Button not found';
          });
          log(`Button state after click: "${afterClickState}"`);
        } else {
          log('Button is disabled - cannot click');
        }
      }
    }

    // Generate final report
    log('\n=== FINAL DIAGNOSTIC REPORT ===');
    log(`Total console errors: ${errors.length}`);
    log(`Total network calls: ${networkCalls.length}`);
    log(`Test duration: ${Date.now() - startTime}ms`);

    if (errors.length > 0) {
      log('\n=== ERRORS ===');
      errors.forEach(err => log(`  - ${err}`));
    }

    if (networkCalls.length > 0) {
      log('\n=== NETWORK ACTIVITY ===');
      networkCalls.forEach(call => log(`  ${call.status} ${call.method} ${call.url}`));
    }

    // Recommendations
    log('\n=== RECOMMENDATIONS ===');

    if (!panelExists) {
      log('❌ CRITICAL: Verification panel not rendered in DOM');
      log('   → Check if BlockchainVerificationPanel component is imported and used');
      log('   → Check conditional rendering logic');
    } else if (!walletConnected) {
      log('⚠️  Wallet not connected in demo mode');
      log('   → Demo mode may not auto-connect wallet');
      log('   → Consider adding ?wallet=demo parameter or auto-connect logic');
    } else if (mekCount === 0) {
      log('⚠️  No MEKs loaded');
      log('   → Verification requires MEKs to verify');
      log('   → Check demo data loading');
    } else {
      log('✅ Setup appears correct - panel should be functional');
    }

    // Save full log
    console.log('\n\n=== COMPLETE LOG ===');
    console.log(logs.join('\n'));
  });
});
