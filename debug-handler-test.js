const { chromium } = require('playwright');

async function testHandlers() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen for console messages
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('Click') || text.includes('Mouse') || text.includes('Event')) {
      console.log(`[CONSOLE] ${text}`);
    }
  });

  try {
    console.log('Navigating to Story Climb...');
    await page.goto('http://localhost:3100/scrap-yard/story-climb');
    
    await page.waitForTimeout(8000);
    await page.waitForSelector('canvas');
    
    // Add a manual event listener to test if events reach the canvas at all
    await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        console.log('Adding manual event listeners for testing...');
        
        canvas.addEventListener('click', (e) => {
          console.log('MANUAL CLICK LISTENER TRIGGERED:', e.clientX, e.clientY);
        });
        
        canvas.addEventListener('mousedown', (e) => {
          console.log('MANUAL MOUSEDOWN LISTENER TRIGGERED:', e.clientX, e.clientY);
        });
        
        canvas.addEventListener('mouseup', (e) => {
          console.log('MANUAL MOUSEUP LISTENER TRIGGERED:', e.clientX, e.clientY);
        });
        
        canvas.addEventListener('mousemove', (e) => {
          // Only log every 50th mousemove to avoid spam
          if (Math.random() > 0.98) {
            console.log('MANUAL MOUSEMOVE LISTENER TRIGGERED:', e.clientX, e.clientY);
          }
        });
        
        console.log('Manual listeners added to canvas');
        
        // Also test direct element detection
        const rect = canvas.getBoundingClientRect();
        const testPoints = [
          { x: rect.left + 236, y: rect.top + 675, label: 'START' },
          { x: rect.left + 259, y: rect.top + 475, label: 'Connected' },
          { x: rect.left + 300, y: rect.top + 450, label: 'Canvas middle' }
        ];
        
        testPoints.forEach(point => {
          const element = document.elementFromPoint(point.x, point.y);
          console.log(`Element at ${point.label} (${point.x}, ${point.y}):`, element ? element.tagName : 'null');
        });
      } else {
        console.log('No canvas found for manual listeners');
      }
    });
    
    console.log('Testing with manual listeners...');
    
    // Try multiple click approaches
    const canvas = page.locator('canvas');
    const bounds = await canvas.boundingBox();
    
    // Direct coordinate click
    console.log('Trying page.mouse.click...');
    await page.mouse.click(bounds.x + 236, bounds.y + 675);
    await page.waitForTimeout(1000);
    
    // Canvas locator click with position
    console.log('Trying canvas.click with position...');
    await canvas.click({ position: { x: 236, y: 675 } });
    await page.waitForTimeout(1000);
    
    // Try clicking on a different part of canvas that should be more accessible
    console.log('Trying middle of canvas...');
    await canvas.click({ position: { x: 300, y: 450 } });
    await page.waitForTimeout(1000);
    
    // Try to force focus on the canvas and then try clicking
    console.log('Focusing canvas and trying again...');
    await canvas.focus();
    await canvas.click({ position: { x: 300, y: 450 } });
    await page.waitForTimeout(1000);
    
    // Try with modifier keys to see if that changes behavior
    console.log('Trying click with modifier keys...');
    await page.keyboard.down('Control');
    await canvas.click({ position: { x: 236, y: 675 } });
    await page.keyboard.up('Control');
    await page.waitForTimeout(2000);
    
  } catch (error) {
    console.error('Error during handler test:', error.message);
  }
  
  console.log('Handler test complete.');
  await browser.close();
}

testHandlers().catch(console.error);