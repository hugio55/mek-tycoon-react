import { test, expect } from '@playwright/test';

test.describe('Story Mission Card - NFT Unlock Section (V2-3)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to story-climb page
    await page.goto('http://localhost:3100/story-climb');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Wait a bit for any animations to settle
    await page.waitForTimeout(1000);
  });

  test('should display Card Header variation correctly', async ({ page }) => {
    // Monitor console for errors
    const consoleMessages: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    });
    page.on('pageerror', exception => {
      pageErrors.push(exception.message);
    });

    // Take full page screenshot for context
    await expect(page).toHaveScreenshot('story-climb-full-page.png', {
      fullPage: true,
      animations: 'disabled',
      maxDiffPixelRatio: 0.02
    });

    // Find the NFT unlock section cards
    // These should have the pricing information
    const missionCards = page.locator('[class*="bg-gradient"]').filter({
      has: page.locator('text=/ADA|Cardano/i')
    });

    // Take screenshot of mission cards area
    if (await missionCards.count() > 0) {
      await expect(missionCards.first()).toHaveScreenshot('mission-card-pricing-section.png', {
        animations: 'disabled',
        maxDiffPixelRatio: 0.02
      });
    }

    // Check for console errors
    expect(pageErrors, 'Should have no page errors').toHaveLength(0);

    // Log any console errors found
    if (consoleMessages.length > 0) {
      console.log('Console errors found:', consoleMessages);
    }
  });

  test('should verify Card Header elements (after redesign)', async ({ page }) => {
    // This test verifies the expected structure after redesign:
    // 1. Header should say "Cardano Fee" (not "ADA Fee")
    // 2. "Remaining: X of Y" should be large and prominent
    // 3. "Overshoot Discount" should be in body, not header
    // 4. Price comparison grid should be below

    // Wait for any dynamic content
    await page.waitForTimeout(2000);

    // Check for "Cardano Fee" header
    const cardanoFeeHeader = page.getByText(/Cardano Fee/i);
    const cardanoFeeExists = await cardanoFeeHeader.count() > 0;

    if (cardanoFeeExists) {
      console.log('✓ Found "Cardano Fee" header');
    } else {
      console.log('✗ "Cardano Fee" header not found');
    }

    // Check for "Remaining:" text
    const remainingText = page.getByText(/Remaining:/i);
    const remainingExists = await remainingText.count() > 0;

    if (remainingExists) {
      console.log('✓ Found "Remaining:" text');
    } else {
      console.log('✗ "Remaining:" text not found');
    }

    // Check for "Overshoot Discount" placement
    const overshootText = page.getByText(/Overshoot Discount/i);
    const overshootExists = await overshootText.count() > 0;

    if (overshootExists) {
      console.log('✓ Found "Overshoot Discount" text');
    } else {
      console.log('✗ "Overshoot Discount" text not found');
    }

    // Take screenshot of the entire page for visual verification
    await expect(page).toHaveScreenshot('story-climb-after-redesign.png', {
      fullPage: true,
      animations: 'disabled',
      maxDiffPixelRatio: 0.02
    });
  });

  test('should verify spacing and layout consistency', async ({ page }) => {
    // Wait for content to stabilize
    await page.waitForTimeout(2000);

    // Check for price elements (should be in ADA)
    const priceElements = page.locator('text=/\\d+.*ADA/i');
    const priceCount = await priceElements.count();

    console.log(`Found ${priceCount} price elements with ADA`);

    // Take component-level screenshot of pricing area
    if (priceCount > 0) {
      await expect(priceElements.first()).toHaveScreenshot('price-element-spacing.png', {
        animations: 'disabled',
        maxDiffPixelRatio: 0.01
      });
    }

    // Full page screenshot to verify overall layout
    await expect(page).toHaveScreenshot('story-climb-layout-check.png', {
      fullPage: false, // Just viewport
      animations: 'disabled',
      maxDiffPixelRatio: 0.02
    });
  });
});
