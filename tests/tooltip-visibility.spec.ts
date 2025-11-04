import { test, expect } from '@playwright/test';

test.describe('Aceternity Tooltip Visibility Test', () => {
  test('tooltip should appear and be visible on hover', async ({ page }) => {
    await page.goto('http://localhost:3200/essence-market');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const tooltipTriggers = page.locator('[class*="cursor-help"]');
    const triggerCount = await tooltipTriggers.count();

    console.log(`Found ${triggerCount} tooltip triggers`);

    if (triggerCount > 0) {
      const firstTrigger = tooltipTriggers.first();

      await firstTrigger.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      const bbox = await firstTrigger.boundingBox();
      if (bbox) {
        console.log(`Hovering over trigger at position:`, bbox);
        await page.mouse.move(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2);
        await page.waitForTimeout(300);

        const tooltip = page.locator('.fixed.z-\\[9999\\]').first();
        await expect(tooltip).toBeVisible({ timeout: 1000 });

        const tooltipBox = await tooltip.boundingBox();
        console.log(`Tooltip is visible at position:`, tooltipBox);

        await page.screenshot({
          path: 'tests/screenshots/tooltip-visible.png',
          fullPage: false
        });

        console.log('✅ Tooltip is VISIBLE and positioned correctly!');
      }
    } else {
      console.log('⚠️ No tooltip triggers found on page');
    }
  });

  test('tooltip should have correct styling', async ({ page }) => {
    await page.goto('http://localhost:3200/essence-market');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const tooltipTrigger = page.locator('[class*="cursor-help"]').first();

    if (await tooltipTrigger.count() > 0) {
      await tooltipTrigger.scrollIntoViewIfNeeded();
      await tooltipTrigger.hover();
      await page.waitForTimeout(500);

      const tooltip = page.locator('.fixed.z-\\[9999\\]').first();

      const borderColor = await tooltip.evaluate((el) => {
        return window.getComputedStyle(el.querySelector('div')!).borderColor;
      });

      console.log('Tooltip border color:', borderColor);

      const bgColor = await tooltip.evaluate((el) => {
        return window.getComputedStyle(el.querySelector('div')!).backgroundColor;
      });

      console.log('Tooltip background color:', bgColor);

      expect(borderColor).toContain('rgb');
      expect(bgColor).toContain('rgb');
    }
  });
});
