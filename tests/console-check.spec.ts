import { test, expect } from '@playwright/test';

test.describe('Homepage Console Check', () => {
  test('should check console for errors and verify page state', async ({ page }) => {
    const consoleMessages: { type: string; text: string }[] = [];
    const pageErrors: string[] = [];

    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      consoleMessages.push({ type, text });
      console.log(`[CONSOLE ${type.toUpperCase()}] ${text}`);
    });

    page.on('pageerror', exception => {
      pageErrors.push(exception.message);
      console.log(`[PAGE ERROR] ${exception.message}`);
    });

    console.log('\n=== Navigating to homepage ===\n');
    await page.goto('/', { waitUntil: 'networkidle' });

    await page.waitForTimeout(3000);

    console.log('\n=== Checking Page State ===');
    const pageState = await page.evaluate(() => {
      const goldElements = document.querySelectorAll('[data-testid*="gold"], .gold, [class*="gold"]');
      const goldText = Array.from(goldElements).map(el => el.textContent).join(', ');

      return {
        url: window.location.href,
        title: document.title,
        goldElements: goldText,
        bodyClasses: document.body.className
      };
    });

    console.log('Page URL:', pageState.url);
    console.log('Page Title:', pageState.title);
    console.log('Gold Elements:', pageState.goldElements);

    await page.screenshot({ path: 'tests/homepage-state.png', fullPage: true });
    console.log('Screenshot saved to: tests/homepage-state.png');

    console.log('\n=== SUMMARY ===');
    console.log(`Total console messages: ${consoleMessages.length}`);
    console.log(`Console errors: ${consoleMessages.filter(m => m.type === 'error').length}`);
    console.log(`Console warnings: ${consoleMessages.filter(m => m.type === 'warning').length}`);
    console.log(`Page errors: ${pageErrors.length}`);

    if (pageErrors.length > 0) {
      console.log('\n=== PAGE ERRORS ===');
      pageErrors.forEach((err, i) => console.log(`${i + 1}. ${err}`));
    }

    const errors = consoleMessages.filter(m => m.type === 'error');
    if (errors.length > 0) {
      console.log('\n=== CONSOLE ERRORS ===');
      errors.forEach((err, i) => console.log(`${i + 1}. ${err.text}`));
    }

    const warnings = consoleMessages.filter(m => m.type === 'warning');
    if (warnings.length > 0) {
      console.log('\n=== CONSOLE WARNINGS ===');
      warnings.forEach((warn, i) => console.log(`${i + 1}. ${warn.text}`));
    }

    expect(pageErrors).toHaveLength(0);
  });
});
