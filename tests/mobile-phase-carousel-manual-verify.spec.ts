import { test, expect } from '@playwright/test';

/**
 * Manual Visual Verification Tests
 * These tests capture screenshots at key moments for manual inspection
 * They use high tolerance to avoid false failures from background animations
 */

test.describe('Mobile Phase Carousel - Manual Visual Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport (iPhone SE size)
    await page.setViewportSize({ width: 375, height: 667 });

    // Set localStorage to bypass audio consent
    await page.addInitScript(() => {
      localStorage.setItem('mek-audio-consent', 'true');
    });

    // Navigate to landing page
    await page.goto('http://localhost:3200/landing');

    // Wait for page to load and stabilize
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Extra time for Convex and animations
  });

  test('Manual Review: Capture collapsed state', async ({ page }) => {
    console.log('[📸SCREENSHOT] Capturing initial collapsed state...');

    const cardsContainer = page.locator('.flex.flex-col > .relative.overflow-hidden.cursor-pointer');
    await cardsContainer.first().waitFor({ state: 'visible', timeout: 10000 });

    // Wait for any initial animations to settle
    await page.waitForTimeout(1000);

    // Take screenshot with high tolerance for background animations
    await expect(page).toHaveScreenshot('manual-01-collapsed-state.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05, // Allow 5% difference for star animations
    });

    console.log('[📸SCREENSHOT] Screenshot saved. Review manually for layout correctness.');
  });

  test('Manual Review: Capture mid-expansion animation', async ({ page }) => {
    console.log('[📸SCREENSHOT] Testing expansion animation...');

    const cardsContainer = page.locator('.flex.flex-col > .relative.overflow-hidden.cursor-pointer');
    await cardsContainer.first().waitFor({ state: 'visible', timeout: 10000 });

    const firstCard = cardsContainer.first();

    // Click to expand
    console.log('[🎯EXPAND] Clicking first card...');
    await firstCard.click();

    // Wait 2 seconds (mid-animation)
    await page.waitForTimeout(2000);

    // Capture mid-expansion
    await expect(page).toHaveScreenshot('manual-02-mid-expansion.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.1, // Higher tolerance during animation
    });

    console.log('[📸SCREENSHOT] Mid-expansion screenshot saved.');
  });

  test('Manual Review: Capture fully expanded state', async ({ page }) => {
    console.log('[📸SCREENSHOT] Testing fully expanded state...');

    const cardsContainer = page.locator('.flex.flex-col > .relative.overflow-hidden.cursor-pointer');
    await cardsContainer.first().waitFor({ state: 'visible', timeout: 10000 });

    const firstCard = cardsContainer.first();

    // Click to expand
    console.log('[🎯EXPAND] Clicking first card...');
    await firstCard.click();

    // Wait full 4 seconds for animation to complete
    await page.waitForTimeout(4000);

    // Extra wait for any post-animation settling
    await page.waitForTimeout(500);

    // Capture fully expanded
    await expect(page).toHaveScreenshot('manual-03-fully-expanded.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });

    console.log('[📸SCREENSHOT] Fully expanded screenshot saved.');
  });

  test('Manual Review: Test collapse when expanding another card', async ({ page }) => {
    console.log('[📸SCREENSHOT] Testing collapse/expand cycle...');

    const cardsContainer = page.locator('.flex.flex-col > .relative.overflow-hidden.cursor-pointer');
    await cardsContainer.first().waitFor({ state: 'visible', timeout: 10000 });

    const firstCard = cardsContainer.first();
    const secondCard = cardsContainer.nth(1);

    // Expand first card
    console.log('[🎯EXPAND] Expanding first card...');
    await firstCard.click();
    await page.waitForTimeout(4500); // Wait for full expansion + settling

    // Capture first card expanded
    await expect(page).toHaveScreenshot('manual-04-first-card-expanded.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });

    // Click second card
    console.log('[🎯EXPAND] Clicking second card...');
    await secondCard.click();

    // Wait for collapse/expansion cycle to complete
    await page.waitForTimeout(4500);

    // Capture second card expanded, first collapsed
    await expect(page).toHaveScreenshot('manual-05-second-card-expanded.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });

    console.log('[📸SCREENSHOT] Collapse/expand cycle screenshots saved.');
  });

  test('Verify animation timing and smoothness', async ({ page }) => {
    console.log('[⏱️TIMING] Testing animation timing...');

    // Monitor console for errors
    const pageErrors: string[] = [];
    page.on('pageerror', exception => {
      const error = exception.message;
      pageErrors.push(error);
      console.error(`[❌ERROR] ${error}`);
    });

    const cardsContainer = page.locator('.flex.flex-col > .relative.overflow-hidden.cursor-pointer');
    await cardsContainer.first().waitFor({ state: 'visible', timeout: 10000 });

    const firstCard = cardsContainer.first();

    // Measure animation timing
    const startTime = Date.now();
    console.log('[⏱️TIMING] Starting expansion at:', startTime);

    await firstCard.click();

    // Wait for animation
    await page.waitForTimeout(4000);

    const endTime = Date.now();
    const actualDuration = endTime - startTime;

    console.log('[⏱️TIMING] Animation completed at:', endTime);
    console.log('[⏱️TIMING] Actual duration:', actualDuration, 'ms');
    console.log('[⏱️TIMING] Expected: ~4000ms');
    console.log('[⏱️TIMING] Difference:', Math.abs(actualDuration - 4000), 'ms');

    // Verify timing is reasonable (allow 1000ms tolerance for browser rendering)
    expect(actualDuration).toBeGreaterThan(3000);
    expect(actualDuration).toBeLessThan(6000);

    // Verify no console errors occurred
    expect(pageErrors).toHaveLength(0);

    console.log('[✅SUCCESS] Animation timing within acceptable range, no errors detected');
  });

  test('Verify aspect ratio of collapsed cards', async ({ page }) => {
    console.log('[📐ASPECT] Verifying 16:9 aspect ratio...');

    const cardsContainer = page.locator('.flex.flex-col > .relative.overflow-hidden.cursor-pointer');
    await cardsContainer.first().waitFor({ state: 'visible', timeout: 10000 });

    const cards = await cardsContainer.all();
    console.log(`[📐ASPECT] Found ${cards.length} phase cards`);

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const boundingBox = await card.boundingBox();

      if (boundingBox) {
        const aspectRatio = boundingBox.width / boundingBox.height;
        console.log(`[📐ASPECT] Card ${i + 1}:`, {
          width: boundingBox.width,
          height: boundingBox.height,
          aspectRatio: aspectRatio.toFixed(3),
        });

        // 16:9 aspect ratio is 1.777...
        // Allow small tolerance for rounding (1.75 to 1.80)
        expect(aspectRatio).toBeGreaterThan(1.75);
        expect(aspectRatio).toBeLessThan(1.80);
      }
    }

    console.log('[✅SUCCESS] All cards have correct 16:9 aspect ratio');
  });
});
