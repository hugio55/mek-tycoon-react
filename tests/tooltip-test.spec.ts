import { test, expect } from '@playwright/test';

test('Tooltip visibility test', async ({ page }) => {
  // Navigate to essence market page
  await page.goto('http://localhost:3200/essence-market');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  console.log('=== Checking for tooltip component ===');

  // Look for the timer element with cursor-help class
  const timerElement = page.locator('.cursor-help').first();

  // Check if the element exists
  const exists = await timerElement.count();
  console.log(`Timer elements found with cursor-help: ${exists}`);

  if (exists > 0) {
    // Get the bounding box to see if it's visible
    const box = await timerElement.boundingBox();
    console.log('Timer element bounding box:', box);

    // Hover over the timer element
    console.log('=== Hovering over timer element ===');
    await timerElement.hover({ force: true });

    // Wait longer for the tooltip animation to complete
    await page.waitForTimeout(1000);

    // Look for the tooltip popup (it should be rendered with fixed positioning and z-[9999])
    const tooltip = page.locator('div.fixed.z-\\[9999\\]').first();
    const tooltipVisible = await tooltip.isVisible().catch(() => false);

    console.log(`Tooltip visible: ${tooltipVisible}`);

    if (tooltipVisible) {
      const tooltipBox = await tooltip.boundingBox();
      console.log('Tooltip bounding box:', tooltipBox);

      // Get the tooltip content
      const tooltipText = await tooltip.textContent();
      console.log('Tooltip content:', tooltipText);
    } else {
      console.log('Tooltip did NOT appear after hover');

      // Check if tooltip element exists in DOM at all
      const tooltipCount = await tooltip.count();
      console.log(`Tooltip elements in DOM: ${tooltipCount}`);

      // Check for console errors
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.waitForTimeout(100);

      if (errors.length > 0) {
        console.log('Console errors found:', errors);
      }
    }
  } else {
    console.log('No timer elements found with cursor-help class');
  }

  // Take a screenshot WHILE HOVERING for visual verification
  if (exists > 0) {
    await timerElement.hover({ force: true });
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: 'tooltip-test.png', fullPage: true });
  console.log('Screenshot saved to tooltip-test.png');
});
