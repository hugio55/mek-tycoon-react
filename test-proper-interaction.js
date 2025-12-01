const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    if (text.includes('[🎵SOUND]') || text.includes('[🎭LANDING-STATE]')) {
      console.log('[CONSOLE]', text);
    }
  });

  console.log('Navigating to landing-v2...');
  await page.goto('http://localhost:3200/landing-v2', { waitUntil: 'networkidle' });

  console.log('Waiting 2 seconds for entrance...');
  await page.waitForTimeout(2000);

  console.log('\n=== STEP 1: Click guard to open it ===');
  const checkboxes = await page.$$('input[type="checkbox"]');
  console.log(`Found ${checkboxes.length} checkboxes (guards)`);

  if (checkboxes.length >= 2) {
    console.log('Clicking second guard (no sound option)...');
    await checkboxes[1].click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'test-step1-guard-open.png' });

    console.log('\n=== STEP 2: Click switch lever to flip it ===');
    // The switch lever is a clickable div inside the toggle
    // Find it by looking for the hexagonal switch element
    const switchLever = await page.locator('div').filter({
      hasText: '⬢'
    }).nth(1); // Second toggle (no sound)

    console.log('Clicking switch lever...');
    await switchLever.click();

    console.log('\nWaiting 3 seconds for fade-out...');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-step2-after-fade.png' });

    console.log('Waiting 8 more seconds for full content...');
    await page.waitForTimeout(8000);
    await page.screenshot({ path: 'test-step3-final.png' });

    const diagnostics = await page.evaluate(() => {
      const subtitle = document.querySelector('p')?.textContent;
      const joinBetaButton = Array.from(document.querySelectorAll('button')).find(b =>
        b.textContent?.toLowerCase().includes('join beta')
      );
      const phaseHeaders = Array.from(document.querySelectorAll('h3')).map(h => h.textContent?.trim());
      const hasStars = document.querySelector('canvas') !== null;

      return {
        subtitle,
        hasJoinBetaButton: !!joinBetaButton,
        phaseHeadersFound: phaseHeaders.length,
        phaseHeaders,
        hasStars
      };
    });

    console.log('\n=== FINAL STATE ===');
    console.log(JSON.stringify(diagnostics, null, 2));

    console.log('\n=== STATE TRANSITIONS ===');
    const stateLogs = logs.filter(log => log.includes('[🎭LANDING-STATE]'));
    stateLogs.forEach(log => console.log(log));
  }

  console.log('\n✅ Test complete. Browser left open.');
})();
