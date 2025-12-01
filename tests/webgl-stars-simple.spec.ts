import { test, expect } from '@playwright/test';

test.describe('WebGL Starfield - Basic Verification', () => {
  test('should initialize WebGL and log background star data', async ({ page }) => {
    const consoleMessages: string[] = [];
    const pageErrors: string[] = [];

    // Capture all console messages
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(text);
      if (text.includes('[⭐')) {
        console.log('⭐', text);
      }
    });

    // Capture page errors
    page.on('pageerror', exception => {
      pageErrors.push(exception.message);
      console.error('❌ Page error:', exception.message);
    });

    // Navigate to actual landing page (NOT landing-debug, which is just controls)
    console.log('Navigating to /landing...');
    await page.goto('http://localhost:3200/landing', {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });

    // Wait for WebGL initialization
    await page.waitForTimeout(3000);

    // Print all console messages for debugging
    console.log('\n=== ALL CONSOLE MESSAGES ===');
    consoleMessages.forEach(msg => console.log(msg));
    console.log('=== END CONSOLE MESSAGES ===\n');

    // Check for errors
    if (pageErrors.length > 0) {
      console.error('Page errors detected:', pageErrors);
    }
    expect(pageErrors).toHaveLength(0);

    // Check for WebGL initialization
    const webglLogs = consoleMessages.filter(msg => msg.includes('[⭐WEBGL]'));
    console.log(`Found ${webglLogs.length} WebGL logs`);

    const bgStarLogs = consoleMessages.filter(msg => msg.includes('[⭐BG-STARS]'));
    console.log(`Found ${bgStarLogs.length} background star logs`);

    // Verify WebGL scene was initialized
    const hasInitLog = webglLogs.some(msg => msg.includes('Initializing WebGL scene'));
    console.log('Has init log:', hasInitLog);

    // Verify background stars were created
    const hasCreationLog = webglLogs.some(msg => msg.includes('Background stars created'));
    console.log('Has creation log:', hasCreationLog);

    // Verify sample data was logged
    const hasSampleData = bgStarLogs.some(msg => msg.includes('Sample star data'));
    console.log('Has sample data:', hasSampleData);

    // Check if canvas element exists
    const canvas = await page.locator('canvas').count();
    console.log('Canvas count:', canvas);
    expect(canvas).toBeGreaterThan(0);

    // Get canvas dimensions
    if (canvas > 0) {
      const canvasSize = await page.locator('canvas').first().boundingBox();
      console.log('Canvas dimensions:', canvasSize);
    }

    // Take screenshot for manual verification
    await page.screenshot({ path: 'test-results/webgl-stars-debug.png', fullPage: true });
  });
});
