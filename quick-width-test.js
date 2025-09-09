const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });

  // Test buff categories page
  await page.goto('http://localhost:3100/admin/buff-categories');
  await page.waitForSelector('h1:has-text("Admin - Buff Categories")', { timeout: 5000 });
  
  const result = await page.evaluate(() => {
    const viewport = window.innerWidth;
    const main = document.querySelector('.min-h-screen');
    const mainRect = main?.getBoundingClientRect();
    const body = document.body;
    const bodyRect = body.getBoundingClientRect();
    
    // Check for scrollbar
    const hasVerticalScroll = document.documentElement.scrollHeight > window.innerHeight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    
    return {
      viewport,
      mainWidth: mainRect?.width,
      bodyWidth: bodyRect.width,
      hasVerticalScroll,
      scrollbarWidth,
      isFullWidth: mainRect?.width === viewport
    };
  });
  
  console.log('\n📊 Buff Categories Page Width Analysis:');
  console.log('  Viewport:', result.viewport + 'px');
  console.log('  Main content:', result.mainWidth + 'px');
  console.log('  Body width:', result.bodyWidth + 'px');
  console.log('  Has scrollbar:', result.hasVerticalScroll);
  console.log('  Scrollbar width:', result.scrollbarWidth + 'px');
  console.log('  Full width:', result.isFullWidth ? '✅ YES' : '❌ NO');
  
  if (!result.isFullWidth) {
    console.log('  Difference:', (result.viewport - result.mainWidth) + 'px');
  }
  
  await browser.close();
})();