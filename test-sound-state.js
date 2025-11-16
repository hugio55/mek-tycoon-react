const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    console.log('[CONSOLE]', text);
  });

  console.log('Navigating to landing-v2...');
  await page.goto('http://localhost:3200/landing-v2', { waitUntil: 'networkidle' });

  console.log('Waiting 2 seconds for initial render...');
  await page.waitForTimeout(2000);

  console.log('\nSearching for toggle elements...');
  const inputs = await page.$$('input[type="checkbox"]');
  console.log(`Found ${inputs.length} checkboxes`);

  if (inputs.length >= 2) {
    console.log('\nClicking second checkbox (no sound option)...');
    await inputs[1].click();

    console.log('Waiting 5 seconds to see state progression...');
    await page.waitForTimeout(5000);

    console.log('\n=== LOGS WITH [🎵SOUND] TAG ===');
    const soundLogs = logs.filter(log => log.includes('[🎵SOUND]'));
    soundLogs.forEach(log => console.log(log));

    console.log('\n=== LOGS WITH [🎭LANDING-STATE] TAG ===');
    const stateLogs = logs.filter(log => log.includes('[🎭LANDING-STATE]'));
    stateLogs.forEach(log => console.log(log));
  }

  console.log('\n✅ Test complete. Browser left open for inspection.');
})();
