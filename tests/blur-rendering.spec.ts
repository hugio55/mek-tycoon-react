import { test, expect } from '@playwright/test';

test.describe('Phase Carousel Backdrop Blur Testing', () => {
  test('check backdrop-filter blur rendering on phase cards', async ({ page }) => {
    // Navigate to landing page
    await page.goto('http://localhost:3200/landing');

    // Wait for carousel to appear
    await page.waitForSelector('.phase-card', { timeout: 10000 });

    // Get all phase cards
    const phaseCards = page.locator('.phase-card');
    const cardCount = await phaseCards.count();
    console.log(`[🔍BLUR-TEST] Found ${cardCount} phase cards`);

    // Test the first card
    const firstCard = phaseCards.first();

    // Take screenshot before hover
    await page.screenshot({
      path: 'tests/screenshots/blur-before-hover.png',
      fullPage: false
    });
    console.log('[🔍BLUR-TEST] Screenshot taken: before hover');

    // Get computed styles before hover
    const beforeHoverStyles = await firstCard.evaluate((el) => {
      const computedStyle = window.getComputedStyle(el);
      return {
        backdropFilter: computedStyle.backdropFilter,
        webkitBackdropFilter: computedStyle.webkitBackdropFilter,
        background: computedStyle.background,
        backgroundColor: computedStyle.backgroundColor,
      };
    });
    console.log('[🔍BLUR-TEST] Before hover styles:', beforeHoverStyles);

    // Hover over the card
    await firstCard.hover();
    await page.waitForTimeout(500); // Wait for transition

    // Take screenshot after hover
    await page.screenshot({
      path: 'tests/screenshots/blur-after-hover.png',
      fullPage: false
    });
    console.log('[🔍BLUR-TEST] Screenshot taken: after hover');

    // Get computed styles after hover
    const afterHoverStyles = await firstCard.evaluate((el) => {
      const computedStyle = window.getComputedStyle(el);
      return {
        backdropFilter: computedStyle.backdropFilter,
        webkitBackdropFilter: computedStyle.webkitBackdropFilter,
        background: computedStyle.background,
        backgroundColor: computedStyle.backgroundColor,
      };
    });
    console.log('[🔍BLUR-TEST] After hover styles:', afterHoverStyles);

    // Check if blur overlay element exists
    const blurOverlay = page.locator('.blur-sync-overlay');
    const blurOverlayExists = await blurOverlay.count() > 0;
    console.log('[🔍BLUR-TEST] Blur overlay exists:', blurOverlayExists);

    if (blurOverlayExists) {
      const overlayStyles = await blurOverlay.first().evaluate((el) => {
        const computedStyle = window.getComputedStyle(el);
        return {
          backdropFilter: computedStyle.backdropFilter,
          webkitBackdropFilter: computedStyle.webkitBackdropFilter,
          display: computedStyle.display,
          opacity: computedStyle.opacity,
          position: computedStyle.position,
        };
      });
      console.log('[🔍BLUR-TEST] Blur overlay styles:', overlayStyles);
    }

    // Check console for blur-sync logs
    page.on('console', msg => {
      if (msg.text().includes('[🔍BLUR-SYNC]')) {
        console.log('[🔍BLUR-TEST] Console log:', msg.text());
      }
    });

    // Check if backdrop-filter is supported
    const isBackdropFilterSupported = await page.evaluate(() => {
      const div = document.createElement('div');
      div.style.backdropFilter = 'blur(10px)';
      return div.style.backdropFilter !== '';
    });
    console.log('[🔍BLUR-TEST] Browser supports backdrop-filter:', isBackdropFilterSupported);

    // Check if card has blur-related classes
    const cardClasses = await firstCard.getAttribute('class');
    console.log('[🔍BLUR-TEST] Card classes:', cardClasses);

    // Summary
    console.log('\n[🔍BLUR-TEST] SUMMARY:');
    console.log('- Browser supports backdrop-filter:', isBackdropFilterSupported);
    console.log('- Blur overlay exists:', blurOverlayExists);
    console.log('- Backdrop-filter before hover:', beforeHoverStyles.backdropFilter);
    console.log('- Backdrop-filter after hover:', afterHoverStyles.backdropFilter);
    console.log('- Screenshots saved to tests/screenshots/');
  });
});
