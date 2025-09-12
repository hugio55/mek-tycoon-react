const { chromium } = require('playwright');

async function inspectDOM() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Navigating to Story Climb...');
    await page.goto('http://localhost:3100/scrap-yard/story-climb');
    
    // Wait for page to fully load
    await page.waitForTimeout(8000);
    await page.waitForSelector('canvas');
    
    // Inspect the canvas and its event listeners
    const canvasInfo = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return { error: 'No canvas found' };
      
      const rect = canvas.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(canvas);
      
      // Check if canvas has event listeners
      const hasClickListener = canvas.onclick !== null;
      const hasMouseDownListener = canvas.onmousedown !== null;
      const hasMouseUpListener = canvas.onmouseup !== null;
      
      // Check parent container
      const container = canvas.parentElement;
      const containerRect = container ? container.getBoundingClientRect() : null;
      const containerStyle = container ? window.getComputedStyle(container) : null;
      
      // Check for overlapping elements
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const elementAtCenter = document.elementFromPoint(centerX, centerY);
      
      // Test several points on the canvas
      const testPoints = [
        { x: rect.left + 236, y: rect.top + 675, label: 'START node' },  // START position
        { x: rect.left + 259, y: rect.top + 475, label: 'Connected node' },  // Connected node
        { x: centerX, y: centerY, label: 'Canvas center' }
      ];
      
      const pointTests = testPoints.map(point => {
        const element = document.elementFromPoint(point.x, point.y);
        return {
          label: point.label,
          coordinates: { x: point.x, y: point.y },
          element: element ? {
            tagName: element.tagName,
            className: element.className,
            id: element.id
          } : null
        };
      });
      
      return {
        canvas: {
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          style: {
            position: computedStyle.position,
            zIndex: computedStyle.zIndex,
            pointerEvents: computedStyle.pointerEvents,
            display: computedStyle.display,
            visibility: computedStyle.visibility
          },
          hasClickListener,
          hasMouseDownListener,
          hasMouseUpListener
        },
        container: container ? {
          rect: { x: containerRect.x, y: containerRect.y, width: containerRect.width, height: containerRect.height },
          style: {
            position: containerStyle.position,
            zIndex: containerStyle.zIndex,
            pointerEvents: containerStyle.pointerEvents,
            overflow: containerStyle.overflow
          }
        } : null,
        elementAtCenter: elementAtCenter ? {
          tagName: elementAtCenter.tagName,
          className: elementAtCenter.className,
          id: elementAtCenter.id
        } : null,
        pointTests
      };
    });
    
    console.log('Canvas DOM inspection:');
    console.log(JSON.stringify(canvasInfo, null, 2));
    
    // Try direct canvas click using Playwright's canvas locator
    console.log('\nTrying to click using canvas locator...');
    const canvas = page.locator('canvas');
    
    // Check if canvas is visible and enabled
    const isVisible = await canvas.isVisible();
    const isEnabled = await canvas.isEnabled();
    console.log('Canvas visible:', isVisible, 'enabled:', isEnabled);
    
    // Try different click approaches
    try {
      console.log('Trying canvas.click()...');
      await canvas.click({ position: { x: 236, y: 675 } });
      await page.waitForTimeout(1000);
      
      console.log('Trying canvas.dispatchEvent...');
      await canvas.dispatchEvent('click', { 
        detail: 1,
        clientX: 236,
        clientY: 675
      });
      await page.waitForTimeout(1000);
      
    } catch (error) {
      console.log('Canvas click error:', error.message);
    }
    
  } catch (error) {
    console.error('Error during inspection:', error.message);
  }
  
  console.log('DOM inspection complete.');
  await browser.close();
}

inspectDOM().catch(console.error);