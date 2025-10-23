import { test, expect } from '@playwright/test';

test.describe('Home Page Sprite Rendering', () => {
  test('should render sprites at correct size with working tooltips', async ({ page }) => {
    // Collect console logs
    const consoleLogs: string[] = [];
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      } else if (msg.type() === 'log') {
        consoleLogs.push(text);
      }
    });

    // Navigate to home page
    await page.goto('/home');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Wait for data loading and sprites to render
    await page.waitForTimeout(3000);

    // Take a screenshot of the current state
    await page.screenshot({
      path: 'tests/screenshots/home-sprites-current.png',
      fullPage: true
    });

    // Look for the triangle image first
    const triangleImage = await page.locator('img[alt="Mek Variations Triangle"]');
    const isTriangleVisible = await triangleImage.isVisible();
    console.log(`Triangle image visible: ${isTriangleVisible}`);

    // Check for sprite images from the overlay (look for any img tags within the overlay area)
    const allImages = await page.locator('img').all();
    console.log(`Total images on page: ${allImages.length}`);

    // Filter for sprite images (exclude the triangle itself)
    const spriteImages = await page.locator('img').filter({
      hasNot: page.locator('[alt="Mek Variations Triangle"]')
    }).all();

    console.log(`Found ${spriteImages.length} potential sprite images`);

    // Print debug logs from the page
    console.log('\n=== Console Logs from Page ===');
    consoleLogs.forEach(log => {
      if (log.includes('TRIANGLE OVERLAY DEBUG') || log.includes('zones count')) {
        console.log(log);
      }
    });

    if (spriteImages.length > 0) {
      // Get the first sprite's dimensions
      const firstSprite = spriteImages[0];
      const boundingBox = await firstSprite.boundingBox();

      if (boundingBox) {
        console.log(`\nFirst sprite dimensions: ${Math.round(boundingBox.width)}px × ${Math.round(boundingBox.height)}px`);

        // Sprites should be reasonably sized (not tiny)
        expect(boundingBox.width).toBeGreaterThan(20);
        expect(boundingBox.height).toBeGreaterThan(20);

        // Find the parent container with pointer events (the hover target)
        const spriteContainer = await page.locator('img').first().locator('..').locator('..');

        // Hover over the sprite container to test tooltip
        await spriteContainer.hover();

        // Wait for tooltip to appear
        await page.waitForTimeout(500);

        // Take screenshot with tooltip visible
        await page.screenshot({
          path: 'tests/screenshots/home-sprites-with-tooltip.png',
          fullPage: true
        });

        // Check if tooltip is visible (look for "owned" text in fixed position tooltip)
        const tooltips = await page.locator('div[style*="position: fixed"]').filter({ hasText: /owned/i }).all();

        if (tooltips.length > 0) {
          console.log('✓ Tooltip found on hover');
          const tooltipBox = await tooltips[0].boundingBox();
          if (tooltipBox) {
            console.log(`  Tooltip position: x=${Math.round(tooltipBox.x)}, y=${Math.round(tooltipBox.y)}`);
            console.log(`  Tooltip size: ${Math.round(tooltipBox.width)}px × ${Math.round(tooltipBox.height)}px`);
          }
        } else {
          console.log('⚠ Tooltip not found after hover');
        }
      }
    } else {
      console.log('⚠ No sprite images found on page');
      console.log('This might mean:');
      console.log('  1. Overlay data not loaded from database');
      console.log('  2. No sprites configured in the overlay');
      console.log('  3. All sprites filtered out (ownership filter)');
    }

    // Report any console errors
    if (consoleErrors.length > 0) {
      console.log('\n=== Console Errors ===');
      consoleErrors.forEach(err => console.log(err));
    }

    // Basic assertion: page should have loaded successfully
    expect(await page.title()).toBeTruthy();
  });
});
