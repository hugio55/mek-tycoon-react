const { chromium } = require('playwright');

async function testSingleClick() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen for ALL console messages
  page.on('console', (msg) => {
    const text = msg.text();
    console.log(`[CONSOLE] ${text}`);
  });

  try {
    console.log('Navigating to Story Climb...');
    await page.goto('http://localhost:3100/scrap-yard/story-climb');
    
    await page.waitForTimeout(5000);
    await page.waitForSelector('canvas');
    
    const canvas = page.locator('canvas');
    
    console.log('\n=== Testing Single Node Click ===');
    
    // Click on just one node to see all the debug output clearly
    console.log('Clicking on connected node at (259, 475):');
    await canvas.click({ position: { x: 259, y: 475 } });
    await page.waitForTimeout(2000);
    
  } catch (error) {
    console.error('Error during test:', error.message);
  }
  
  console.log('\n=== Single Click Test Complete ===');
  await browser.close();
}

testSingleClick().catch(console.error);