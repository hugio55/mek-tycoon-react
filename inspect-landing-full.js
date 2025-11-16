const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  console.log('Navigating to landing-v2...');
  await page.goto('http://localhost:3200/landing-v2', { waitUntil: 'networkidle' });

  console.log('Waiting for sound selection...');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'step1-sound-selection.png' });

  console.log('Clicking sound OFF button...');
  const soundOffButton = await page.locator('button').filter({ hasText: /sound off/i }).first();
  await soundOffButton.click();

  console.log('Waiting for background reveal...');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'step2-background.png' });

  console.log('Waiting for stars and logo...');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'step3-stars-logo.png' });

  console.log('Waiting for final content...');
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'step4-final-content.png' });

  console.log('Waiting for phases to appear...');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'step5-phases.png' });

  const diagnostics = await page.evaluate(() => {
    const subtitle = document.querySelector('p')?.textContent;
    const buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim());
    const phaseHeaders = Array.from(document.querySelectorAll('h3')).map(h => h.textContent?.trim());
    const hasStars = document.querySelector('canvas') !== null;

    return {
      subtitle,
      buttons,
      phaseHeaders,
      hasStars,
      totalButtons: buttons.length,
      totalPhases: phaseHeaders.length
    };
  });

  console.log('\n=== FINAL STATE DIAGNOSTICS ===');
  console.log(JSON.stringify(diagnostics, null, 2));

  console.log('\n=== CONSOLE ERRORS ===');
  console.log(errors.length > 0 ? errors.join('\n') : 'None');

  await browser.close();
  console.log('\n✅ Full sequence inspection complete.');
})();
