const { chromium } = require('playwright');

async function testNodeSelection() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen for ALL console messages to see the complete flow
  page.on('console', (msg) => {
    const text = msg.text();
    // Filter for relevant messages
    if (text.includes('Click') || text.includes('Node') || text.includes('adjacency') || 
        text.includes('Unlocking') || text.includes('START') || text.includes('canvas coords')) {
      console.log(`[CONSOLE] ${text}`);
    }
  });

  try {
    console.log('Navigating to Story Climb...');
    await page.goto('http://localhost:3100/scrap-yard/story-climb');
    
    await page.waitForTimeout(8000);
    await page.waitForSelector('canvas');
    
    const canvas = page.locator('canvas');
    
    console.log('\n=== Testing Node Selection ===');
    
    // First, try clicking directly on START node (should be ignored)
    console.log('1. Clicking on START node (should be ignored):');
    await canvas.click({ position: { x: 236, y: 675 } });
    await page.waitForTimeout(1500);
    
    // Click on a connected node that should be available
    console.log('\n2. Clicking on connected node (should unlock it):');
    await canvas.click({ position: { x: 259, y: 475 } });
    await page.waitForTimeout(1500);
    
    // Try clicking on another connected node
    console.log('\n3. Clicking on another potential node:');
    await canvas.click({ position: { x: 191, y: 192 } });
    await page.waitForTimeout(1500);
    
    // Try clicking on a node that should NOT be available (not connected)
    console.log('\n4. Clicking on a distant node (should be ignored):');
    await canvas.click({ position: { x: 443, y: 321 } });
    await page.waitForTimeout(1500);
    
    // Try clicking a few more potential nodes to see adjacency detection
    console.log('\n5. Testing several more nodes:');
    const testPositions = [
      { x: 300, y: 600, label: 'Middle area' },
      { x: 200, y: 550, label: 'Left side' },
      { x: 350, y: 500, label: 'Right side' }
    ];
    
    for (const pos of testPositions) {
      console.log(`\nClicking ${pos.label} at (${pos.x}, ${pos.y}):`);
      await canvas.click({ position: { x: pos.x, y: pos.y } });
      await page.waitForTimeout(1000);
    }
    
    // Take a screenshot to see the final state
    await page.screenshot({ path: 'node-selection-test.png', fullPage: true });
    console.log('\nScreenshot saved as node-selection-test.png');
    
    // Check current state in the React component
    const gameState = await page.evaluate(() => {
      // Try to access React state if possible
      const canvas = document.querySelector('canvas');
      if (canvas && canvas._reactInternalInstance) {
        // This might not work in production, but worth trying
        return 'React state access attempted';
      }
      return 'No React state access';
    });
    
    console.log('Game state:', gameState);
    
  } catch (error) {
    console.error('Error during node selection test:', error.message);
  }
  
  console.log('\n=== Node Selection Test Complete ===');
  await browser.close();
}

testNodeSelection().catch(console.error);