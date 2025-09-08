const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  // Listen to console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Processed nodes') || text.includes('normalized coords')) {
      console.log('CONSOLE:', text);
    }
  });
  
  console.log('Navigating to story-climb page...');
  await page.goto('http://localhost:3100/scrap-yard/story-climb');
  
  // Wait for content to load
  await page.waitForTimeout(3000);
  
  // Take initial screenshot
  await page.screenshot({ path: 'story-climb-fixed.png', fullPage: false });
  console.log('Screenshot saved as story-climb-fixed.png');
  
  // Check if nodes are visible
  const nodeCount = await page.locator('[class*="rounded-xl border-2"]').count();
  console.log(`Found ${nodeCount} visible nodes on screen`);
  
  // Get the positions of visible nodes
  const positions = await page.evaluate(() => {
    const nodes = document.querySelectorAll('[style*="left:"][style*="top:"]');
    const result = [];
    nodes.forEach(node => {
      const rect = node.getBoundingClientRect();
      if (rect.top >= -100 && rect.top <= window.innerHeight + 100) {
        result.push({
          left: rect.left,
          top: rect.top,
          visible: rect.top >= 0 && rect.top <= window.innerHeight
        });
      }
    });
    return result;
  });
  
  console.log('Node positions:', positions);
  
  // Try scrolling up to see more nodes
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(500);
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(500);
  
  await page.screenshot({ path: 'story-climb-scrolled.png', fullPage: false });
  console.log('Scrolled screenshot saved');
  
  await browser.close();
})();