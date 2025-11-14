import { test, expect } from '@playwright/test';

test.describe('WebGL Background Stars', () => {
  test('should render background stars at maximum settings', async ({ page }) => {
    // Navigate to the landing debug page
    await page.goto('http://localhost:3200/landing-debug');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Scroll to the Background Stars section
    await page.locator('text=Background Stars (Static)').scrollIntoViewIfNeeded();

    // Set Number of Stars to 2000
    const starCountSlider = page.locator('input[type="range"]').filter({
      has: page.locator('text=Number of Stars')
    });
    await starCountSlider.fill('2000');

    // Set Min Brightness to 1.00 (100%)
    const minBrightnessSlider = page.locator('input[type="range"]').filter({
      has: page.locator('text=Min Brightness')
    });
    await minBrightnessSlider.fill('100');

    // Set Max Brightness to 1.00 (100%)
    const maxBrightnessSlider = page.locator('input[type="range"]').filter({
      has: page.locator('text=Max Brightness')
    });
    await maxBrightnessSlider.fill('100');

    // Set Size Randomness to 40%
    const sizeRandomnessSlider = page.locator('input[type="range"]').filter({
      has: page.locator('text=Size Randomness')
    });
    await sizeRandomnessSlider.fill('40');

    // Wait a moment for WebGL to update
    await page.waitForTimeout(1000);

    // Listen for console messages
    const consoleMessages: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[⭐WEBGL]') || text.includes('[⭐BG-STARS]')) {
        consoleMessages.push(text);
        console.log('Console:', text);
      }
    });

    page.on('pageerror', exception => {
      pageErrors.push(exception.message);
      console.error('Page error:', exception.message);
    });

    // Trigger a refresh to see console logs
    await page.reload();
    await page.waitForTimeout(2000); // Wait for WebGL initialization

    // Check for errors
    expect(pageErrors).toHaveLength(0);

    // Check that we have console logs indicating stars were created
    const hasStarCreationLog = consoleMessages.some(msg =>
      msg.includes('[⭐WEBGL] Background stars created')
    );
    expect(hasStarCreationLog).toBe(true);

    // Take a screenshot to verify visual rendering
    await expect(page).toHaveScreenshot('background-stars-max-settings.png', {
      animations: 'disabled',
      maxDiffPixelRatio: 0.05, // Allow 5% difference for anti-aliasing
    });

    // Check THREE.js scene via browser console
    const sceneInfo = await page.evaluate(() => {
      // Access WebGL component's scene (need to add global reference for testing)
      const canvas = document.querySelector('canvas');
      if (!canvas) return { error: 'No canvas found' };

      // Try to access THREE via window
      const THREE = (window as any).THREE;
      if (!THREE) return { error: 'THREE.js not accessible' };

      return {
        hasCanvas: !!canvas,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
      };
    });

    console.log('Scene info:', sceneInfo);

    // Verify canvas exists
    expect(sceneInfo.hasCanvas).toBe(true);
  });

  test('should show console debug info for background stars', async ({ page }) => {
    const consoleMessages: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(text);
    });

    await page.goto('http://localhost:3200/landing-debug');
    await page.waitForTimeout(3000); // Wait for initialization and animation frames

    // Filter for background star logs
    const bgStarLogs = consoleMessages.filter(msg => msg.includes('[⭐BG-STARS]'));

    console.log('Background star logs:');
    bgStarLogs.forEach(log => console.log(log));

    // Should have at least creation log and animation frame logs
    expect(bgStarLogs.length).toBeGreaterThan(0);

    // Check for sample data log
    const hasSampleData = bgStarLogs.some(msg => msg.includes('Sample star data'));
    expect(hasSampleData).toBe(true);

    // Check for animation frame log
    const hasAnimationFrame = bgStarLogs.some(msg => msg.includes('Animation frame'));
    expect(hasAnimationFrame).toBe(true);
  });
});
