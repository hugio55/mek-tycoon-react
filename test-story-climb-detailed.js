const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  console.log('=== STORY CLIMB LAYOUT TEST ===\n');
  
  // Track console messages and errors
  const consoleMessages = [];
  const pageErrors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      pageErrors.push(msg.text());
    } else if (msg.text().includes('scroll') || msg.text().includes('node') || msg.text().includes('completed')) {
      consoleMessages.push(msg.text());
    }
  });
  
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  console.log('1. Loading story-climb page...');
  await page.goto('http://localhost:3100/scrap-yard/story-climb');
  await page.waitForTimeout(3000);
  
  // Check canvas and get initial state
  console.log('\n2. Analyzing initial state:');
  const initialState = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const container = document.querySelector('[style*="aspect-ratio"]');
    
    // Try to find nodes by looking at the canvas context (this is approximate)
    const ctx = canvas?.getContext('2d');
    
    return {
      canvasFound: !!canvas,
      canvasSize: canvas ? { width: canvas.width, height: canvas.height } : null,
      containerSize: container ? { 
        width: container.clientWidth, 
        height: container.clientHeight 
      } : null,
      aspectRatioStyle: container?.getAttribute('style'),
    };
  });
  
  console.log('   Canvas:', initialState.canvasFound ? `✓ Found (${initialState.canvasSize.width}x${initialState.canvasSize.height})` : '✗ Not found');
  console.log('   Container:', initialState.containerSize ? `✓ Found (${initialState.containerSize.width}x${initialState.containerSize.height})` : '✗ Not found');
  console.log('   Aspect ratio:', initialState.aspectRatioStyle?.includes('2/3') ? '✓ 2:3 ratio set' : '✗ Ratio issue');
  
  // Test node clicking and sizes
  console.log('\n3. Testing node interactions:');
  
  const canvas = await page.locator('canvas');
  const canvasBox = await canvas.boundingBox();
  
  if (canvasBox) {
    // Define test click positions for different node types
    const testClicks = [
      { name: 'Start node', x: canvasBox.width / 2, y: canvasBox.height - 100, expectedSize: 35 },
      { name: 'Normal node 1', x: canvasBox.width / 2 - 60, y: canvasBox.height - 180, expectedSize: 22 },
      { name: 'Normal node 2', x: canvasBox.width / 2 + 60, y: canvasBox.height - 180, expectedSize: 22 },
      { name: 'Upper node', x: canvasBox.width / 2, y: canvasBox.height - 250, expectedSize: 22 },
    ];
    
    for (const click of testClicks) {
      await page.mouse.click(canvasBox.x + click.x, canvasBox.y + click.y);
      await page.waitForTimeout(500);
      
      // Check if node was selected
      const nodeInfo = await page.evaluate(() => {
        const detailsPane = document.querySelector('.w-\\[300px\\]');
        const nodeId = detailsPane?.querySelector('.text-white.font-bold')?.textContent;
        const status = detailsPane?.querySelector('.text-green-500, .text-gray-400')?.textContent;
        return { nodeId, status };
      });
      
      console.log(`   ${click.name}: ${nodeInfo.nodeId ? `Selected (${nodeInfo.nodeId})` : 'Not selected'} - ${nodeInfo.status || 'No status'}`);
    }
  }
  
  // Test image loading
  console.log('\n4. Checking mechanism images:');
  
  // Since images are drawn on canvas, we need to check if image files are accessible
  const imageCheckResults = await page.evaluate(async () => {
    const testImages = [
      '/mek-images/150px/000-000-000.webp',
      '/mek-images/150px/111-111-111.webp',
      '/mek-images/150px/222-222-222.webp'
    ];
    
    const results = [];
    for (const src of testImages) {
      try {
        const response = await fetch(src, { method: 'HEAD' });
        results.push({ src, loaded: response.ok, status: response.status });
      } catch (e) {
        results.push({ src, loaded: false, error: e.message });
      }
    }
    return results;
  });
  
  imageCheckResults.forEach(result => {
    if (result.loaded) {
      console.log(`   ✓ ${result.src} - Loaded`);
    } else {
      console.log(`   ✗ ${result.src} - Failed (${result.status || result.error})`);
    }
  });
  
  // Test auto-scroll behavior
  console.log('\n5. Testing auto-scroll (completing nodes):');
  
  // Complete several nodes moving upward
  const scrollTestClicks = [
    { x: canvasBox.width / 2, y: canvasBox.height - 100 },  // Start
    { x: canvasBox.width / 2 - 60, y: canvasBox.height - 180 },
    { x: canvasBox.width / 2 + 60, y: canvasBox.height - 180 },
    { x: canvasBox.width / 2, y: canvasBox.height - 250 },
    { x: canvasBox.width / 2 - 30, y: canvasBox.height - 320 },
    { x: canvasBox.width / 2 + 30, y: canvasBox.height - 320 },
  ];
  
  for (let i = 0; i < scrollTestClicks.length; i++) {
    await page.mouse.click(canvasBox.x + scrollTestClicks[i].x, canvasBox.y + scrollTestClicks[i].y);
    await page.waitForTimeout(1000);
    
    // Check progress
    const progress = await page.evaluate(() => {
      const progressText = document.querySelector('.text-yellow-500.font-bold')?.textContent;
      return progressText;
    });
    
    console.log(`   Click ${i + 1}: Progress - ${progress || 'Unknown'}`);
  }
  
  // Check if any auto-scroll happened
  const scrollMessages = consoleMessages.filter(msg => msg.toLowerCase().includes('scroll'));
  if (scrollMessages.length > 0) {
    console.log('   Auto-scroll triggered:');
    scrollMessages.forEach(msg => console.log(`     - ${msg}`));
  } else {
    console.log('   No auto-scroll detected in console');
  }
  
  // Test manual scrolling
  console.log('\n6. Testing manual scroll (mouse wheel):');
  await page.mouse.move(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2);
  
  await page.mouse.wheel(0, -300);
  await page.waitForTimeout(500);
  console.log('   Scrolled up 300px');
  
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(500);
  console.log('   Scrolled down 300px');
  
  // Check glow effect on available nodes
  console.log('\n7. Checking node glow effects:');
  const glowCheck = await page.evaluate(() => {
    // This is approximate since glow is rendered on canvas
    const canvas = document.querySelector('canvas');
    return {
      canvasHasShadowEffects: !!canvas,
      detailsPaneVisible: !!document.querySelector('.w-\\[300px\\]'),
    };
  });
  
  console.log('   Canvas rendering:', glowCheck.canvasHasShadowEffects ? '✓ Active' : '✗ Inactive');
  console.log('   Details pane:', glowCheck.detailsPaneVisible ? '✓ Visible' : '✗ Not visible');
  
  // Check responsive behavior
  console.log('\n8. Testing responsive layout:');
  
  // Mobile view
  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(1000);
  const mobileCanvas = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    return canvas ? { width: canvas.width, height: canvas.height } : null;
  });
  console.log(`   Mobile (375x667): Canvas ${mobileCanvas ? `${mobileCanvas.width}x${mobileCanvas.height}` : 'Not found'}`);
  
  // Tablet view
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(1000);
  const tabletCanvas = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    return canvas ? { width: canvas.width, height: canvas.height } : null;
  });
  console.log(`   Tablet (768x1024): Canvas ${tabletCanvas ? `${tabletCanvas.width}x${tabletCanvas.height}` : 'Not found'}`);
  
  // Return to desktop
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.waitForTimeout(1000);
  
  // Final screenshots
  console.log('\n9. Taking screenshots:');
  await page.screenshot({ path: 'story-climb-test-final.png' });
  console.log('   ✓ Final screenshot saved');
  
  // Report errors
  console.log('\n10. Error Report:');
  if (pageErrors.length > 0) {
    console.log('   ✗ Page errors found:');
    pageErrors.forEach(err => console.log(`     - ${err}`));
  } else {
    console.log('   ✓ No page errors');
  }
  
  // Summary
  console.log('\n=== TEST SUMMARY ===');
  console.log('Node sizes should be:');
  console.log('  - Normal: 22px');
  console.log('  - Event: 40px (circles)');
  console.log('  - Boss: 50px');
  console.log('  - Final Boss: 60px');
  console.log('\nCheck story-climb-test-final.png for visual verification');
  
  await browser.close();
})();