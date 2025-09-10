const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  console.log('Loading page...');
  await page.goto('http://localhost:3200/scrap-yard/story-climb-demo', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: 'story-climb-final.png' });
  console.log('Screenshot saved as story-climb-final.png');
  
  // Quick check
  const hasCanvas = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    return canvas ? `Canvas found: ${canvas.width}x${canvas.height}` : 'No canvas';
  });
  console.log(hasCanvas);
  
  await browser.close();
})();