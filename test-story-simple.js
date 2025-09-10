const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  console.log('Loading story-climb page...');
  await page.goto('http://localhost:3100/scrap-yard/story-climb');
  
  // Wait for page to stabilize
  await page.waitForTimeout(6000);
  
  // Take screenshot
  await page.screenshot({ 
    path: 'story-climb-current.png',
    fullPage: false
  });
  console.log('Screenshot saved as story-climb-current.png');

  // Check page structure
  const pageInfo = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const container = document.querySelector('[style*="aspect-ratio"]');
    const header = document.querySelector('.text-yellow-500.text-center');
    
    return {
      canvasFound: !!canvas,
      canvasSize: canvas ? { width: canvas.width, height: canvas.height } : null,
      containerFound: !!container,
      containerSize: container ? { 
        width: container.clientWidth, 
        height: container.clientHeight 
      } : null,
      headerText: header ? header.textContent : null,
      pageHeight: document.body.scrollHeight,
      viewportHeight: window.innerHeight
    };
  });

  console.log('\n=== Page Analysis ===');
  console.log('Canvas found:', pageInfo.canvasFound);
  if (pageInfo.canvasSize) {
    console.log('Canvas size:', pageInfo.canvasSize.width, 'x', pageInfo.canvasSize.height);
  }
  console.log('Container found:', pageInfo.containerFound);
  if (pageInfo.containerSize) {
    console.log('Container size:', pageInfo.containerSize.width, 'x', pageInfo.containerSize.height);
  }
  console.log('Header:', pageInfo.headerText);
  console.log('Page height:', pageInfo.pageHeight);
  console.log('Viewport height:', pageInfo.viewportHeight);

  await browser.close();
  
  console.log('\n✅ Test complete! Check story-climb-current.png');
})();