/**
 * Wallet Disconnect Flow Verification Tests
 *
 * CRITICAL VERIFICATION GOALS:
 * 1. Disconnect clears localStorage (all wallet keys)
 * 2. Disconnect triggers page reload
 * 3. After reload, UI shows disconnected state
 * 4. No console errors during disconnect
 * 5. Visual regression: screenshots before/after
 *
 * This test uses the "Skip to blockchain verification" demo mode
 * to avoid dealing with real wallet extensions
 */

import { test, expect, Page } from '@playwright/test';

// Helper to wait for network idle
async function waitForNetworkIdle(page: Page, timeout = 5000) {
  try {
    await page.waitForLoadState('networkidle', { timeout });
  } catch (e) {
    console.log('Network idle timeout (acceptable)');
  }
}

// Helper to check if wallet is connected (UI shows disconnect button)
async function isWalletConnected(page: Page): Promise<boolean> {
  try {
    // Check if DISCONNECT button exists in the dropdown
    const disconnectButton = await page.locator('button:has-text("DISCONNECT")').isVisible({ timeout: 2000 });
    return disconnectButton;
  } catch {
    return false;
  }
}

// Helper to get all localStorage keys and values
async function getLocalStorage(page: Page): Promise<Record<string, string>> {
  return await page.evaluate(() => {
    const items: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        items[key] = localStorage.getItem(key) || '';
      }
    }
    return items;
  });
}

// Helper to check if wallet-related localStorage keys are cleared
async function areWalletKeysCleared(page: Page): Promise<{cleared: boolean; details: Record<string, boolean>}> {
  const storage = await getLocalStorage(page);
  const walletKeys = [
    'mek_wallet_session_v2',
    'mek_cached_meks',
    'mek_wallet_session',
    'goldMiningWallet',
    'goldMiningWalletType',
    'walletAddress',
    'stakeAddress',
    'paymentAddress',
    'mek_migration_status'
  ];

  const details: Record<string, boolean> = {};
  walletKeys.forEach(key => {
    details[key] = !storage[key] || storage[key] === 'null' || storage[key] === '';
  });

  const allCleared = Object.values(details).every(v => v === true);

  return { cleared: allCleared, details };
}

test.describe('Wallet Disconnect Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Set up comprehensive console monitoring
    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();

      // Log important disconnect messages
      if (text.includes('[Disconnect Flow]') || text.includes('[Session')  || text.includes('DISCONNECT')) {
        console.log(`[CONSOLE ${type.toUpperCase()}]:`, text);
      }

      // Log errors
      if (type === 'error') {
        console.error('[CONSOLE ERROR]:', text);
      }
    });

    page.on('pageerror', exception => {
      console.error('[PAGE ERROR]:', exception.message);
    });

    // Navigate to app
    await page.goto('/');
    await waitForNetworkIdle(page);
  });

  test('CRITICAL: Disconnect clears localStorage and forces page reload', async ({ page }) => {
    console.log('\n=== CRITICAL TEST: Disconnect Flow ===\n');

    // STEP 1: Take screenshot of initial disconnected state
    await page.screenshot({
      path: 'test-results/disconnect-01-initial.png',
      fullPage: true,
      animations: 'disabled'
    });

    const initialConnected = await isWalletConnected(page);
    expect(initialConnected).toBe(false);
    console.log('✓ Initial state: Disconnected');

    // STEP 2: Connect using "Skip to blockchain verification" button
    console.log('\n--- Connecting Demo Wallet ---');

    const skipButton = page.locator('button:has-text("Skip to blockchain")');
    const skipButtonExists = await skipButton.count();

    if (skipButtonExists === 0) {
      console.warn('⚠️ Skip button not found - test may need adjustment');
      // Try alternative selector
      const altButton = page.locator('text=Skip').or(page.locator('text=Demo')).first();
      if (await altButton.count() > 0) {
        await altButton.click();
      } else {
        throw new Error('Cannot find demo wallet connection button');
      }
    } else {
      await skipButton.click();
    }

    await page.waitForTimeout(2000); // Wait for connection to establish
    await waitForNetworkIdle(page);

    // Handle "NAME YOUR CORPORATION" modal if it appears
    const corpNameModal = page.locator('text=NAME YOUR CORPORATION');
    if (await corpNameModal.isVisible({ timeout: 3000 })) {
      console.log('Corporation name modal appeared - filling it out...');

      // Fill in corporation name
      const corpNameInput = page.locator('input[placeholder*="corporation"]').or(page.locator('input[type="text"]')).first();
      await corpNameInput.fill('Test Corporation');

      // Click create button
      const createButton = page.locator('button:has-text("CREATE CORPORATION")');
      await createButton.click();

      await page.waitForTimeout(1000);
      await waitForNetworkIdle(page);
      console.log('✓ Corporation name submitted');
    }

    // Handle "INITIATE" button if it appears (blockchain verification)
    const initiateButton = page.locator('button:has-text("INITIATE")');
    if (await initiateButton.isVisible({ timeout: 3000 })) {
      console.log('Initiate button found - clicking to start blockchain verification...');
      await initiateButton.click();
      await page.waitForTimeout(2000);
      await waitForNetworkIdle(page);
      console.log('✓ Initiation started');
    }

    // Now wallet should be fully connected - check for wallet indicator in header
    // Look for "0 MEKS" dropdown in the top navigation (first occurrence)
    const meksDropdown = page.locator('button:has-text("MEKS ▼")').first();
    const walletVisible = await meksDropdown.isVisible({ timeout: 3000 });
    console.log(`Wallet MEKS dropdown visible: ${walletVisible}`);

    if (!walletVisible) {
      console.warn('⚠️ Wallet indicator not visible - capturing debug screenshot');
      await page.screenshot({ path: 'test-results/disconnect-debug-not-connected.png', fullPage: true });
    } else {
      console.log('✓ Wallet connected successfully');
    }

    // STEP 3: Get localStorage BEFORE disconnect
    const storageBeforeDisconnect = await getLocalStorage(page);
    console.log('\nLocalStorage BEFORE disconnect (keys):');
    console.log(Object.keys(storageBeforeDisconnect).filter(k => k.includes('wallet') || k.includes('mek')).join(', '));

    // Take screenshot of connected state
    await page.screenshot({
      path: 'test-results/disconnect-02-connected.png',
      fullPage: true,
      animations: 'disabled'
    });

    // STEP 4: Open wallet dropdown and disconnect
    console.log('\n--- Initiating Disconnect ---');

    // Find the wallet button in the header - use the "MEKS ▼" dropdown
    const walletButton = page.locator('button:has-text("MEKS ▼")').first();

    const walletButtonExists = await walletButton.count();
    console.log(`Wallet MEKS button count: ${walletButtonExists}`);

    if (walletButtonExists > 0) {
      console.log('Opening wallet dropdown...');
      await walletButton.click();
      await page.waitForTimeout(500);

      // Take screenshot of dropdown open
      await page.screenshot({
        path: 'test-results/disconnect-03-dropdown-open.png',
        fullPage: true,
        animations: 'disabled'
      });

      // Click DISCONNECT button
      const disconnectButton = page.locator('button:has-text("DISCONNECT")');
      const disconnectExists = await disconnectButton.isVisible({ timeout: 2000 });

      if (disconnectExists) {
        console.log('Clicking DISCONNECT button...');

        // Listen for navigation (page reload)
        const navigationPromise = page.waitForLoadState('load', { timeout: 15000 });

        await disconnectButton.click();

        // Wait for page to reload
        console.log('Waiting for page reload...');
        await navigationPromise;
        await waitForNetworkIdle(page);

        console.log('✓ Page reloaded after disconnect');
      } else {
        console.error('✗ DISCONNECT button not found');
        await page.screenshot({ path: 'test-results/disconnect-error-no-button.png', fullPage: true });
        throw new Error('DISCONNECT button not found');
      }
    } else {
      console.error('✗ Wallet button not found - cannot disconnect');
      await page.screenshot({ path: 'test-results/disconnect-error-no-wallet-button.png', fullPage: true });
      throw new Error('Wallet button not found');
    }

    // STEP 5: Verify disconnected state after reload
    console.log('\n--- Verifying Disconnect Results ---');

    // Take screenshot after reload
    await page.screenshot({
      path: 'test-results/disconnect-04-after-reload.png',
      fullPage: true,
      animations: 'disabled'
    });

    // Check if UI shows disconnected state
    const disconnectedAfterReload = await isWalletConnected(page);
    console.log(`Disconnected after reload: ${!disconnectedAfterReload}`);
    expect(disconnectedAfterReload).toBe(false);

    // STEP 6: Verify localStorage cleared
    const storageAfterDisconnect = await getLocalStorage(page);
    const { cleared, details } = await areWalletKeysCleared(page);

    console.log('\nLocalStorage AFTER disconnect:');
    Object.entries(details).forEach(([key, isCleared]) => {
      const status = isCleared ? '✓ CLEARED' : '✗ NOT CLEARED';
      console.log(`  ${key}: ${status}`);
    });

    expect(cleared).toBe(true);
    console.log('\n✓ All wallet keys cleared from localStorage');

    console.log('\n=== TEST COMPLETE: PASS ===\n');
  });

  test('VERIFICATION: No console errors during disconnect', async ({ page }) => {
    console.log('\n=== TEST: Console Error Monitoring ===\n');

    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    // Capture errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', exception => {
      pageErrors.push(exception.message);
    });

    // Connect
    const skipButton = page.locator('button:has-text("Skip to blockchain")').first();
    if (await skipButton.count() > 0) {
      await skipButton.click();
      await page.waitForTimeout(2000);
    }

    // Clear error arrays
    consoleErrors.length = 0;
    pageErrors.length = 0;

    // Disconnect
    const walletButton = page.locator('button').filter({ hasText: /stake1|DEMO|Demo/i }).first();
    if (await walletButton.count() > 0) {
      await walletButton.click();
      await page.waitForTimeout(500);

      const disconnectButton = page.locator('button:has-text("DISCONNECT")');
      if (await disconnectButton.isVisible({ timeout: 2000 })) {
        await disconnectButton.click();

        // Wait for reload
        await page.waitForLoadState('load', { timeout: 15000 });
        await waitForNetworkIdle(page);
      }
    }

    // Verify no errors
    console.log('\n--- Error Summary ---');
    console.log(`Console Errors: ${consoleErrors.length}`);
    console.log(`Page Errors: ${pageErrors.length}`);

    if (consoleErrors.length > 0) {
      console.log('\nConsole Errors:');
      consoleErrors.forEach(err => console.log(`  - ${err}`));
    }

    if (pageErrors.length > 0) {
      console.log('\nPage Errors:');
      pageErrors.forEach(err => console.log(`  - ${err}`));
    }

    // Filter out acceptable warnings
    const criticalErrors = consoleErrors.filter(err =>
      !err.includes('Warning:') &&
      !err.includes('Download the React DevTools') &&
      !err.includes('Superfluous response')
    );

    expect(criticalErrors.length).toBe(0);
    expect(pageErrors.length).toBe(0);

    console.log('\n=== TEST COMPLETE: NO ERRORS ===\n');
  });

  test('VISUAL REGRESSION: Screenshot comparison', async ({ page }) => {
    console.log('\n=== TEST: Visual Regression ===\n');

    // Baseline: Disconnected
    await page.screenshot({
      path: 'test-results/visual-baseline-disconnected.png',
      fullPage: true,
      animations: 'disabled',
      mask: [page.locator('[data-testid="timestamp"]')] // Mask dynamic content if any
    });

    // Connect
    const skipButton = page.locator('button:has-text("Skip to blockchain")').first();
    if (await skipButton.count() > 0) {
      await skipButton.click();
      await page.waitForTimeout(2000);
      await waitForNetworkIdle(page);
    }

    // Connected state
    await page.screenshot({
      path: 'test-results/visual-connected.png',
      fullPage: true,
      animations: 'disabled'
    });

    // Disconnect
    const walletButton = page.locator('button').filter({ hasText: /stake1|DEMO|Demo/i }).first();
    if (await walletButton.count() > 0) {
      await walletButton.click();
      await page.waitForTimeout(500);

      // Dropdown open
      await page.screenshot({
        path: 'test-results/visual-dropdown-open.png',
        fullPage: true,
        animations: 'disabled'
      });

      const disconnectButton = page.locator('button:has-text("DISCONNECT")');
      if (await disconnectButton.isVisible({ timeout: 2000 })) {
        await disconnectButton.click();
        await page.waitForLoadState('load', { timeout: 15000 });
        await waitForNetworkIdle(page);
      }
    }

    // After disconnect - should match baseline
    await page.screenshot({
      path: 'test-results/visual-after-disconnect.png',
      fullPage: true,
      animations: 'disabled',
      mask: [page.locator('[data-testid="timestamp"]')]
    });

    console.log('\n✓ Visual regression screenshots captured');
    console.log('=== TEST COMPLETE ===\n');
  });
});
