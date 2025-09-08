const { chromium } = require('playwright');

async function testEdgeCases() {
  const browser = await chromium.launch({ headless: false });
  
  // Test different scenarios that might cause nodes to not appear
  const scenarios = [
    { name: 'Fresh Browser (no cache)', context: { storageState: null } },
    { name: 'Small Viewport', viewport: { width: 800, height: 600 } },
    { name: 'Large Viewport', viewport: { width: 1920, height: 1080 } },
  ];
  
  for (const scenario of scenarios) {
    try {
      console.log(`\n=== Testing: ${scenario.name} ===`);
      
      const context = await browser.newContext(scenario.context || {});
      const page = await context.newPage();
      
      if (scenario.viewport) {
        await page.setViewportSize(scenario.viewport);
      } else {
        await page.setViewportSize({ width: 1440, height: 900 });
      }
      
      const logs = [];
      page.on('console', msg => logs.push(`${msg.type()}: ${msg.text()}`));
      
      console.log('📍 Navigating to story-climb...');
      await page.goto('http://localhost:3100/scrap-yard/story-climb');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Check if nodes are visible
      const nodeCount = await page.$$eval('.absolute.cursor-pointer', els => els.length);
      console.log(`🎯 Nodes found: ${nodeCount}`);
      
      // Check canvas dimensions
      const canvasInfo = await page.evaluate(() => {
        const canvas = document.querySelector('.relative[style*="transform"]') || 
                       document.querySelector('.relative[style*="width"]');
        if (!canvas) return null;
        
        const rect = canvas.getBoundingClientRect();
        const style = window.getComputedStyle(canvas);
        
        return {
          visible: rect.width > 0 && rect.height > 0,
          dimensions: { width: rect.width, height: rect.height },
          transform: canvas.style.transform,
          opacity: style.opacity,
          display: style.display
        };
      });
      
      console.log('📐 Canvas info:', canvasInfo);
      
      // Take a quick screenshot for this scenario
      const filename = `story-climb-${scenario.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
      await page.screenshot({ path: filename, fullPage: false });
      console.log(`📸 Screenshot: ${filename}`);
      
      // Check for specific error conditions
      const errorChecks = await page.evaluate(() => {
        const errors = [];
        
        // Check if canvas container exists but is empty
        const canvas = document.querySelector('.relative[style*="transform"]') || 
                       document.querySelector('.relative[style*="width"]');
        if (canvas && canvas.children.length === 0) {
          errors.push('Canvas container empty');
        }
        
        // Check if nodes exist but are positioned offscreen
        const nodes = Array.from(document.querySelectorAll('.absolute.cursor-pointer'));
        const offscreenNodes = nodes.filter(node => {
          const rect = node.getBoundingClientRect();
          return rect.left < -100 || rect.top < -100 || rect.left > window.innerWidth + 100 || rect.top > window.innerHeight + 100;
        });
        
        if (offscreenNodes.length > 0) {
          errors.push(`${offscreenNodes.length} nodes positioned offscreen`);
        }
        
        // Check if nodes have zero opacity
        const hiddenNodes = nodes.filter(node => {
          const style = window.getComputedStyle(node);
          return style.opacity === '0' || style.visibility === 'hidden';
        });
        
        if (hiddenNodes.length > 0) {
          errors.push(`${hiddenNodes.length} nodes hidden by CSS`);
        }
        
        return {
          totalNodes: nodes.length,
          visibleNodes: nodes.filter(node => {
            const rect = node.getBoundingClientRect();
            const style = window.getComputedStyle(node);
            return rect.width > 0 && rect.height > 0 && 
                   style.opacity !== '0' && style.visibility !== 'hidden' &&
                   rect.left >= -50 && rect.top >= -50 && 
                   rect.right <= window.innerWidth + 50 && rect.bottom <= window.innerHeight + 50;
          }).length,
          errors
        };
      });
      
      console.log('🔍 Error analysis:', errorChecks);
      
      // Show any console errors specific to this scenario
      const errors = logs.filter(log => log.includes('error:'));
      if (errors.length > 0) {
        console.log('❌ Console errors:');
        errors.forEach(error => console.log('  ', error));
      } else {
        console.log('✅ No console errors detected');
      }
      
      await context.close();
      
    } catch (error) {
      console.error(`❌ Error in scenario "${scenario.name}":`, error.message);
    }
  }
  
  await browser.close();
}

testEdgeCases();