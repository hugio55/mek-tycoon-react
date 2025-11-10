import { test, expect } from '@playwright/test';

test('description offset controls should work', async ({ page }) => {
  // Navigate to debug page
  await page.goto('http://localhost:3200/landing-debug');
  await page.waitForLoadState('domcontentloaded');

  // Check initial localStorage values
  const initialStorage = await page.evaluate(() => {
    const stored = localStorage.getItem('mek-landing-debug-config');
    return stored ? JSON.parse(stored) : null;
  });

  console.log('Initial storage:', initialStorage?.descriptionXOffset, initialStorage?.descriptionYOffset);

  // Find the offset sliders
  const xOffsetSlider = page.locator('input[type="range"]').filter({ has: page.locator('.. >> text=Horizontal Offset (X)') });
  const yOffsetSlider = page.locator('input[type="range"]').filter({ has: page.locator('.. >> text=Vertical Offset (Y)') });

  // Change X offset to 100px
  await xOffsetSlider.fill('100');

  // Wait a bit for localStorage to update
  await page.waitForTimeout(200);

  // Check if localStorage was updated
  const updatedStorage = await page.evaluate(() => {
    const stored = localStorage.getItem('mek-landing-debug-config');
    return stored ? JSON.parse(stored) : null;
  });

  console.log('Updated storage after X change:', updatedStorage?.descriptionXOffset, updatedStorage?.descriptionYOffset);

  // Change Y offset to 160px
  await yOffsetSlider.fill('160');

  // Wait a bit for localStorage to update
  await page.waitForTimeout(200);

  // Check final localStorage
  const finalStorage = await page.evaluate(() => {
    const stored = localStorage.getItem('mek-landing-debug-config');
    return stored ? JSON.parse(stored) : null;
  });

  console.log('Final storage:', finalStorage?.descriptionXOffset, finalStorage?.descriptionYOffset);

  // Open landing page in new tab
  const landingPage = await page.context().newPage();
  await landingPage.goto('http://localhost:3200/landing');
  await landingPage.waitForLoadState('domcontentloaded');

  // Wait for React to render
  await landingPage.waitForTimeout(500);

  // Check if description element has correct transform
  const descriptionDiv = landingPage.locator('div').filter({ has: landingPage.locator('p', { hasText: 'futuristic idle tycoon game' }) }).first();

  const transform = await descriptionDiv.evaluate((el) => {
    return window.getComputedStyle(el).transform;
  });

  console.log('Description transform:', transform);

  await landingPage.close();
});
