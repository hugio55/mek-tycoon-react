import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Capture all console logs
  page.on('console', msg => {
    console.log(`[${msg.type().toUpperCase()}]`, msg.text());
  });

  await page.goto('http://localhost:3200/landing-v2');
  await page.waitForTimeout(2000);

  // Check React state by looking at the DOM
  const reactState = await page.evaluate(() => {
    // Try to find any element with phase-related data attributes
    const allElements = document.querySelectorAll('*');
    let foundPhaseData = false;

    for (let el of allElements) {
      const text = el.textContent || '';
      if (text.includes('Phase') || text.includes('Foundation') || text.includes('Ecosystem')) {
        foundPhaseData = true;
        console.log('Found phase-related text:', text.substring(0, 100));
      }
    }

    return {
      foundPhaseData,
      bodyLength: document.body.textContent.length
    };
  });

  console.log('\nReact state check:', reactState);

  // Click button
  await page.locator('button').first().click();
  console.log('\nClicked button, waiting for reveal...');

  // Wait much longer for all animations
  await page.waitForTimeout(12000);

  // Scroll to bottom
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2000);

  // Check again
  const afterState = await page.evaluate(() => {
    const body = document.body.textContent || '';
    return {
      hasPhaseI: body.includes('Phase I'),
      hasPhaseII: body.includes('Phase II'),
      hasFoundation: body.includes('Foundation'),
      hasEcosystem: body.includes('Ecosystem'),
      bodyLength: body.length
    };
  });

  console.log('\nAfter animations:', afterState);

  // Take a full page screenshot
  await page.screenshot({ path: 'landing-detailed.png', fullPage: true });
  console.log('\nScreenshot saved to landing-detailed.png');

  await browser.close();
})();
