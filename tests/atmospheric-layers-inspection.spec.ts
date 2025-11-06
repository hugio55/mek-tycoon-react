import { test, expect } from '@playwright/test';

test.describe('Atmospheric Effect Layers Inspection', () => {
  test('inspect atmospheric layers on variation cards', async ({ page }) => {
    // Navigate to mek-layouts page
    await page.goto('http://localhost:3200/mek-layouts');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    console.log('[🔍ATMOSPHERIC] Page loaded, looking for Mek cards...');

    // Click on the first Mek to open the profile lightbox
    const firstMek = page.locator('.mek-card-industrial').first();
    await firstMek.waitFor({ state: 'visible', timeout: 10000 });
    await firstMek.click();

    console.log('[🔍ATMOSPHERIC] Clicked Mek, waiting for lightbox...');

    // Wait for lightbox to appear
    await page.waitForSelector('.fixed.inset-0.z-\\[9999\\]', { timeout: 10000 });

    // Wait a bit for animations to settle
    await page.waitForTimeout(1000);

    // Take initial screenshot with default atmospheric noise (15%)
    await page.screenshot({
      path: 'tests/screenshots/atmospheric-default-15percent.png',
      fullPage: true
    });
    console.log('[🔍ATMOSPHERIC] Screenshot saved: atmospheric-default-15percent.png');

    // Find the variation card container (HEAD VARIATION or BODY VARIATION section)
    const variationCards = page.locator('div').filter({ hasText: /HEAD VARIATION|BODY VARIATION/ });
    const firstVariationCard = variationCards.first();

    // Inspect the atmospheric layers
    console.log('[🔍ATMOSPHERIC] Inspecting atmospheric effect layers...');

    // Get all the atmospheric layer divs (they should be inside the image container)
    const imageContainer = page.locator('img[alt*="variation"]').first().locator('..'); // Parent div

    // Check Layer 1: Dithering pattern
    const layer1 = imageContainer.locator('div.absolute.inset-0.pointer-events-none').nth(0);
    const layer1Exists = await layer1.count() > 0;
    console.log('[🔍ATMOSPHERIC] Layer 1 (Dithering) exists:', layer1Exists);

    if (layer1Exists) {
      const layer1Styles = await layer1.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          opacity: computed.opacity,
          mixBlendMode: computed.mixBlendMode,
          backgroundImage: computed.backgroundImage
        };
      });
      console.log('[🔍ATMOSPHERIC] Layer 1 computed styles:', layer1Styles);
    }

    // Check Layer 2: Radial gradient atmospheric haze
    const layer2 = imageContainer.locator('div.absolute.inset-0.pointer-events-none').nth(1);
    const layer2Exists = await layer2.count() > 0;
    console.log('[🔍ATMOSPHERIC] Layer 2 (Radial Haze) exists:', layer2Exists);

    if (layer2Exists) {
      const layer2Styles = await layer2.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          opacity: computed.opacity,
          mixBlendMode: computed.mixBlendMode,
          background: computed.background
        };
      });
      console.log('[🔍ATMOSPHERIC] Layer 2 computed styles:', layer2Styles);
    }

    // Check Layer 3: Grain texture
    const layer3 = imageContainer.locator('div.absolute.inset-0.pointer-events-none').nth(2);
    const layer3Exists = await layer3.count() > 0;
    console.log('[🔍ATMOSPHERIC] Layer 3 (Grain Texture) exists:', layer3Exists);

    if (layer3Exists) {
      const layer3Styles = await layer3.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          opacity: computed.opacity,
          mixBlendMode: computed.mixBlendMode,
          backgroundImage: computed.backgroundImage?.substring(0, 100) + '...' // Truncate long data URL
        };
      });
      console.log('[🔍ATMOSPHERIC] Layer 3 computed styles:', layer3Styles);
    }

    // Check Layer 4: Energy field shimmer
    const layer4 = imageContainer.locator('div.absolute.inset-0.pointer-events-none').nth(3);
    const layer4Exists = await layer4.count() > 0;
    console.log('[🔍ATMOSPHERIC] Layer 4 (Energy Shimmer) exists:', layer4Exists);

    if (layer4Exists) {
      const layer4Styles = await layer4.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          opacity: computed.opacity,
          mixBlendMode: computed.mixBlendMode,
          background: computed.background
        };
      });
      console.log('[🔍ATMOSPHERIC] Layer 4 computed styles:', layer4Styles);
    }

    // Test: Disable layers in DevTools and compare
    console.log('[🔍ATMOSPHERIC] Disabling all atmospheric layers for comparison...');
    await page.evaluate(() => {
      const layers = document.querySelectorAll('div.absolute.inset-0.pointer-events-none');
      layers.forEach((layer: Element) => {
        (layer as HTMLElement).style.display = 'none';
      });
    });

    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'tests/screenshots/atmospheric-layers-disabled.png',
      fullPage: true
    });
    console.log('[🔍ATMOSPHERIC] Screenshot saved: atmospheric-layers-disabled.png');

    // Re-enable layers
    await page.evaluate(() => {
      const layers = document.querySelectorAll('div.absolute.inset-0.pointer-events-none');
      layers.forEach((layer: Element) => {
        (layer as HTMLElement).style.display = '';
      });
    });

    // Test slider: Set to 0%
    console.log('[🔍ATMOSPHERIC] Testing slider at 0%...');
    await page.evaluate(() => {
      const slider = document.querySelector('input[type="range"][max="0.5"]') as HTMLInputElement;
      if (slider) {
        slider.value = '0';
        slider.dispatchEvent(new Event('input', { bubbles: true }));
        slider.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'tests/screenshots/atmospheric-0percent.png',
      fullPage: true
    });
    console.log('[🔍ATMOSPHERIC] Screenshot saved: atmospheric-0percent.png');

    // Test slider: Set to 50%
    console.log('[🔍ATMOSPHERIC] Testing slider at 50%...');
    await page.evaluate(() => {
      const slider = document.querySelector('input[type="range"][max="0.5"]') as HTMLInputElement;
      if (slider) {
        slider.value = '0.5';
        slider.dispatchEvent(new Event('input', { bubbles: true }));
        slider.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'tests/screenshots/atmospheric-50percent.png',
      fullPage: true
    });
    console.log('[🔍ATMOSPHERIC] Screenshot saved: atmospheric-50percent.png');

    // Check final opacity values at 50%
    const finalLayer1Opacity = await layer1.evaluate((el) => window.getComputedStyle(el).opacity);
    const finalLayer2Opacity = await layer2.evaluate((el) => window.getComputedStyle(el).opacity);
    const finalLayer3Opacity = await layer3.evaluate((el) => window.getComputedStyle(el).opacity);
    const finalLayer4Opacity = await layer4.evaluate((el) => window.getComputedStyle(el).opacity);

    console.log('[🔍ATMOSPHERIC] Final opacity values at 50%:');
    console.log('  Layer 1:', finalLayer1Opacity, '(should be 0.5 * 0.3 = 0.15)');
    console.log('  Layer 2:', finalLayer2Opacity, '(should be 0.5 * 0.4 = 0.20)');
    console.log('  Layer 3:', finalLayer3Opacity, '(should be 0.5 * 1.5 = 0.75)');
    console.log('  Layer 4:', finalLayer4Opacity, '(should be 0.5 * 0.2 = 0.10)');

    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('[🔍ATMOSPHERIC] Console error:', msg.text());
      }
    });
  });
});
