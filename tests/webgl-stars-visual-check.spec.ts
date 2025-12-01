import { test, expect } from '@playwright/test';

test.describe('WebGL Background Stars - Visual Verification', () => {
  test('should visually render background stars', async ({ page }) => {
    // Navigate to landing page
    await page.goto('http://localhost:3200/landing');

    // Wait for animation to start
    await page.waitForTimeout(3000);

    // Wait for stars to be visible (animation stage should be 'stars' or 'logo')
    await page.waitForTimeout(2000);

    // Take full page screenshot
    await page.screenshot({
      path: 'test-results/landing-with-stars.png',
      fullPage: true
    });

    // Take zoomed screenshot of top-left corner (where stars should be)
    await page.screenshot({
      path: 'test-results/stars-top-left-corner.png',
      clip: { x: 0, y: 0, width: 400, height: 400 }
    });

    // Get canvas element and inspect it more closely
    const canvasHandle = await page.locator('canvas').first().elementHandle();

    if (canvasHandle) {
      // Get computed style to check visibility
      const style = await page.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          opacity: computed.opacity,
          visibility: computed.visibility,
          display: computed.display,
          zIndex: computed.zIndex,
          position: computed.position,
        };
      }, canvasHandle);

      console.log('Canvas computed style:', style);

      // Get canvas dimensions and rendering state
      const canvasInfo = await page.evaluate((el: HTMLCanvasElement) => {
        const ctx = el.getContext('webgl') || el.getContext('webgl2');
        return {
          width: el.width,
          height: el.height,
          clientWidth: el.clientWidth,
          clientHeight: el.clientHeight,
          hasWebGLContext: !!ctx,
        };
      }, canvasHandle);

      console.log('Canvas info:', canvasInfo);
    }

    // Check the parent container opacity
    const containerOpacity = await page.evaluate(() => {
      const container = document.querySelector('div[style*="opacity"]');
      if (container) {
        return window.getComputedStyle(container as Element).opacity;
      }
      return 'not found';
    });

    console.log('Container opacity:', containerOpacity);
  });

  test('should render with maximum star settings', async ({ page }) => {
    // Set localStorage to max star settings before navigating
    await page.goto('http://localhost:3200/landing-debug');

    await page.evaluate(() => {
      const config = {
        bgStarCount: 2000,
        bgStarSize: 10.0,
        bgStarMinBrightness: 1.0,
        bgStarMaxBrightness: 1.0,
        bgStarSizeRandomness: 100,
        bgStarTwinkleAmount: 100,
      };
      localStorage.setItem('mek-landing-debug-config', JSON.stringify(config));
    });

    // Navigate to landing to pick up the settings
    await page.goto('http://localhost:3200/landing');

    // Wait for WebGL initialization
    await page.waitForTimeout(5000);

    // Take screenshot
    await page.screenshot({
      path: 'test-results/landing-with-MAX-stars.png',
      fullPage: true
    });

    // Check console for star count
    const logs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[⭐BG-STARS]')) {
        logs.push(text);
        console.log(text);
      }
    });

    await page.waitForTimeout(1000);

    // Look for particleCount in logs
    const particleCountLog = logs.find(log => log.includes('particleCount'));
    console.log('Particle count log:', particleCountLog);
  });
});
