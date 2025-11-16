const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  console.log('Navigating to landing-v2...');
  await page.goto('http://localhost:3200/landing-v2', { waitUntil: 'networkidle' });

  console.log('Waiting 2 seconds for entrance...');
  await page.waitForTimeout(2000);

  console.log('\n=== Using Debug Panel to switch to REVEAL ===');
  const debugSelect = await page.locator('select').first();
  await debugSelect.selectOption('REVEAL');

  console.log('Waiting 10 seconds for full reveal sequence...');
  await page.waitForTimeout(10000);

  await page.screenshot({ path: 'debug-test-final.png' });

  const diagnostics = await page.evaluate(() => {
    const subtitle = document.querySelector('p')?.textContent;
    const allButtons = Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim());
    const joinBetaButton = allButtons.find(text => text?.toLowerCase().includes('join beta'));
    const phaseHeaders = Array.from(document.querySelectorAll('h3')).map(h => h.textContent?.trim());
    const hasStars = document.querySelector('canvas') !== null;
    const hasLogo = document.querySelector('img[alt*="Logo"]') !== null || document.querySelector('video') !== null;

    return {
      subtitle,
      hasJoinBetaButton: !!joinBetaButton,
      joinBetaText: joinBetaButton,
      phaseCount: phaseHeaders.length,
      phaseHeaders,
      hasStars,
      hasLogo,
      allButtons
    };
  });

  console.log('\n=== FINAL STATE (via Debug Panel) ===');
  console.log(JSON.stringify(diagnostics, null, 2));

  await browser.close();
  console.log('\n✅ Debug panel test complete.');
})();
