import { test, expect } from '@playwright/test';

test.describe('Layer 3 Streak Star Rendering Test', () => {
  test('Verify Layer 3 lines are visible vs dots', async ({ page }) => {
    // Enable console logging
    const consoleMessages: string[] = [];
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(text);
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
    });

    // Navigate to landing-debug page
    await page.goto('http://localhost:3200/landing-debug');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('\n=== STEP 1: Disable Background Stars, Layer 1, Layer 2 ===');

    // Disable Background Stars
    const bgStarsCheckbox = page.locator('label:has-text("Enable Background Stars") input[type="checkbox"]');
    if (await bgStarsCheckbox.isChecked()) {
      await bgStarsCheckbox.uncheck();
      console.log('✓ Disabled Background Stars');
    }

    // Disable Layer 1
    const layer1Checkbox = page.locator('label:has-text("Enable Layer 1") input[type="checkbox"]');
    if (await layer1Checkbox.isChecked()) {
      await layer1Checkbox.uncheck();
      console.log('✓ Disabled Layer 1');
    }

    // Disable Layer 2
    const layer2Checkbox = page.locator('label:has-text("Enable Layer 2") input[type="checkbox"]');
    if (await layer2Checkbox.isChecked()) {
      await layer2Checkbox.uncheck();
      console.log('✓ Disabled Layer 2');
    }

    console.log('\n=== STEP 2: Enable Layer 3 Star Field ===');

    // Enable Layer 3
    const layer3Checkbox = page.locator('label:has-text("Enable Layer 3") input[type="checkbox"]');
    if (!await layer3Checkbox.isChecked()) {
      await layer3Checkbox.check();
      console.log('✓ Enabled Layer 3');
    }

    await page.waitForTimeout(1000);

    console.log('\n=== STEP 3: Set Layer 3 Line Length to Maximum ===');

    // Find Line Length slider (within Layer 3 Star Field section)
    // Use the specific slider with min=10, max=200 (not the 0.5-5 one)
    const layer3Section = page.locator('div:has(h2:has-text("Layer 3 Star Field"))');
    const lineLengthSlider = layer3Section.locator('input[type="range"][min="10"][max="200"]');

    // Get slider properties
    const minValue = await lineLengthSlider.getAttribute('min');
    const maxValue = await lineLengthSlider.getAttribute('max');
    const currentValue = await lineLengthSlider.getAttribute('value');

    console.log(`Line Length Slider Range: ${minValue} - ${maxValue}`);
    console.log(`Current Line Length Value: ${currentValue}`);

    // Set to maximum
    await lineLengthSlider.fill(maxValue || '100');
    await page.waitForTimeout(500);

    const newValue = await lineLengthSlider.getAttribute('value');
    console.log(`✓ Set Line Length to Maximum: ${newValue}`);

    console.log('\n=== STEP 4: Set Layer 3 Star Speed to 100+ ===');

    // Find Star Speed slider (Layer 3 has max=5000, others have max=500)
    const speedSlider = layer3Section.locator('input[type="range"][min="0.5"][max="5000"]');

    const speedMax = await speedSlider.getAttribute('max');
    const speedCurrent = await speedSlider.getAttribute('value');
    console.log(`Current Speed: ${speedCurrent}, Max: ${speedMax}`);

    // Set to high value (100)
    await speedSlider.fill('100');
    await page.waitForTimeout(500);

    const newSpeed = await speedSlider.getAttribute('value');
    console.log(`✓ Set Speed to: ${newSpeed}`);

    console.log('\n=== STEP 5: Set Layer 3 Star Density to 50-100 ===');

    // Find Star Density slider (Layer 3 has max=500, use .first() since multiple exist)
    const densitySlider = layer3Section.locator('input[type="range"][min="1"][max="500"]').first();

    const densityMax = await densitySlider.getAttribute('max');
    const densityCurrent = await densitySlider.getAttribute('value');
    console.log(`Current Density: ${densityCurrent}, Max: ${densityMax}`);

    // Set to 75 (middle of 50-100 range)
    const targetDensity = Math.min(75, parseInt(densityMax || '100'));
    await densitySlider.fill(targetDensity.toString());
    await page.waitForTimeout(500);

    const newDensity = await densitySlider.getAttribute('value');
    console.log(`✓ Set Density to: ${newDensity}`);

    // Wait for rendering to stabilize
    await page.waitForTimeout(2000);

    console.log('\n=== STEP 6: Check Console for Errors ===');

    if (consoleErrors.length > 0) {
      console.log('⚠️ Console Errors Found:');
      consoleErrors.forEach(err => console.log(`  - ${err}`));
    } else {
      console.log('✓ No console errors detected');
    }

    // Look for THREE.js related messages
    const threeJsMessages = consoleMessages.filter(msg =>
      msg.includes('THREE') || msg.includes('WebGL') || msg.includes('Layer 3')
    );

    if (threeJsMessages.length > 0) {
      console.log('\nTHREE.js/WebGL Messages:');
      threeJsMessages.forEach(msg => console.log(`  - ${msg}`));
    }

    console.log('\n=== STEP 7: Inspect Canvas ===');

    // Find canvas element
    const canvas = page.locator('canvas');
    const canvasCount = await canvas.count();
    console.log(`Canvas elements found: ${canvasCount}`);

    if (canvasCount > 0) {
      const canvasBox = await canvas.first().boundingBox();
      if (canvasBox) {
        console.log(`Canvas size: ${canvasBox.width}x${canvasBox.height}`);
      }
    }

    console.log('\n=== STEP 8: Take Screenshot ===');

    // Take screenshot of current state
    await page.screenshot({
      path: 'tests/screenshots/layer3-streak-stars-current-state.png',
      fullPage: false
    });
    console.log('✓ Screenshot saved to tests/screenshots/layer3-streak-stars-current-state.png');

    console.log('\n=== STEP 9: Test Line Length Variation ===');

    // Test if lines change when slider changes
    console.log('Testing minimum line length...');
    await lineLengthSlider.fill(minValue || '0');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'tests/screenshots/layer3-streak-stars-min-length.png',
      fullPage: false
    });
    console.log('✓ Screenshot at min length saved');

    console.log('Testing maximum line length...');
    await lineLengthSlider.fill(maxValue || '100');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'tests/screenshots/layer3-streak-stars-max-length.png',
      fullPage: false
    });
    console.log('✓ Screenshot at max length saved');

    console.log('\n=== VISUAL INSPECTION REPORT ===');
    console.log('Please manually review the screenshots:');
    console.log('1. tests/screenshots/layer3-streak-stars-current-state.png');
    console.log('2. tests/screenshots/layer3-streak-stars-min-length.png');
    console.log('3. tests/screenshots/layer3-streak-stars-max-length.png');
    console.log('\nCheck if:');
    console.log('- Lines are visible vs just dots');
    console.log('- Lines get longer when slider increases');
    console.log('- Lines are moving toward viewer');

    console.log('\n=== SUMMARY ===');
    console.log(`Line Length Range: ${minValue} - ${maxValue}`);
    console.log(`Final Line Length: ${await lineLengthSlider.getAttribute('value')}`);
    console.log(`Star Speed: ${await speedSlider.getAttribute('value')}`);
    console.log(`Star Density: ${await densitySlider.getAttribute('value')}`);
    console.log(`Console Errors: ${consoleErrors.length}`);
    console.log(`Canvas Elements: ${canvasCount}`);

    // Keep browser open for manual inspection
    await page.waitForTimeout(5000);
  });
});
