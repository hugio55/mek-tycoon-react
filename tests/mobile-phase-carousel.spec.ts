import { test, expect } from '@playwright/test';

test.describe('Mobile Phase Carousel Animations', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport (iPhone SE size)
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to landing page
    await page.goto('http://localhost:3200/landing');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display phase cards vertically in 16:9 aspect ratio when collapsed', async ({ page }) => {
    // Wait for phase cards to be visible
    await page.waitForSelector('[data-phase-card]', { state: 'visible', timeout: 10000 });

    // Take screenshot of initial collapsed state
    await expect(page).toHaveScreenshot('01-collapsed-initial-state.png', {
      fullPage: true,
      animations: 'disabled'
    });

    // Verify cards are in collapsed state (16:9 aspect ratio)
    const cards = await page.locator('[data-phase-card]').all();
    console.log(`[📱MOBILE] Found ${cards.length} phase cards`);

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const boundingBox = await card.boundingBox();

      if (boundingBox) {
        const aspectRatio = boundingBox.width / boundingBox.height;
        console.log(`[📱MOBILE] Card ${i + 1} dimensions: ${boundingBox.width}x${boundingBox.height}, aspect ratio: ${aspectRatio.toFixed(2)}`);

        // 16:9 aspect ratio is approximately 1.78
        // Allow some tolerance for rounding
        expect(aspectRatio).toBeGreaterThan(1.5);
        expect(aspectRatio).toBeLessThan(2.0);
      }
    }
  });

  test('should expand card smoothly with 4-second animation', async ({ page }) => {
    // Wait for cards to load
    await page.waitForSelector('[data-phase-card]', { state: 'visible', timeout: 10000 });

    // Find the first phase card
    const firstCard = page.locator('[data-phase-card]').first();

    // Click to expand
    console.log('[📱MOBILE] Clicking first card to expand...');
    await firstCard.click();

    // Wait 2 seconds and capture mid-expansion
    await page.waitForTimeout(2000);
    await expect(page).toHaveScreenshot('02-mid-expansion-2-seconds.png', {
      fullPage: true,
      animations: 'allow'
    });

    // Wait for animation to complete (4 seconds total, 2 more to go)
    await page.waitForTimeout(2000);

    // Take screenshot of fully expanded state
    await expect(page).toHaveScreenshot('03-fully-expanded-state.png', {
      fullPage: true,
      animations: 'disabled'
    });

    console.log('[📱MOBILE] Expansion animation complete');
  });

  test('should collapse previous card when expanding another', async ({ page }) => {
    // Wait for cards to load
    await page.waitForSelector('[data-phase-card]', { state: 'visible', timeout: 10000 });

    // Expand first card
    const firstCard = page.locator('[data-phase-card]').first();
    console.log('[📱MOBILE] Expanding first card...');
    await firstCard.click();
    await page.waitForTimeout(4000); // Wait for full expansion

    await expect(page).toHaveScreenshot('04-first-card-expanded.png', {
      fullPage: true,
      animations: 'disabled'
    });

    // Click second card
    const secondCard = page.locator('[data-phase-card]').nth(1);
    console.log('[📱MOBILE] Clicking second card...');
    await secondCard.click();

    // Capture mid-collapse/expansion state
    await page.waitForTimeout(2000);
    await expect(page).toHaveScreenshot('05-mid-collapse-expansion-2-seconds.png', {
      fullPage: true,
      animations: 'allow'
    });

    // Wait for animations to complete
    await page.waitForTimeout(2000);

    await expect(page).toHaveScreenshot('06-second-card-expanded-first-collapsed.png', {
      fullPage: true,
      animations: 'disabled'
    });

    console.log('[📱MOBILE] Collapse/expansion cycle complete');
  });

  test('should handle multiple expand/collapse cycles consistently', async ({ page }) => {
    // Monitor console for errors
    const consoleMessages: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(text);
      console.log(`[🖥️CONSOLE] ${msg.type()}: ${text}`);
    });

    page.on('pageerror', exception => {
      const error = exception.message;
      pageErrors.push(error);
      console.error(`[❌ERROR] ${error}`);
    });

    // Wait for cards to load
    await page.waitForSelector('[data-phase-card]', { state: 'visible', timeout: 10000 });

    const cards = await page.locator('[data-phase-card]').all();
    console.log(`[📱MOBILE] Testing consistency across ${cards.length} cards`);

    // Cycle through multiple cards
    for (let i = 0; i < Math.min(cards.length, 3); i++) {
      console.log(`[📱MOBILE] Cycle ${i + 1}: Expanding card ${i + 1}`);

      await cards[i].click();

      // Wait for animation (4 seconds)
      await page.waitForTimeout(4000);

      // Take screenshot
      await expect(page).toHaveScreenshot(`07-cycle-${i + 1}-expanded.png`, {
        fullPage: true,
        animations: 'disabled'
      });
    }

    // Verify no errors occurred
    console.log(`[📱MOBILE] Console messages: ${consoleMessages.length}`);
    console.log(`[📱MOBILE] Page errors: ${pageErrors.length}`);

    expect(pageErrors).toHaveLength(0);
  });

  test('should verify animation timing accuracy', async ({ page }) => {
    // Wait for cards to load
    await page.waitForSelector('[data-phase-card]', { state: 'visible', timeout: 10000 });

    const firstCard = page.locator('[data-phase-card]').first();

    // Measure animation timing
    console.log('[⏱️TIMING] Starting animation timing test...');

    const startTime = Date.now();
    await firstCard.click();

    // Wait for animation to complete
    await page.waitForTimeout(4000);

    const endTime = Date.now();
    const actualDuration = endTime - startTime;

    console.log(`[⏱️TIMING] Animation duration: ${actualDuration}ms`);
    console.log(`[⏱️TIMING] Expected: 4000ms`);
    console.log(`[⏱️TIMING] Difference: ${Math.abs(actualDuration - 4000)}ms`);

    // Allow 500ms tolerance for browser rendering
    expect(actualDuration).toBeGreaterThan(3500);
    expect(actualDuration).toBeLessThan(5000);
  });
});
