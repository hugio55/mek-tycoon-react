const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  console.log('Loading story-climb page...');
  await page.goto('http://localhost:3100/scrap-yard/story-climb');
  
  // Wait for page to load and canvas to be created
  await page.waitForTimeout(3000); // Give time for React to render
  
  // Check if canvas has proper dimensions
  await page.waitForFunction(() => {
    const canvas = document.querySelector('canvas');
    return canvas && canvas.width > 0 && canvas.height > 0;
  }, { timeout: 10000 });

  // Take screenshot
  await page.screenshot({ 
    path: 'story-climb-fixed-layout.png',
    fullPage: false
  });
  console.log('Screenshot saved as story-climb-fixed-layout.png');

  // Check canvas position and dimensions
  const canvasInfo = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return { error: 'Canvas not found' };
    
    const rect = canvas.getBoundingClientRect();
    const container = canvas.closest('[class*="bg-black"]');
    const containerRect = container ? container.getBoundingClientRect() : null;
    
    return {
      canvas: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        visible: rect.top < window.innerHeight && rect.bottom > 0
      },
      container: containerRect ? {
        top: containerRect.top,
        left: containerRect.left,
        width: containerRect.width,
        height: containerRect.height
      } : null,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      navigation: {
        height: document.querySelector('nav') ? document.querySelector('nav').offsetHeight : 0,
        logoHeight: document.querySelector('[class*="py-5"]') ? document.querySelector('[class*="py-5"]').offsetHeight : 0
      }
    };
  });

  console.log('\n=== Canvas Position Analysis ===');
  if (canvasInfo.error) {
    console.log('ERROR:', canvasInfo.error);
    console.log('Waiting longer for canvas to appear...');
    await page.waitForTimeout(3000);
    
    // Try again
    const retry = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      return canvas ? 'Canvas found on retry' : 'Canvas still not found';
    });
    console.log(retry);
  } else {
    console.log('Canvas dimensions:', canvasInfo.canvas.width, 'x', canvasInfo.canvas.height);
    console.log('Canvas top position:', canvasInfo.canvas.top, 'px from viewport top');
    console.log('Canvas visible:', canvasInfo.canvas.visible);
    
    if (canvasInfo.container) {
      console.log('\nContainer position:', canvasInfo.container.top, 'px from viewport top');
      console.log('Container dimensions:', canvasInfo.container.width, 'x', canvasInfo.container.height);
    }
    
    if (canvasInfo.viewport) {
      console.log('\nViewport:', canvasInfo.viewport.width, 'x', canvasInfo.viewport.height);
    }
    if (canvasInfo.navigation) {
      console.log('Navigation height:', canvasInfo.navigation.height + canvasInfo.navigation.logoHeight, 'px total');
    }
  }

  // Test at different viewport sizes
  const viewports = [
    { width: 1280, height: 720, name: 'HD' },
    { width: 1920, height: 1080, name: 'Full HD' },
    { width: 768, height: 1024, name: 'Tablet' }
  ];

  for (const vp of viewports) {
    await page.setViewportSize(vp);
    await page.waitForTimeout(500);
    
    const visible = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return { error: 'Canvas not found' };
      const rect = canvas.getBoundingClientRect();
      return {
        topGap: rect.top,
        visible: rect.top < window.innerHeight && rect.bottom > 0,
        fillsWidth: rect.width / window.innerWidth > 0.5
      };
    });
    
    console.log(`\n${vp.name} (${vp.width}x${vp.height}):`);
    if (visible.error) {
      console.log(`  - ERROR: ${visible.error}`);
    } else {
      console.log(`  - Gap from top: ${visible.topGap}px`);
      console.log(`  - Canvas visible: ${visible.visible}`);
      console.log(`  - Fills width well: ${visible.fillsWidth}`);
    }
  }

  // Check for any overflow issues
  const overflow = await page.evaluate(() => {
    return {
      bodyScrollHeight: document.body.scrollHeight,
      bodyClientHeight: document.body.clientHeight,
      hasVerticalScroll: document.body.scrollHeight > document.body.clientHeight,
      hasHorizontalScroll: document.body.scrollWidth > document.body.clientWidth
    };
  });

  console.log('\n=== Overflow Check ===');
  console.log('Has vertical scroll:', overflow.hasVerticalScroll);
  console.log('Has horizontal scroll:', overflow.hasHorizontalScroll);

  await browser.close();
  
  console.log('\n✅ Test complete! Check story-climb-fixed-layout.png');
})();