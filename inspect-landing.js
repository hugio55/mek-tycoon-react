const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  const errors = [];
  const warnings = [];

  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
    if (msg.type() === 'warning') warnings.push(msg.text());
  });

  console.log('Navigating to landing-v2...');
  await page.goto('http://localhost:3200/landing-v2', { waitUntil: 'networkidle' });

  console.log('Waiting for animations...');
  await page.waitForTimeout(3000);

  console.log('Taking screenshots...');
  await page.screenshot({ path: 'landing-v2-initial.png', fullPage: false });

  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'landing-v2-scrolled.png', fullPage: false });

  const diagnostics = await page.evaluate(() => {
    const subtitle = document.querySelector('p')?.textContent;
    const joinBetaButton = Array.from(document.querySelectorAll('button')).find(b =>
      b.textContent.toLowerCase().includes('join beta')
    );
    const phaseHeaders = Array.from(document.querySelectorAll('h3')).map(h => h.textContent?.trim());
    const hasStars = document.querySelector('canvas') !== null;
    const phaseCards = document.querySelectorAll('[class*="w-full"]').length;

    return {
      subtitle,
      hasJoinBetaButton: !!joinBetaButton,
      joinBetaText: joinBetaButton?.textContent,
      phaseHeaders,
      hasStars,
      phaseCards
    };
  });

  console.log('\n=== PAGE DIAGNOSTICS ===');
  console.log(JSON.stringify(diagnostics, null, 2));

  console.log('\n=== CONSOLE ERRORS ===');
  console.log(errors.length > 0 ? errors.join('\n') : 'None');

  console.log('\n=== CONSOLE WARNINGS ===');
  console.log(warnings.length > 0 ? warnings.join('\n') : 'None');

  await browser.close();
  console.log('\n✅ Inspection complete. Screenshots saved.');
})();
