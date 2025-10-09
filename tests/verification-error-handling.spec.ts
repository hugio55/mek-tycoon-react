import { test, expect, Page } from '@playwright/test';

/**
 * VISUAL REGRESSION TESTS: Blockfrost Verification Error Handling
 *
 * Test Coverage:
 * 1. Large collection loading states (240+ NFTs)
 * 2. Timeout handling (7-10 second wait)
 * 3. Error state visual confirmation
 * 4. Button state transitions
 * 5. Console error monitoring
 *
 * Component: BlockchainVerificationPanel
 * Location: src/components/BlockchainVerificationPanel.tsx
 * Test URL: http://localhost:3100 (main hub page)
 */

// Helper: Wait for page to be fully loaded
async function waitForPageReady(page: Page) {
  await page.waitForLoadState('networkidle');
  // Wait for Convex to initialize (checks for React hydration)
  await page.waitForFunction(() => {
    return window.document.readyState === 'complete' &&
           document.querySelector('[data-convex-ready]') !== null;
  }, { timeout: 10000 });
}

// Helper: Mock wallet connection with custom MEK count
async function mockWalletConnection(page: Page, mekCount: number) {
  // Generate mock MEKs
  const mockMeks = Array.from({ length: mekCount }, (_, i) => ({
    assetId: `ffa56051fda3d106a96f09c3d209d4bf24a117406fb813fb8b4548e3${String(i).padStart(8, '0')}`,
    assetName: `Mek #${i + 1}`,
    mekNumber: i + 1,
    quantity: 1
  }));

  await page.evaluate((meks) => {
    // Mock wallet API
    window.mockWalletConnected = true;
    window.mockWalletAddress = 'stake_test1demo_verification_test_wallet_12345678';
    window.mockMeks = meks;
  }, mockMeks);
}

// Helper: Mock verification backend response
async function mockVerificationResponse(page: Page, scenario: 'success' | 'timeout' | 'ctx-query-undefined' | 'rate-limit') {
  await page.route('**/api/blockchainVerification/verifyNFTOwnership*', async (route) => {
    if (scenario === 'timeout') {
      // Simulate timeout - delay beyond 45 seconds (backend timeout)
      await page.waitForTimeout(46000);
      return route.fulfill({
        status: 408,
        body: JSON.stringify({
          success: false,
          verified: false,
          error: 'Verification timed out after 45s. This may happen with very large collections (200+ NFTs). Please try again.'
        })
      });
    }

    if (scenario === 'ctx-query-undefined') {
      // Simulate "ctx.query undefined" error
      return route.fulfill({
        status: 500,
        body: JSON.stringify({
          success: false,
          verified: false,
          error: 'Internal server error: ctx.query is undefined'
        })
      });
    }

    if (scenario === 'rate-limit') {
      return route.fulfill({
        status: 429,
        body: JSON.stringify({
          success: false,
          verified: false,
          error: 'Rate limit exceeded. Please wait before retrying.'
        })
      });
    }

    // Success case
    return route.fulfill({
      status: 200,
      body: JSON.stringify({
        success: true,
        verified: true,
        source: 'blockfrost',
        timestamp: Date.now(),
        walletReportedCount: 5,
        blockchainVerifiedCount: 5,
        falsePositives: [],
        missingMeks: []
      })
    });
  });
}

test.describe('Blockfrost Verification Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    // Enable console monitoring
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`[BROWSER ERROR] ${msg.text()}`);
      }
    });

    page.on('pageerror', exception => {
      console.log(`[BROWSER EXCEPTION] ${exception.message}`);
    });

    // Navigate to main hub page
    await page.goto('http://localhost:3100');
    await waitForPageReady(page);
  });

  test('should display loading states for large collection (240+ NFTs)', async ({ page }) => {
    // Mock wallet with 240 MEKs
    await mockWalletConnection(page, 240);
    await mockVerificationResponse(page, 'success');

    // Click verification button
    const verifyButton = page.locator('[data-verify-blockchain]');
    await expect(verifyButton).toBeVisible();
    await verifyButton.click();

    // 1. Initial loading state - button should show "VERIFYING ON BLOCKCHAIN..."
    await expect(verifyButton).toContainText('VERIFYING ON BLOCKCHAIN...');

    // 2. Verify loading overlay appears with spinner
    const loadingOverlay = page.locator('.absolute.inset-0.bg-black\\/80');
    await expect(loadingOverlay).toBeVisible({ timeout: 2000 });

    // 3. Capture loading state visual
    await expect(page.locator('.mek-card-industrial')).toHaveScreenshot('verification-loading-large-collection.png', {
      animations: 'disabled',
      maxDiffPixelRatio: 0.02 // Allow 2% difference for spinner animation
    });

    // 4. Verify progress indicator updates
    const progressText = page.locator('text=/Querying \\d+ NFTs on-chain.../');
    await expect(progressText).toBeVisible({ timeout: 3000 });

    // 5. Verify "Large collection detected" warning appears
    const largeCollectionWarning = page.locator('text=/Large collection detected. This may take up to 45 seconds./');
    await expect(largeCollectionWarning).toBeVisible();

    // 6. Wait for completion
    await expect(verifyButton).toContainText('VERIFIED ON BLOCKCHAIN', { timeout: 50000 });

    // 7. Capture success state
    await expect(page.locator('.mek-card-industrial')).toHaveScreenshot('verification-success-large-collection.png', {
      animations: 'disabled'
    });
  });

  test('should handle timeout error (45+ seconds)', async ({ page }) => {
    await mockWalletConnection(page, 250);
    await mockVerificationResponse(page, 'timeout');

    const verifyButton = page.locator('[data-verify-blockchain]');
    await verifyButton.click();

    // Wait for timeout to occur
    await expect(verifyButton).toContainText('VERIFICATION FAILED', { timeout: 50000 });

    // Verify error message appears
    const errorPanel = page.locator('text=/Verification timed out/');
    await expect(errorPanel).toBeVisible();

    // Verify error styling matches industrial design
    const errorContainer = page.locator('.border-red-500\\/50');
    await expect(errorContainer).toBeVisible();

    // Verify hazard stripes appear
    const hazardStripes = page.locator('.mek-overlay-hazard-stripes');
    await expect(hazardStripes).toBeVisible();

    // Capture timeout error state
    await expect(page.locator('.mek-card-industrial')).toHaveScreenshot('verification-timeout-error.png', {
      animations: 'disabled',
      mask: [page.locator('.animate-ping')] // Mask animated ping effect
    });

    // Verify error message clarity
    await expect(errorPanel).toContainText('Verification timed out');
    await expect(errorPanel).toContainText('Large collections (200+ NFTs) can take longer');
  });

  test('should display "ctx.query undefined" error correctly', async ({ page }) => {
    await mockWalletConnection(page, 50);
    await mockVerificationResponse(page, 'ctx-query-undefined');

    const verifyButton = page.locator('[data-verify-blockchain]');
    await verifyButton.click();

    // Wait for error to appear
    await expect(verifyButton).toContainText('VERIFICATION FAILED', { timeout: 10000 });

    // Verify error toast/message appears
    const errorMessage = page.locator('text=/ctx.query is undefined/');
    await expect(errorMessage).toBeVisible();

    // Capture ctx.query error state
    await expect(page.locator('.mek-card-industrial')).toHaveScreenshot('verification-ctx-query-error.png', {
      animations: 'disabled',
      mask: [page.locator('.animate-ping')]
    });

    // Verify error button styling (red with hazard stripes)
    await expect(verifyButton).toHaveClass(/bg-red-900\/30/);
    await expect(verifyButton).toHaveClass(/border-red-500\/50/);
  });

  test('should handle rate limit error', async ({ page }) => {
    await mockWalletConnection(page, 10);
    await mockVerificationResponse(page, 'rate-limit');

    const verifyButton = page.locator('[data-verify-blockchain]');
    await verifyButton.click();

    // Wait for rate limit error
    await expect(verifyButton).toContainText('VERIFICATION FAILED', { timeout: 10000 });

    // Verify rate limit message
    const rateLimitMessage = page.locator('text=/Rate limit exceeded/');
    await expect(rateLimitMessage).toBeVisible();

    // Capture rate limit error state
    await expect(page.locator('.mek-card-industrial')).toHaveScreenshot('verification-rate-limit-error.png', {
      animations: 'disabled',
      mask: [page.locator('.animate-ping')]
    });
  });

  test('should transition button states correctly: Idle → Loading → Error → Idle (retry)', async ({ page }) => {
    await mockWalletConnection(page, 10);

    const verifyButton = page.locator('[data-verify-blockchain]');

    // State 1: Idle
    await expect(verifyButton).toContainText('VERIFY ON BLOCKCHAIN');
    await expect(verifyButton).toHaveScreenshot('button-state-idle.png', {
      animations: 'disabled'
    });

    // Trigger error scenario
    await mockVerificationResponse(page, 'ctx-query-undefined');
    await verifyButton.click();

    // State 2: Loading
    await expect(verifyButton).toContainText('VERIFYING ON BLOCKCHAIN...', { timeout: 2000 });
    await expect(verifyButton).toHaveScreenshot('button-state-loading.png', {
      animations: 'disabled',
      maxDiffPixelRatio: 0.02
    });

    // State 3: Error
    await expect(verifyButton).toContainText('VERIFICATION FAILED', { timeout: 10000 });
    await expect(verifyButton).toHaveScreenshot('button-state-error.png', {
      animations: 'disabled',
      mask: [page.locator('.animate-ping')]
    });

    // State 4: Retry (back to Loading)
    const retryButton = page.locator('text=Retry Verification');
    await expect(retryButton).toBeVisible();

    // Now mock success for retry
    await mockVerificationResponse(page, 'success');
    await retryButton.click();

    await expect(verifyButton).toContainText('VERIFYING ON BLOCKCHAIN...', { timeout: 2000 });

    // State 5: Success
    await expect(verifyButton).toContainText('VERIFIED ON BLOCKCHAIN', { timeout: 10000 });
    await expect(verifyButton).toHaveScreenshot('button-state-success.png', {
      animations: 'disabled'
    });
  });

  test('should transition: Idle → Loading → Success (no errors)', async ({ page }) => {
    await mockWalletConnection(page, 5);
    await mockVerificationResponse(page, 'success');

    const verifyButton = page.locator('[data-verify-blockchain]');

    // Idle state
    await expect(verifyButton).toContainText('VERIFY ON BLOCKCHAIN');

    // Click to start
    await verifyButton.click();

    // Loading state
    await expect(verifyButton).toContainText('VERIFYING ON BLOCKCHAIN...', { timeout: 2000 });

    // Success state
    await expect(verifyButton).toContainText('VERIFIED ON BLOCKCHAIN', { timeout: 10000 });

    // Capture final success state
    await expect(page.locator('.mek-card-industrial')).toHaveScreenshot('verification-success-complete.png', {
      animations: 'disabled'
    });
  });

  test('should verify no "stuck" states (button returns to correct state)', async ({ page }) => {
    await mockWalletConnection(page, 10);

    const verifyButton = page.locator('[data-verify-blockchain]');

    // Test 1: Error scenario - button should NOT stay in loading state
    await mockVerificationResponse(page, 'ctx-query-undefined');
    await verifyButton.click();

    await expect(verifyButton).toContainText('VERIFICATION FAILED', { timeout: 15000 });

    // Verify button is NOT disabled (should be clickable for retry)
    const isDisabled = await verifyButton.getAttribute('disabled');
    expect(isDisabled).toBeNull(); // Not disabled

    // Dismiss error
    const dismissButton = page.locator('text=Dismiss');
    await dismissButton.click();

    // Button should return to idle state
    await expect(verifyButton).toContainText('VERIFY ON BLOCKCHAIN', { timeout: 2000 });

    // Test 2: Success scenario - verify no stuck loading
    await mockVerificationResponse(page, 'success');
    await verifyButton.click();

    await expect(verifyButton).toContainText('VERIFIED ON BLOCKCHAIN', { timeout: 15000 });

    // Button should remain in success state (not revert to loading)
    await page.waitForTimeout(2000); // Wait to ensure stability
    await expect(verifyButton).toContainText('VERIFIED ON BLOCKCHAIN');
  });

  test('should monitor console for errors during verification', async ({ page }) => {
    const consoleMessages: string[] = [];
    const pageErrors: string[] = [];

    // Capture console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    });

    // Capture page errors
    page.on('pageerror', exception => {
      pageErrors.push(exception.message);
    });

    await mockWalletConnection(page, 10);
    await mockVerificationResponse(page, 'success');

    const verifyButton = page.locator('[data-verify-blockchain]');
    await verifyButton.click();

    // Wait for completion
    await expect(verifyButton).toContainText('VERIFIED ON BLOCKCHAIN', { timeout: 15000 });

    // Visual assertion
    await expect(page.locator('.mek-card-industrial')).toHaveScreenshot('verification-success-console-clean.png', {
      animations: 'disabled'
    });

    // Console assertion - no critical errors during successful verification
    const criticalErrors = consoleMessages.filter(msg =>
      msg.includes('ERROR') ||
      msg.includes('Failed') ||
      msg.includes('undefined')
    );

    expect(criticalErrors).toHaveLength(0);

    // Page error assertion - no unhandled exceptions
    expect(pageErrors).toHaveLength(0);
  });

  test('should log errors properly during failed verification', async ({ page }) => {
    const consoleMessages: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    page.on('pageerror', exception => {
      pageErrors.push(exception.message);
    });

    await mockWalletConnection(page, 10);
    await mockVerificationResponse(page, 'ctx-query-undefined');

    const verifyButton = page.locator('[data-verify-blockchain]');
    await verifyButton.click();

    await expect(verifyButton).toContainText('VERIFICATION FAILED', { timeout: 15000 });

    // Verify error is logged to console
    const errorLogs = consoleMessages.filter(msg =>
      msg.includes('error') || msg.includes('Verification')
    );

    expect(errorLogs.length).toBeGreaterThan(0);

    // Verify no unhandled promise rejections (should be caught)
    const unhandledRejections = pageErrors.filter(err =>
      err.includes('Unhandled Promise rejection')
    );

    expect(unhandledRejections).toHaveLength(0);

    console.log('Console messages during failed verification:', consoleMessages);
    console.log('Page errors during failed verification:', pageErrors);
  });

  test('should display error message with proper industrial styling', async ({ page }) => {
    await mockWalletConnection(page, 10);
    await mockVerificationResponse(page, 'timeout');

    const verifyButton = page.locator('[data-verify-blockchain]');
    await verifyButton.click();

    await expect(verifyButton).toContainText('VERIFICATION FAILED', { timeout: 50000 });

    // Verify industrial design elements
    const errorContainer = page.locator('.border-red-500\\/50');
    await expect(errorContainer).toBeVisible();

    // Hazard stripe header
    const hazardHeader = page.locator('.mek-overlay-hazard-stripes');
    await expect(hazardHeader).toBeVisible();

    // Warning icon with animation
    const warningIcon = page.locator('.border-red-500.animate-ping');
    await expect(warningIcon).toBeVisible();

    // Verify Orbitron font for error header
    const errorHeader = page.locator('text=VERIFICATION ERROR');
    await expect(errorHeader).toBeVisible();
    const fontFamily = await errorHeader.evaluate(el =>
      window.getComputedStyle(el).fontFamily
    );
    expect(fontFamily).toContain('Orbitron');

    // Decorative corner accents
    const corners = page.locator('.border-red-500').filter({ hasText: '' });
    expect(await corners.count()).toBeGreaterThanOrEqual(4);

    // Capture full error panel styling
    await expect(errorContainer).toHaveScreenshot('error-panel-industrial-styling.png', {
      animations: 'disabled',
      mask: [page.locator('.animate-ping')]
    });
  });

  test('should display clear and actionable error messages', async ({ page }) => {
    // Test 1: Timeout error message
    await mockWalletConnection(page, 250);
    await mockVerificationResponse(page, 'timeout');

    const verifyButton = page.locator('[data-verify-blockchain]');
    await verifyButton.click();

    await expect(verifyButton).toContainText('VERIFICATION FAILED', { timeout: 50000 });

    const timeoutMessage = page.locator('text=/Verification timed out/');
    await expect(timeoutMessage).toBeVisible();

    // Should provide actionable steps
    await expect(page.locator('text=/Try again/').or(page.locator('text=/Retry/'))).toBeVisible();
    await expect(page.locator('text=/contact.*support/i')).toBeVisible();

    // Test 2: Rate limit error message
    await page.reload();
    await waitForPageReady(page);
    await mockWalletConnection(page, 10);
    await mockVerificationResponse(page, 'rate-limit');

    await verifyButton.click();
    await expect(verifyButton).toContainText('VERIFICATION FAILED', { timeout: 15000 });

    const rateLimitMessage = page.locator('text=/Rate limit exceeded/');
    await expect(rateLimitMessage).toBeVisible();
    await expect(rateLimitMessage).toContainText('wait before retrying');

    // Test 3: Generic error message
    await page.reload();
    await waitForPageReady(page);
    await mockWalletConnection(page, 10);
    await mockVerificationResponse(page, 'ctx-query-undefined');

    await verifyButton.click();
    await expect(verifyButton).toContainText('VERIFICATION FAILED', { timeout: 15000 });

    // Should show retry button
    const retryButton = page.locator('text=Retry Verification');
    await expect(retryButton).toBeVisible();
  });
});

/**
 * VISUAL REGRESSION BASELINE GENERATION
 *
 * To generate baseline screenshots:
 * 1. Ensure the app is running on http://localhost:3100
 * 2. Run: npx playwright test tests/verification-error-handling.spec.ts --update-snapshots
 *
 * To run tests against baselines:
 * 3. Run: npx playwright test tests/verification-error-handling.spec.ts
 *
 * To view test report:
 * 4. Run: npx playwright show-report
 */
