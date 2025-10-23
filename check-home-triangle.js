const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const consoleLogs = [];
  const errors = [];

  // Capture console logs
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
    console.log('CONSOLE:', text);
  });

  // Capture errors
  page.on('pageerror', exception => {
    errors.push(exception.message);
    console.log('ERROR:', exception.message);
  });

  console.log('Navigating to http://localhost:3200/home...');
  try {
    await page.goto('http://localhost:3200/home', { waitUntil: 'load', timeout: 10000 });
  } catch (e) {
    console.log('Warning: Page load timeout, continuing anyway...');
  }

  // Wait a bit for any dynamic content
  await page.waitForTimeout(3000);

  // Take screenshot
  await page.screenshot({ path: 'home-triangle-check.png', fullPage: false });
  console.log('Screenshot saved to home-triangle-check.png');

  // Get triangle and sprite information
  const triangleInfo = await page.evaluate(() => {
    const triangle = document.querySelector('img[alt*="triangle" i], img[src*="backplate"]');
    const sprites = document.querySelectorAll('[class*="sprite"], [style*="absolute"]');

    return {
      triangleFound: !!triangle,
      triangleSize: triangle ? {
        width: triangle.offsetWidth,
        height: triangle.offsetHeight,
        naturalWidth: triangle.naturalWidth,
        naturalHeight: triangle.naturalHeight
      } : null,
      spriteCount: sprites.length,
      spriteSample: Array.from(sprites).slice(0, 5).map(s => ({
        tagName: s.tagName,
        className: s.className,
        style: s.getAttribute('style'),
        src: s.tagName === 'IMG' ? s.src : null
      }))
    };
  });

  console.log('\n=== TRIANGLE INFO ===');
  console.log(JSON.stringify(triangleInfo, null, 2));

  console.log('\n=== CONSOLE LOGS ===');
  consoleLogs.forEach(log => console.log(log));

  console.log('\n=== ERRORS ===');
  if (errors.length === 0) {
    console.log('No errors detected');
  } else {
    errors.forEach(err => console.log(err));
  }

  await browser.close();
})();
