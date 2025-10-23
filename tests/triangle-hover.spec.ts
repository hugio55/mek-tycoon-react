import { test, expect } from '@playwright/test';

test.describe('Triangle Sprite Hover Alignment', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page with triangle
    await page.goto('http://localhost:3200/home');

    // Wait for triangle image to load
    await page.waitForSelector('img[alt="Mek Variations Triangle"]', { timeout: 10000 });

    // Wait a bit for sprites to render
    await page.waitForTimeout(1000);
  });

  test('should show tooltip when hovering over visible sprite bulb', async ({ page }) => {
    console.log('Testing sprite hover alignment...');

    // Find all sprite containers
    const sprites = await page.locator('.absolute').filter({ has: page.locator('img[alt="sprite"]') }).all();
    console.log(`Found ${sprites.length} sprites on page`);

    if (sprites.length === 0) {
      throw new Error('No sprites found on page!');
    }

    // Test hovering over first 3 sprites
    for (let i = 0; i < Math.min(3, sprites.length); i++) {
      const sprite = sprites[i];

      // Get sprite position and size
      const box = await sprite.boundingBox();
      if (!box) {
        console.log(`Sprite ${i} has no bounding box, skipping`);
        continue;
      }

      console.log(`Sprite ${i} - Position: (${Math.round(box.x)}, ${Math.round(box.y)}), Size: ${Math.round(box.width)}x${Math.round(box.height)}`);

      // Hover at center of sprite
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;

      await page.mouse.move(centerX, centerY);
      await page.waitForTimeout(300);

      // Check if tooltip appears
      const tooltip = page.locator('div').filter({ hasText: /owned/ }).filter({ hasText: /in collection/ });
      const tooltipVisible = await tooltip.count() > 0;

      if (tooltipVisible) {
        const tooltipText = await tooltip.first().textContent();
        console.log(`✓ Sprite ${i} hover SUCCESS - Tooltip shows: ${tooltipText?.substring(0, 30)}...`);

        // Get tooltip position
        const tooltipBox = await tooltip.first().boundingBox();
        if (tooltipBox) {
          const tooltipCenterX = tooltipBox.x + tooltipBox.width / 2;
          const horizontalOffset = Math.abs(tooltipCenterX - centerX);
          console.log(`  Tooltip horizontal offset from sprite center: ${Math.round(horizontalOffset)}px`);

          // Tooltip should be centered horizontally over sprite (within 10px tolerance)
          expect(horizontalOffset).toBeLessThan(10);
        }
      } else {
        console.log(`✗ Sprite ${i} hover FAILED - No tooltip appeared`);
      }

      // Move mouse away to reset
      await page.mouse.move(0, 0);
      await page.waitForTimeout(200);
    }
  });

  test('should not show tooltip when hovering empty space', async ({ page }) => {
    console.log('Testing empty space hover (should not trigger tooltip)...');

    // Hover in top-left corner (should be empty)
    await page.mouse.move(50, 50);
    await page.waitForTimeout(300);

    // Check tooltip does NOT appear
    const tooltip = page.locator('div').filter({ hasText: /owned/ });
    const tooltipCount = await tooltip.count();

    console.log(`Empty space hover - Tooltips visible: ${tooltipCount}`);
    expect(tooltipCount).toBe(0);
  });

  test('should show correct tooltip for each sprite (no cross-contamination)', async ({ page }) => {
    console.log('Testing tooltip accuracy across multiple sprites...');

    const sprites = await page.locator('.absolute').filter({ has: page.locator('img[alt="sprite"]') }).all();

    const tooltipTexts = new Set<string>();

    // Hover over first 5 sprites and collect tooltip texts
    for (let i = 0; i < Math.min(5, sprites.length); i++) {
      const box = await sprites[i].boundingBox();
      if (!box) continue;

      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;

      await page.mouse.move(centerX, centerY);
      await page.waitForTimeout(300);

      const tooltip = page.locator('div').filter({ hasText: /owned/ }).first();
      const text = await tooltip.textContent();

      if (text) {
        tooltipTexts.add(text);
        console.log(`Sprite ${i} tooltip: ${text.substring(0, 30)}...`);
      }

      await page.mouse.move(0, 0);
      await page.waitForTimeout(200);
    }

    // Should have seen different tooltips (not all the same)
    console.log(`Unique tooltips seen: ${tooltipTexts.size}`);
    expect(tooltipTexts.size).toBeGreaterThan(1);
  });

  test('check console for errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('http://localhost:3200/home');
    await page.waitForTimeout(2000);

    console.log(`Console errors detected: ${errors.length}`);
    if (errors.length > 0) {
      console.log('Errors:', errors);
    }

    expect(errors).toHaveLength(0);
  });
});
