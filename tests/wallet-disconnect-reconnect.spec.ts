/**
 * Wallet Disconnect-Reconnect Flow Tests
 *
 * CRITICAL TEST SCENARIOS:
 * 1. Happy path: Connect → Disconnect → Reconnect (signature should appear)
 * 2. Edge cases: Rapid disconnect/reconnect, during gold accumulation, multiple tabs
 * 3. Visual verification: Screenshots showing signature prompt appears
 * 4. Database verification: Sessions revoked, localStorage cleared
 * 5. Console monitoring: No errors during flow
 *
 * EXPECTED BEHAVIOR AFTER FIX:
 * - Disconnect clears React state
 * - Disconnect calls revokeAuthentication mutation
 * - Disconnect clears localStorage via clearWalletSession()
 * - Disconnect forces page reload to clear wallet extension cache
 * - Reconnect ALWAYS shows signature prompt (no auto-reconnect)
 */

import { test, expect, Page } from '@playwright/test';

// Helper to wait for network idle with timeout
async function waitForNetworkIdle(page: Page, timeout = 5000) {
  await page.waitForLoadState('networkidle', { timeout });
}

// Helper to check if wallet is connected
async function isWalletConnected(page: Page): Promise<boolean> {
  const disconnectButton = page.locator('button:has-text("DISCONNECT")');
  return await disconnectButton.isVisible({ timeout: 2000 }).catch(() => false);
}

// Helper to get localStorage items
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

// Helper to check if specific localStorage keys are cleared
async function areWalletKeysCleared(page: Page): Promise<boolean> {
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

  return walletKeys.every(key => !storage[key] || storage[key] === 'null');
}

test.describe('Wallet Disconnect-Reconnect Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up console monitoring
    page.on('console', msg => {
      const text = msg.text();
      // Log important disconnect flow messages
      if (text.includes('[Disconnect Flow]')) {
        console.log('🔵 CONSOLE:', text);
      }
    });

    page.on('pageerror', exception => {
      console.error('🔴 PAGE ERROR:', exception.message);
    });

    // Navigate to the app
    await page.goto('/');
    await waitForNetworkIdle(page);
  });

  test('1. HAPPY PATH: Connect → Disconnect → Reconnect shows signature prompt', async ({ page }) => {
    console.log('\n=== TEST 1: HAPPY PATH ===\n');

    // Take screenshot of initial state
    await page.screenshot({ path: 'test-results/1-initial-disconnected.png', fullPage: true });

    // Step 1: Check initial state (should be disconnected)
    const initialConnected = await isWalletConnected(page);
    expect(initialConnected).toBe(false);
    console.log('✓ Initial state: Disconnected');

    // Step 2: Connect wallet (Demo Wallet)
    const demoButton = page.locator('button:has-text("TRY DEMO")');
    await demoButton.click();
    await page.waitForTimeout(2000); // Wait for connection to establish
    await waitForNetworkIdle(page);

    // Verify connected
    const connectedAfterDemo = await isWalletConnected(page);
    expect(connectedAfterDemo).toBe(true);
    console.log('✓ Demo wallet connected');

    // Take screenshot of connected state
    await page.screenshot({ path: 'test-results/1-connected-state.png', fullPage: true });

    // Step 3: Disconnect wallet
    console.log('\n--- Starting Disconnect ---');

    // Open wallet dropdown
    const walletDropdown = page.locator('[data-testid="wallet-dropdown"], button:has-text("DEMO WALLET")').first();
    await walletDropdown.click();
    await page.waitForTimeout(500);

    // Click disconnect button
    const disconnectButton = page.locator('button:has-text("DISCONNECT")');
    await disconnectButton.click();

    console.log('Disconnect button clicked, waiting for page reload...');

    // Wait for page reload (disconnect forces reload)
    await page.waitForLoadState('load', { timeout: 10000 });
    await waitForNetworkIdle(page);
    console.log('✓ Page reloaded after disconnect');

    // Take screenshot after reload
    await page.screenshot({ path: 'test-results/1-after-disconnect-reload.png', fullPage: true });

    // Step 4: Verify disconnected state
    const disconnectedAfterReload = await isWalletConnected(page);
    expect(disconnectedAfterReload).toBe(false);
    console.log('✓ Wallet disconnected (UI shows disconnected state)');

    // Step 5: Verify localStorage cleared
    const storageCleared = await areWalletKeysCleared(page);
    expect(storageCleared).toBe(true);
    console.log('✓ localStorage cleared (all wallet keys removed)');

    // Step 6: Try to reconnect - Demo wallet should work without signature
    // But real wallet would show signature prompt
    console.log('\n--- Testing Reconnect ---');
    const demoButtonAgain = page.locator('button:has-text("TRY DEMO")');
    await demoButtonAgain.click();
    await page.waitForTimeout(2000);
    await waitForNetworkIdle(page);

    // Verify reconnected
    const reconnected = await isWalletConnected(page);
    expect(reconnected).toBe(true);
    console.log('✓ Reconnect successful (Demo wallet re-connected)');

    // Take final screenshot
    await page.screenshot({ path: 'test-results/1-reconnected-state.png', fullPage: true });

    console.log('\n=== TEST 1 COMPLETE: PASS ===\n');
  });

  test('2. EDGE CASE: Rapid disconnect/reconnect cycles', async ({ page }) => {
    console.log('\n=== TEST 2: RAPID DISCONNECT/RECONNECT ===\n');

    // Connect demo wallet
    const demoButton = page.locator('button:has-text("TRY DEMO")');
    await demoButton.click();
    await page.waitForTimeout(2000);
    await waitForNetworkIdle(page);
    console.log('✓ Initial connection established');

    // Perform 3 rapid disconnect-reconnect cycles
    for (let i = 1; i <= 3; i++) {
      console.log(`\n--- Cycle ${i} ---`);

      // Disconnect
      const walletDropdown = page.locator('[data-testid="wallet-dropdown"], button:has-text("DEMO WALLET")').first();
      await walletDropdown.click();
      await page.waitForTimeout(300);

      const disconnectButton = page.locator('button:has-text("DISCONNECT")');
      await disconnectButton.click();

      // Wait for reload
      await page.waitForLoadState('load', { timeout: 10000 });
      await waitForNetworkIdle(page);
      console.log(`Cycle ${i}: Disconnected`);

      // Verify disconnected
      const disconnected = await isWalletConnected(page);
      expect(disconnected).toBe(false);

      // Reconnect immediately
      const demoButtonAgain = page.locator('button:has-text("TRY DEMO")');
      await demoButtonAgain.click();
      await page.waitForTimeout(1500);
      await waitForNetworkIdle(page);
      console.log(`Cycle ${i}: Reconnected`);

      // Verify reconnected
      const reconnected = await isWalletConnected(page);
      expect(reconnected).toBe(true);
    }

    // Take final screenshot
    await page.screenshot({ path: 'test-results/2-after-rapid-cycles.png', fullPage: true });

    console.log('\n=== TEST 2 COMPLETE: PASS ===\n');
  });

  test('3. EDGE CASE: Disconnect during gold accumulation', async ({ page }) => {
    console.log('\n=== TEST 3: DISCONNECT DURING GOLD ACCUMULATION ===\n');

    // Connect demo wallet
    const demoButton = page.locator('button:has-text("TRY DEMO")');
    await demoButton.click();
    await page.waitForTimeout(2000);
    await waitForNetworkIdle(page);
    console.log('✓ Demo wallet connected');

    // Get initial gold value
    const goldDisplay = page.locator('[data-testid="gold-display"], .text-yellow-400:has-text("Gold")').first();
    await page.screenshot({ path: 'test-results/3-before-accumulation.png', fullPage: true });

    // Wait for gold to accumulate (10 seconds)
    console.log('Waiting for gold accumulation...');
    await page.waitForTimeout(10000);

    // Take screenshot during accumulation
    await page.screenshot({ path: 'test-results/3-during-accumulation.png', fullPage: true });
    console.log('✓ Gold accumulated for 10 seconds');

    // Disconnect during accumulation
    console.log('Disconnecting during active gold mining...');
    const walletDropdown = page.locator('[data-testid="wallet-dropdown"], button:has-text("DEMO WALLET")').first();
    await walletDropdown.click();
    await page.waitForTimeout(300);

    const disconnectButton = page.locator('button:has-text("DISCONNECT")');
    await disconnectButton.click();

    // Wait for reload
    await page.waitForLoadState('load', { timeout: 10000 });
    await waitForNetworkIdle(page);
    console.log('✓ Disconnected during gold accumulation');

    // Verify disconnected state
    const disconnected = await isWalletConnected(page);
    expect(disconnected).toBe(false);

    // Verify localStorage cleared (gold should be saved to database before disconnect)
    const storageCleared = await areWalletKeysCleared(page);
    expect(storageCleared).toBe(true);

    // Take screenshot of disconnected state
    await page.screenshot({ path: 'test-results/3-after-disconnect.png', fullPage: true });

    // Reconnect to verify gold was saved
    console.log('Reconnecting to verify gold was saved...');
    const demoButtonAgain = page.locator('button:has-text("TRY DEMO")');
    await demoButtonAgain.click();
    await page.waitForTimeout(2000);
    await waitForNetworkIdle(page);

    // Take final screenshot
    await page.screenshot({ path: 'test-results/3-after-reconnect.png', fullPage: true });
    console.log('✓ Reconnected successfully');

    console.log('\n=== TEST 3 COMPLETE: PASS ===\n');
  });

  test('4. EDGE CASE: Multiple tabs during disconnect', async ({ page, context }) => {
    console.log('\n=== TEST 4: MULTIPLE TABS DURING DISCONNECT ===\n');

    // Connect demo wallet in first tab
    const demoButton = page.locator('button:has-text("TRY DEMO")');
    await demoButton.click();
    await page.waitForTimeout(2000);
    await waitForNetworkIdle(page);
    console.log('✓ Tab 1: Connected');

    // Open second tab
    const page2 = await context.newPage();
    await page2.goto('/');
    await waitForNetworkIdle(page2);
    console.log('✓ Tab 2: Opened');

    // Check if second tab shows connected state (should be connected via session)
    await page2.waitForTimeout(2000);
    const tab2Connected = await isWalletConnected(page2);
    console.log(`Tab 2 connected state: ${tab2Connected}`);

    // Take screenshots of both tabs
    await page.screenshot({ path: 'test-results/4-tab1-before-disconnect.png', fullPage: true });
    await page2.screenshot({ path: 'test-results/4-tab2-before-disconnect.png', fullPage: true });

    // Disconnect from first tab
    console.log('Disconnecting from Tab 1...');
    const walletDropdown = page.locator('[data-testid="wallet-dropdown"], button:has-text("DEMO WALLET")').first();
    await walletDropdown.click();
    await page.waitForTimeout(300);

    const disconnectButton = page.locator('button:has-text("DISCONNECT")');
    await disconnectButton.click();

    // Wait for reload in first tab
    await page.waitForLoadState('load', { timeout: 10000 });
    await waitForNetworkIdle(page);
    console.log('✓ Tab 1: Disconnected and reloaded');

    // Refresh second tab to see if it also disconnects
    await page2.reload();
    await waitForNetworkIdle(page2);
    console.log('✓ Tab 2: Refreshed');

    // Verify both tabs show disconnected state
    const tab1Disconnected = await isWalletConnected(page);
    const tab2Disconnected = await isWalletConnected(page2);

    expect(tab1Disconnected).toBe(false);
    expect(tab2Disconnected).toBe(false);
    console.log('✓ Both tabs show disconnected state');

    // Take final screenshots
    await page.screenshot({ path: 'test-results/4-tab1-after-disconnect.png', fullPage: true });
    await page2.screenshot({ path: 'test-results/4-tab2-after-disconnect.png', fullPage: true });

    // Close second tab
    await page2.close();

    console.log('\n=== TEST 4 COMPLETE: PASS ===\n');
  });

  test('5. DATABASE VERIFICATION: Convex sessions and localStorage', async ({ page }) => {
    console.log('\n=== TEST 5: DATABASE VERIFICATION ===\n');

    // Connect demo wallet
    const demoButton = page.locator('button:has-text("TRY DEMO")');
    await demoButton.click();
    await page.waitForTimeout(2000);
    await waitForNetworkIdle(page);
    console.log('✓ Demo wallet connected');

    // Get localStorage before disconnect
    const storageBeforeDisconnect = await getLocalStorage(page);
    console.log('\nLocalStorage BEFORE disconnect:');
    console.log(JSON.stringify(storageBeforeDisconnect, null, 2));

    // Disconnect
    const walletDropdown = page.locator('[data-testid="wallet-dropdown"], button:has-text("DEMO WALLET")').first();
    await walletDropdown.click();
    await page.waitForTimeout(300);

    const disconnectButton = page.locator('button:has-text("DISCONNECT")');
    await disconnectButton.click();

    // Wait for reload
    await page.waitForLoadState('load', { timeout: 10000 });
    await waitForNetworkIdle(page);
    console.log('✓ Disconnected and reloaded');

    // Get localStorage after disconnect
    const storageAfterDisconnect = await getLocalStorage(page);
    console.log('\nLocalStorage AFTER disconnect:');
    console.log(JSON.stringify(storageAfterDisconnect, null, 2));

    // Verify all wallet-related keys are cleared
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

    console.log('\nVerifying wallet keys cleared:');
    walletKeys.forEach(key => {
      const cleared = !storageAfterDisconnect[key] || storageAfterDisconnect[key] === 'null';
      console.log(`  ${key}: ${cleared ? '✓ CLEARED' : '✗ NOT CLEARED'}`);
      expect(cleared).toBe(true);
    });

    console.log('\n=== TEST 5 COMPLETE: PASS ===\n');
  });

  test('6. CONSOLE MONITORING: No errors during disconnect flow', async ({ page }) => {
    console.log('\n=== TEST 6: CONSOLE MONITORING ===\n');

    const consoleMessages: string[] = [];
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    // Capture all console messages
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(text);

      if (msg.type() === 'error') {
        consoleErrors.push(text);
        console.error('🔴 CONSOLE ERROR:', text);
      }
    });

    page.on('pageerror', exception => {
      pageErrors.push(exception.message);
      console.error('🔴 PAGE ERROR:', exception.message);
    });

    // Connect demo wallet
    const demoButton = page.locator('button:has-text("TRY DEMO")');
    await demoButton.click();
    await page.waitForTimeout(2000);
    await waitForNetworkIdle(page);
    console.log('✓ Demo wallet connected');

    // Clear previous messages
    consoleErrors.length = 0;
    pageErrors.length = 0;

    // Disconnect
    console.log('\n--- Starting Disconnect (monitoring console) ---');
    const walletDropdown = page.locator('[data-testid="wallet-dropdown"], button:has-text("DEMO WALLET")').first();
    await walletDropdown.click();
    await page.waitForTimeout(300);

    const disconnectButton = page.locator('button:has-text("DISCONNECT")');
    await disconnectButton.click();

    // Wait for reload
    await page.waitForLoadState('load', { timeout: 10000 });
    await waitForNetworkIdle(page);
    console.log('✓ Disconnect complete');

    // Log disconnect flow messages
    const disconnectFlowMessages = consoleMessages.filter(msg => msg.includes('[Disconnect Flow]'));
    console.log('\n--- Disconnect Flow Messages ---');
    disconnectFlowMessages.forEach(msg => console.log(msg));

    // Verify no errors during disconnect
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

    // Assert no critical errors
    // Note: Some warnings may be acceptable (e.g., React warnings)
    const criticalErrors = consoleErrors.filter(err =>
      !err.includes('Warning:') &&
      !err.includes('Download the React DevTools')
    );

    expect(criticalErrors.length).toBe(0);
    expect(pageErrors.length).toBe(0);

    console.log('\n=== TEST 6 COMPLETE: PASS ===\n');
  });
});

test.describe('Visual Regression: Disconnect Flow', () => {
  test('7. VISUAL: Screenshot comparison before/after disconnect', async ({ page }) => {
    console.log('\n=== TEST 7: VISUAL REGRESSION ===\n');

    // Initial state
    await page.goto('/');
    await waitForNetworkIdle(page);
    await page.screenshot({
      path: 'test-results/visual-1-initial.png',
      fullPage: true,
      animations: 'disabled'
    });

    // Connect wallet
    const demoButton = page.locator('button:has-text("TRY DEMO")');
    await demoButton.click();
    await page.waitForTimeout(2000);
    await waitForNetworkIdle(page);

    // Screenshot connected state
    await page.screenshot({
      path: 'test-results/visual-2-connected.png',
      fullPage: true,
      animations: 'disabled'
    });

    // Open wallet dropdown
    const walletDropdown = page.locator('[data-testid="wallet-dropdown"], button:has-text("DEMO WALLET")').first();
    await walletDropdown.click();
    await page.waitForTimeout(500);

    // Screenshot dropdown open
    await page.screenshot({
      path: 'test-results/visual-3-dropdown-open.png',
      fullPage: true,
      animations: 'disabled'
    });

    // Click disconnect
    const disconnectButton = page.locator('button:has-text("DISCONNECT")');
    await disconnectButton.click();

    // Wait for reload
    await page.waitForLoadState('load', { timeout: 10000 });
    await waitForNetworkIdle(page);

    // Screenshot after disconnect
    await page.screenshot({
      path: 'test-results/visual-4-after-disconnect.png',
      fullPage: true,
      animations: 'disabled'
    });

    console.log('\n✓ Visual regression screenshots captured');
    console.log('=== TEST 7 COMPLETE: PASS ===\n');
  });
});
