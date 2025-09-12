const { chromium } = require('playwright');

async function testClicking() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen for ALL console messages
  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    // Filter out repetitive debug messages but keep click-related ones
    if (text.includes('Click') || text.includes('Node clicked') || text.includes('adjacency') || 
        text.includes('hasDragged') || text.includes('Canvas render complete') ||
        (text.includes('Canvas draw effect') && Math.random() > 0.9)) {
      console.log(`[${type.toUpperCase()}] ${text}`);
    }
  });

  try {
    console.log('Navigating to Story Climb...');
    await page.goto('http://localhost:3100/scrap-yard/story-climb');
    
    // Wait for page to fully load
    console.log('Waiting for page to load...');
    await page.waitForTimeout(8000);
    
    // Wait for canvas to be ready
    await page.waitForSelector('canvas');
    console.log('Canvas found, attempting clicks...');
    
    // Get canvas element
    const canvas = page.locator('canvas').first();
    const canvasBounds = await canvas.boundingBox();
    console.log('Canvas bounds:', canvasBounds);
    
    // Test basic canvas click detection - try clicking directly where START should be
    // Based on console output, START is at (236, 675) on canvas, which means:
    // Canvas coordinates (236, 675) + canvas offset
    const startCanvasX = 236;
    const startCanvasY = 675;
    const clickX = canvasBounds.x + startCanvasX;
    const clickY = canvasBounds.y + startCanvasY;
    
    console.log(`Clicking directly on START node at canvas coords (${startCanvasX}, ${startCanvasY}) -> screen coords (${clickX}, ${clickY})`);
    
    // Try multiple click types to see if any work
    await page.mouse.click(clickX, clickY);
    await page.waitForTimeout(1000);
    
    console.log('Trying mousedown/mouseup separately...');
    await page.mouse.move(clickX, clickY);
    await page.mouse.down();
    await page.waitForTimeout(100);
    await page.mouse.up();
    await page.waitForTimeout(1000);
    
    // Try clicking a connected node (one that should be clickable)
    // Node at (259, 475) according to console
    const nodeCanvasX = 259;
    const nodeCanvasY = 475;
    const nodeClickX = canvasBounds.x + nodeCanvasX;
    const nodeClickY = canvasBounds.y + nodeCanvasY;
    
    console.log(`Clicking on connected node at canvas coords (${nodeCanvasX}, ${nodeCanvasY}) -> screen coords (${nodeClickX}, ${nodeClickY})`);
    await page.mouse.click(nodeClickX, nodeClickY);
    await page.waitForTimeout(1000);
    
    // Try with different mouse button
    console.log('Trying right click...');
    await page.mouse.click(clickX, clickY, { button: 'right' });
    await page.waitForTimeout(1000);
    
    // Check if there are any overlaying elements blocking clicks
    const elementAtPoint = await page.evaluate(({ x, y }) => {
      const element = document.elementFromPoint(x, y);
      return {
        tagName: element?.tagName,
        className: element?.className,
        id: element?.id,
        pointerEvents: window.getComputedStyle(element || document.body).pointerEvents
      };
    }, { x: clickX, y: clickY });
    
    console.log('Element at click point:', elementAtPoint);
    
    // Wait a bit more for any delayed reactions
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('Error during test:', error.message);
  }
  
  console.log('Click test complete.');
  await browser.close();
}

testClicking().catch(console.error);