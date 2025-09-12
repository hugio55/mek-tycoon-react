const { chromium } = require('playwright');

async function debugStoryClimb() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen for console messages
  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    console.log(`[BROWSER ${type.toUpperCase()}] ${text}`);
  });

  try {
    // Navigate to the Story Climb page
    console.log('Navigating to Story Climb page...');
    await page.goto('http://localhost:3100/scrap-yard/story-climb');
    
    // Wait longer for the page to load and data to come from Convex
    console.log('Waiting for page to load...');
    await page.waitForTimeout(10000); // Wait 10 seconds for Convex data
    
    // Take a screenshot of the current state
    await page.screenshot({ path: 'story-climb-current.png', fullPage: true });
    console.log('Screenshot taken: story-climb-current.png');

    // Check if we're still on loading screen or if we have content
    const loadingText = await page.textContent('body');
    if (loadingText.includes('Loading Story Mode')) {
      console.log('❌ Still showing loading screen - tree data not available');
    } else if (loadingText.includes('No Story Tree Data Found')) {
      console.log('❌ No story tree data found in database');
    } else {
      console.log('✅ Page loaded successfully, checking for canvas...');
      
      // Try to find the canvas
      try {
        await page.waitForSelector('canvas', { timeout: 5000 });
        console.log('✅ Canvas found');
        
        // Try clicking on canvas
        const canvas = await page.locator('canvas').first();
        const canvasBounds = await canvas.boundingBox();
        
        if (canvasBounds) {
          console.log('Canvas bounds:', canvasBounds);
          
          // Click in the center-bottom area where START node should be
          const startX = canvasBounds.x + canvasBounds.width / 2;
          const startY = canvasBounds.y + canvasBounds.height * 0.75;
          
          console.log(`Clicking near START node at (${startX}, ${startY})`);
          await page.mouse.click(startX, startY);
          await page.waitForTimeout(1000);
          
          // Try clicking above the START node
          const nodeY = canvasBounds.y + canvasBounds.height * 0.6;
          console.log(`Clicking on potential connected node at (${startX}, ${nodeY})`);
          await page.mouse.click(startX, nodeY);
          await page.waitForTimeout(1000);
        }
      } catch (error) {
        console.log('❌ Canvas not found:', error.message);
      }
    }
    
    // Wait a bit more to capture any delayed console messages
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('Error during debug:', error.message);
  }
  
  console.log('Debug session complete.');
  await browser.close();
}

debugStoryClimb().catch(console.error);