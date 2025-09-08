const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  console.log('Navigating to story-climb page...');
  await page.goto('http://localhost:3100/scrap-yard/story-climb', { 
    waitUntil: 'networkidle',
    timeout: 30000 
  });
  
  // Wait for nodes to render
  await page.waitForTimeout(3000);
  
  // Take initial screenshot
  await page.screenshot({ path: 'story-climb-initial.png', fullPage: false });
  console.log('Initial screenshot saved as story-climb-initial.png');
  
  // Log canvas dimensions and visible nodes
  const canvasInfo = await page.evaluate(() => {
    const canvas = document.querySelector('[ref="canvasRef"]') || 
                   document.querySelector('div[style*="width"][style*="height"][style*="transform"]');
    const nodes = document.querySelectorAll('[class*="absolute cursor-pointer"]');
    const visibleNodes = [];
    
    // Get viewport info
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    // Check which nodes are visible
    Array.from(nodes).forEach((node, index) => {
      const rect = node.getBoundingClientRect();
      if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
        const id = node.querySelector('span:last-child')?.textContent || `Node ${index}`;
        visibleNodes.push({
          id,
          position: { x: rect.left, y: rect.top, width: rect.width, height: rect.height }
        });
      }
    });
    
    // Get canvas dimensions if found
    let canvasData = null;
    if (canvas) {
      const style = window.getComputedStyle(canvas);
      const transform = style.transform;
      canvasData = {
        width: canvas.style.width,
        height: canvas.style.height,
        transform: transform,
        actualWidth: canvas.offsetWidth,
        actualHeight: canvas.offsetHeight
      };
    }
    
    return {
      viewport,
      canvasData,
      totalNodes: nodes.length,
      visibleNodes,
      visibleCount: visibleNodes.length
    };
  });
  
  console.log('\n--- CANVAS INFO ---');
  console.log('Viewport:', canvasInfo.viewport);
  console.log('Canvas:', canvasInfo.canvasData);
  console.log(`Total nodes: ${canvasInfo.totalNodes}`);
  console.log(`Visible nodes: ${canvasInfo.visibleCount}`);
  console.log('Visible node IDs:', canvasInfo.visibleNodes.map(n => n.id).join(', '));
  
  // Try to scroll or check if START node is visible
  const startNodeInfo = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('[class*="absolute cursor-pointer"]'));
    const startNode = nodes.find(node => {
      const text = node.textContent;
      return text && (text.includes('START') || text.includes('start'));
    });
    
    if (startNode) {
      const rect = startNode.getBoundingClientRect();
      return {
        found: true,
        visible: rect.top >= 0 && rect.bottom <= window.innerHeight,
        position: { x: rect.left, y: rect.top, width: rect.width, height: rect.height }
      };
    }
    return { found: false };
  });
  
  console.log('\n--- START NODE INFO ---');
  console.log('START node:', startNodeInfo);
  
  // Check console for errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });
  
  await page.waitForTimeout(2000);
  
  await browser.close();
  console.log('\nTest complete!');
})();