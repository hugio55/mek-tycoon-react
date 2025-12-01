const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  console.log('Navigating to landing-v2...');
  await page.goto('http://localhost:3200/landing-v2', { waitUntil: 'networkidle' });

  console.log('Waiting 2 seconds for entrance animation...');
  await page.waitForTimeout(2000);

  console.log('Taking screenshot of initial state...');
  await page.screenshot({ path: 'verify-step1-initial.png' });

  console.log('Finding checkboxes...');
  const inputs = await page.$$('input[type="checkbox"]');

  if (inputs.length >= 2) {
    console.log('Clicking second checkbox (no sound)...');
    await inputs[1].click();

    console.log('Waiting 2 seconds for fade-out to complete...');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'verify-step2-after-fade.png' });

    console.log('Waiting 8 more seconds for full reveal sequence...');
    await page.waitForTimeout(8000);
    await page.screenshot({ path: 'verify-step3-final-content.png' });

    const diagnostics = await page.evaluate(() => {
      const subtitle = document.querySelector('p')?.textContent;
      const joinBetaButton = Array.from(document.querySelectorAll('button')).find(b =>
        b.textContent?.toLowerCase().includes('join beta')
      );
      const phaseHeaders = Array.from(document.querySelectorAll('h3')).map(h => h.textContent?.trim());
      const hasStars = document.querySelector('canvas') !== null;
      const soundOverlayVisible = document.querySelector('.fixed.inset-0[style*="9999"]') !== null;

      return {
        subtitle,
        hasJoinBetaButton: !!joinBetaButton,
        phaseHeaders,
        hasStars,
        soundOverlayVisible,
        totalPhaseHeaders: phaseHeaders.length
      };
    });

    console.log('\n=== FINAL STATE ===');
    console.log(JSON.stringify(diagnostics, null, 2));
  }

  await browser.close();
  console.log('\n✅ Verification complete.');
})();
