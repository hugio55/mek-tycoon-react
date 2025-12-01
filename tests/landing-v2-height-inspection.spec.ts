import { test, expect } from '@playwright/test';

test.describe('Landing V2 - Page Height Inspection', () => {
  test('identify excessive scrollable height', async ({ page }) => {
    // Navigate to the landing page
    await page.goto('http://localhost:3200/landing-v2');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Allow animations to settle

    // Get viewport and document dimensions
    const dimensions = await page.evaluate(() => {
      return {
        viewportHeight: window.innerHeight,
        documentHeight: document.documentElement.scrollHeight,
        bodyHeight: document.body.scrollHeight,
        bodyOffsetHeight: document.body.offsetHeight,
        htmlScrollHeight: document.documentElement.scrollHeight,
      };
    });

    console.log('📏 DIMENSIONS:', dimensions);
    console.log('📊 Excess height:', dimensions.documentHeight - dimensions.viewportHeight);

    // Take screenshot of initial viewport
    await page.screenshot({
      path: 'tests/screenshots/landing-v2-viewport-top.png',
      fullPage: false
    });

    // Scroll to middle
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight / 2));
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'tests/screenshots/landing-v2-viewport-middle.png',
      fullPage: false
    });

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'tests/screenshots/landing-v2-viewport-bottom.png',
      fullPage: false
    });

    // Take full page screenshot
    await page.screenshot({
      path: 'tests/screenshots/landing-v2-fullpage.png',
      fullPage: true
    });

    // Get all elements and their positions
    const elementPositions = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('body *'));
      return elements
        .map(el => {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          return {
            tag: el.tagName,
            id: el.id || '',
            classes: el.className || '',
            top: rect.top,
            bottom: rect.bottom,
            height: rect.height,
            position: style.position,
            display: style.display,
            visibility: style.visibility,
            overflow: style.overflow,
          };
        })
        .filter(el => el.height > 0)
        .sort((a, b) => b.bottom - a.bottom)
        .slice(0, 20); // Top 20 elements by bottom position
    });

    console.log('📦 ELEMENTS BY BOTTOM POSITION (Top 20):');
    elementPositions.forEach((el, i) => {
      console.log(`${i + 1}. ${el.tag}${el.id ? '#' + el.id : ''}${el.classes ? '.' + el.classes.split(' ')[0] : ''}`);
      console.log(`   Bottom: ${el.bottom}px, Height: ${el.height}px, Position: ${el.position}`);
    });

    // Check for elements positioned with large vh values
    const largeVhElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      return elements
        .map(el => {
          const style = window.getComputedStyle(el);
          return {
            tag: el.tagName,
            id: el.id || '',
            classes: el.className || '',
            top: style.top,
            bottom: style.bottom,
            transform: style.transform,
            position: style.position,
          };
        })
        .filter(el =>
          el.top?.includes('vh') ||
          el.bottom?.includes('vh') ||
          el.transform?.includes('translate')
        );
    });

    console.log('📐 ELEMENTS WITH VH OR TRANSFORM:');
    console.log(JSON.stringify(largeVhElements, null, 2));

    // Check logo specifically
    const logoInfo = await page.evaluate(() => {
      const logo = document.querySelector('.absolute.left-1\\/2.transform.-translate-x-1\\/2') ||
                    document.querySelector('img[alt*="logo"]') ||
                    document.querySelector('[class*="logo"]');
      if (!logo) return null;

      const rect = logo.getBoundingClientRect();
      const style = window.getComputedStyle(logo);
      return {
        tag: logo.tagName,
        classes: logo.className,
        top: style.top,
        transform: style.transform,
        position: style.position,
        rectTop: rect.top,
        rectBottom: rect.bottom,
        height: rect.height,
      };
    });

    console.log('🎨 LOGO INFO:', logoInfo);

    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    const mobileDimensions = await page.evaluate(() => {
      return {
        viewportHeight: window.innerHeight,
        documentHeight: document.documentElement.scrollHeight,
        bodyHeight: document.body.scrollHeight,
      };
    });

    console.log('📱 MOBILE DIMENSIONS:', mobileDimensions);
    console.log('📊 Mobile excess height:', mobileDimensions.documentHeight - mobileDimensions.viewportHeight);

    await page.screenshot({
      path: 'tests/screenshots/landing-v2-mobile-fullpage.png',
      fullPage: true
    });

    // Scroll to bottom on mobile
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'tests/screenshots/landing-v2-mobile-bottom.png',
      fullPage: false
    });
  });
});
