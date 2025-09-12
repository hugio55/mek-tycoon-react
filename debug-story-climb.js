const { chromium } = require('playwright');

async function debugStoryClimb() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen for console messages
  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (text.includes('Click handler') || text.includes('Node clicked') || text.includes('Node adjacency') || text.includes('START node')) {
      console.log(`[${type.toUpperCase()}] ${text}`);
    }
  });

  // Navigate to the Story Climb page
  await page.goto('http://localhost:3100/scrap-yard/story-climb');
  
  // Wait for the page to load
  await page.waitForTimeout(3000);
  
  // Take a screenshot of the initial state
  await page.screenshot({ path: 'story-climb-initial.png' });
  console.log('Initial screenshot taken');

  // Try clicking on the canvas where nodes should be
  const canvas = await page.locator('canvas').first();
  
  // Get canvas bounds
  const canvasBounds = await canvas.boundingBox();
  console.log('Canvas bounds:', canvasBounds);
  
  // Click in the center-bottom area where START node should be
  const startX = canvasBounds.x + canvasBounds.width / 2;
  const startY = canvasBounds.y + canvasBounds.height * 0.75; // 75% down where START should be
  
  console.log(`Clicking near START node at (${startX}, ${startY})`);
  await page.mouse.click(startX, startY);
  await page.waitForTimeout(1000);
  
  // Try clicking above the START node (where connected nodes should be)
  const nodeY = canvasBounds.y + canvasBounds.height * 0.6; // 60% down
  console.log(`Clicking on potential connected node at (${startX}, ${nodeY})`);
  await page.mouse.click(startX, nodeY);
  await page.waitForTimeout(1000);
  
  // Take another screenshot after clicking
  await page.screenshot({ path: 'story-climb-after-clicks.png' });
  console.log('After-clicks screenshot taken');
  
  // Wait a bit more to see any delayed console messages
  await page.waitForTimeout(2000);
  
  console.log('Debug session complete. Check console output above.');
  
  await browser.close();
}

debugStoryClimb().catch(console.error);