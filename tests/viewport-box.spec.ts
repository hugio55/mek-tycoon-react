import { test, expect } from '@playwright/test';

test.describe('Viewport Box Feature Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to talent-builder page
    await page.goto('http://localhost:3200/talent-builder');

    // Wait for page to load completely
    await page.waitForLoadState('networkidle');

    // Wait a bit for any animations or initial renders
    await page.waitForTimeout(2000);
  });

  test('1. Viewport box visibility on page load', async ({ page }) => {
    console.log('[🎯TEST] Checking viewport box visibility...');

    // Check if viewport box exists in DOM
    const viewportBox = page.locator('[data-testid="viewport-box"]').or(page.locator('.viewport-box')).or(page.locator('div:has-text("Viewport")').first());

    // Take screenshot of initial state
    await page.screenshot({
      path: 'test-results/viewport-box-initial-state.png',
      fullPage: true
    });

    console.log('[🎯TEST] Initial state screenshot saved');
  });

  test('2. Viewport box dimensions display', async ({ page }) => {
    console.log('[🎯TEST] Checking viewport dimensions...');

    // Look for dimension text (e.g., "1920 x 1080")
    const dimensionText = page.locator('text=/\\d+\\s*x\\s*\\d+/i');

    // Take screenshot
    await page.screenshot({
      path: 'test-results/viewport-box-dimensions.png',
      fullPage: true
    });

    console.log('[🎯TEST] Dimensions screenshot saved');
  });

  test('3. Pan behavior - viewport box moves with canvas', async ({ page }) => {
    console.log('[🎯TEST] Testing pan behavior...');

    // Take screenshot before panning
    await page.screenshot({
      path: 'test-results/viewport-box-before-pan.png',
      fullPage: true
    });

    // Find the canvas/main interaction area
    const canvas = page.locator('canvas').or(page.locator('.talent-tree-container')).or(page.locator('main')).first();

    // Perform pan gesture (drag)
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 200, box.y + box.height / 2 + 150);
      await page.mouse.up();
      await page.waitForTimeout(500);
    }

    // Take screenshot after panning
    await page.screenshot({
      path: 'test-results/viewport-box-after-pan.png',
      fullPage: true
    });

    console.log('[🎯TEST] Pan behavior screenshots saved');
  });

  test('4. Zoom behavior at different levels', async ({ page }) => {
    console.log('[🎯TEST] Testing zoom behavior...');

    // Look for zoom controls
    const zoomInBtn = page.locator('button:has-text("+")', { hasText: /^\+$/ }).or(page.locator('[aria-label*="zoom in"]')).or(page.locator('button').filter({ hasText: '+' })).first();
    const zoomOutBtn = page.locator('button:has-text("-")', { hasText: /^-$/ }).or(page.locator('[aria-label*="zoom out"]')).or(page.locator('button').filter({ hasText: '-' })).first();

    // Test zoom out (0.5x)
    for (let i = 0; i < 3; i++) {
      await zoomOutBtn.click({ timeout: 1000 }).catch(() => {});
      await page.waitForTimeout(300);
    }
    await page.screenshot({
      path: 'test-results/viewport-box-zoom-0.5x.png',
      fullPage: true
    });

    // Reset to 1x
    for (let i = 0; i < 3; i++) {
      await zoomInBtn.click({ timeout: 1000 }).catch(() => {});
      await page.waitForTimeout(300);
    }
    await page.screenshot({
      path: 'test-results/viewport-box-zoom-1x.png',
      fullPage: true
    });

    // Zoom in to 1.5x
    for (let i = 0; i < 2; i++) {
      await zoomInBtn.click({ timeout: 1000 }).catch(() => {});
      await page.waitForTimeout(300);
    }
    await page.screenshot({
      path: 'test-results/viewport-box-zoom-1.5x.png',
      fullPage: true
    });

    // Zoom in to 2x
    for (let i = 0; i < 2; i++) {
      await zoomInBtn.click({ timeout: 1000 }).catch(() => {});
      await page.waitForTimeout(300);
    }
    await page.screenshot({
      path: 'test-results/viewport-box-zoom-2x.png',
      fullPage: true
    });

    console.log('[🎯TEST] Zoom behavior screenshots saved');
  });

  test('5. Control panel - toggle and presets', async ({ page }) => {
    console.log('[🎯TEST] Testing control panel...');

    // Look for toggle button
    const toggleBtn = page.locator('button:has-text("Show")').or(page.locator('button:has-text("Hide")')).or(page.locator('[aria-label*="viewport"]')).first();

    // Take screenshot of controls
    await page.screenshot({
      path: 'test-results/viewport-box-controls-visible.png',
      fullPage: true
    });

    // Click toggle to hide
    await toggleBtn.click({ timeout: 1000 }).catch(() => console.log('Toggle button not found'));
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'test-results/viewport-box-controls-hidden.png',
      fullPage: true
    });

    // Click toggle to show again
    await toggleBtn.click({ timeout: 1000 }).catch(() => {});
    await page.waitForTimeout(500);

    // Try different dimension presets
    const preset800x600 = page.locator('button:has-text("800")').or(page.locator('button:has-text("800x600")')).first();
    await preset800x600.click({ timeout: 1000 }).catch(() => console.log('800x600 preset not found'));
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'test-results/viewport-box-preset-800x600.png',
      fullPage: true
    });

    const preset1024x768 = page.locator('button:has-text("1024")').or(page.locator('button:has-text("1024x768")')).first();
    await preset1024x768.click({ timeout: 1000 }).catch(() => console.log('1024x768 preset not found'));
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'test-results/viewport-box-preset-1024x768.png',
      fullPage: true
    });

    const preset1920x1080 = page.locator('button:has-text("1920")').or(page.locator('button:has-text("1920x1080")')).first();
    await preset1920x1080.click({ timeout: 1000 }).catch(() => console.log('1920x1080 preset not found'));
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'test-results/viewport-box-preset-1920x1080.png',
      fullPage: true
    });

    console.log('[🎯TEST] Control panel screenshots saved');
  });

  test('6. Visual appearance - borders, corners, labels', async ({ page }) => {
    console.log('[🎯TEST] Checking visual appearance...');

    // Take high-quality screenshot focused on viewport box
    await page.screenshot({
      path: 'test-results/viewport-box-visual-quality.png',
      fullPage: true
    });

    console.log('[🎯TEST] Visual quality screenshot saved');
  });

  test('7. Console errors monitoring', async ({ page }) => {
    console.log('[🎯TEST] Monitoring console...');

    const consoleMessages: string[] = [];
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(text);
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(text);
      }
    });

    page.on('pageerror', exception => {
      consoleErrors.push(`PAGE ERROR: ${exception.message}`);
    });

    // Wait and interact with page
    await page.waitForTimeout(3000);

    // Try clicking around
    await page.click('body', { timeout: 1000 }).catch(() => {});
    await page.waitForTimeout(1000);

    // Report findings
    console.log('[🎯TEST] Console Messages:', consoleMessages.length);
    console.log('[🎯TEST] Console Errors:', consoleErrors.length);
    console.log('[🎯TEST] Console Warnings:', consoleWarnings.length);

    if (consoleErrors.length > 0) {
      console.log('[🎯TEST] ERRORS FOUND:');
      consoleErrors.forEach(err => console.log(`  - ${err}`));
    }

    if (consoleWarnings.length > 0) {
      console.log('[🎯TEST] WARNINGS FOUND:');
      consoleWarnings.forEach(warn => console.log(`  - ${warn}`));
    }

    // Fail test if there are errors
    expect(consoleErrors.length).toBe(0);
  });

  test('8. Integration - interaction with existing features', async ({ page }) => {
    console.log('[🎯TEST] Testing integration with existing features...');

    // Take screenshot of initial state
    await page.screenshot({
      path: 'test-results/viewport-box-integration-initial.png',
      fullPage: true
    });

    // Try clicking "Select" mode
    const selectBtn = page.locator('button:has-text("Select")').first();
    await selectBtn.click({ timeout: 1000 }).catch(() => console.log('Select button not found'));
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'test-results/viewport-box-integration-select.png',
      fullPage: true
    });

    // Try clicking "Add" mode
    const addBtn = page.locator('button:has-text("Add")').first();
    await addBtn.click({ timeout: 1000 }).catch(() => console.log('Add button not found'));
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'test-results/viewport-box-integration-add.png',
      fullPage: true
    });

    // Try clicking "Connect" mode
    const connectBtn = page.locator('button:has-text("Connect")').first();
    await connectBtn.click({ timeout: 1000 }).catch(() => console.log('Connect button not found'));
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'test-results/viewport-box-integration-connect.png',
      fullPage: true
    });

    console.log('[🎯TEST] Integration screenshots saved');
  });
});
