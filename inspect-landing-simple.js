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
  await page.waitForTimeout(1000);

  console.log('Finding sound buttons...');
  const buttons = await page.$$('button');
  console.log(`Found ${buttons.length} buttons`);

  if (buttons.length > 0) {
    console.log('Clicking first button (sound off - right button)...');
    await buttons[1].click(); // Click the right button (sound off)

    console.log('Waiting for state machine progression...');
    await page.waitForTimeout(8000); // Wait for full sequence

    await page.screenshot({ path: 'landing-final-state.png' });

    const diagnostics = await page.evaluate(() => {
      const subtitle = document.querySelector('p')?.textContent;
      const allText = document.body.innerText;
      const phaseHeaders = Array.from(document.querySelectorAll('h3')).map(h => h.textContent?.trim());
      const hasJoinBeta = allText.toLowerCase().includes('join beta');
      const hasStars = document.querySelector('canvas') !== null;

      return {
        subtitle,
        hasJoinBeta,
        phaseHeaders,
        hasStars,
        bodyTextSample: allText.substring(0, 300)
      };
    });

    console.log('\n=== FINAL STATE DIAGNOSTICS ===');
    console.log(JSON.stringify(diagnostics, null, 2));
  }

  console.log('\n=== CONSOLE ERRORS ===');
  console.log(errors.length > 0 ? errors.join('\n') : 'None');

  await browser.close();
  console.log('\n✅ Inspection complete.');
})();
