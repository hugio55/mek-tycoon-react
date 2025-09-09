const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log('🚀 Starting Story Climb Layout Test...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });
  
  const page = await browser.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    const type = msg.type();
    console.log(`[CONSOLE ${type.toUpperCase()}]:`, msg.text());
  });
  
  // Listen for page errors
  page.on('pageerror', error => {
    console.error('❌ PAGE ERROR:', error.message);
  });
  
  try {
    console.log('📍 Navigating to story climb page...');
    await page.goto('http://localhost:3100/scrap-yard/story-climb', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    console.log('📸 Taking initial screenshot...');
    await page.screenshot({ 
      path: 'story-climb-layout-test.png', 
      fullPage: true 
    });
    
    // Check for the two-column layout
    console.log('🔍 Checking layout structure...');
    
    const layoutInfo = await page.evaluate(() => {
      // Check for left and right containers
      const leftContainer = document.querySelector('[class*="left"]') || 
                           document.querySelector('[class*="canvas"]') ||
                           document.querySelector('canvas');
      const rightContainer = document.querySelector('[class*="right"]') || 
                            document.querySelector('[class*="details"]') ||
                            document.querySelector('[class*="pane"]');
      
      // Get main container info
      const mainContainer = document.querySelector('main') || document.querySelector('.container') || document.body;
      const containerStyle = window.getComputedStyle(mainContainer);
      
      return {
        hasLeftContainer: !!leftContainer,
        hasRightContainer: !!rightContainer,
        leftContainerClass: leftContainer?.className || 'Not found',
        rightContainerClass: rightContainer?.className || 'Not found',
        mainDisplay: containerStyle.display,
        mainFlexDirection: containerStyle.flexDirection,
        mainGridTemplate: containerStyle.gridTemplateColumns,
        pageTitle: document.title,
        hasCanvas: !!document.querySelector('canvas'),
        canvasSize: document.querySelector('canvas') ? {
          width: document.querySelector('canvas').width,
          height: document.querySelector('canvas').height
        } : null
      };
    });
    
    console.log('📋 Layout Analysis:');
    console.log('- Has Left Container:', layoutInfo.hasLeftContainer);
    console.log('- Has Right Container:', layoutInfo.hasRightContainer);
    console.log('- Left Container Class:', layoutInfo.leftContainerClass);
    console.log('- Right Container Class:', layoutInfo.rightContainerClass);
    console.log('- Main Display:', layoutInfo.mainDisplay);
    console.log('- Main Flex Direction:', layoutInfo.mainFlexDirection);
    console.log('- Main Grid Template:', layoutInfo.mainGridTemplate);
    console.log('- Has Canvas:', layoutInfo.hasCanvas);
    if (layoutInfo.canvasSize) {
      console.log('- Canvas Size:', `${layoutInfo.canvasSize.width}x${layoutInfo.canvasSize.height}`);
    }
    
    // Check viewport and layout specifics
    const viewportInfo = await page.evaluate(() => {
      return {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        documentWidth: document.documentElement.scrollWidth,
        documentHeight: document.documentElement.scrollHeight
      };
    });
    
    console.log('📐 Viewport Info:');
    console.log(`- Window: ${viewportInfo.innerWidth}x${viewportInfo.innerHeight}`);
    console.log(`- Document: ${viewportInfo.documentWidth}x${viewportInfo.documentHeight}`);
    
    // Test interaction with canvas if it exists
    if (layoutInfo.hasCanvas) {
      console.log('🖱️ Testing canvas interaction...');
      const canvas = await page.$('canvas');
      if (canvas) {
        const canvasBounds = await canvas.boundingBox();
        console.log('- Canvas bounds:', canvasBounds);
        
        // Click in the center of the canvas
        if (canvasBounds) {
          await page.click('canvas', {
            offset: {
              x: canvasBounds.width / 2,
              y: canvasBounds.height / 2
            }
          });
          
          // Wait for any potential updates
          await page.waitForTimeout(1000);
          
          // Take another screenshot after interaction
          console.log('📸 Taking post-interaction screenshot...');
          await page.screenshot({ 
            path: 'story-climb-after-interaction.png', 
            fullPage: true 
          });
        }
      }
    }
    
    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      url: page.url(),
      layoutInfo,
      viewportInfo,
      testResult: layoutInfo.hasLeftContainer && layoutInfo.hasRightContainer ? 'PASS' : 'FAIL',
      issues: []
    };
    
    if (!layoutInfo.hasLeftContainer) {
      report.issues.push('Left container not detected');
    }
    if (!layoutInfo.hasRightContainer) {
      report.issues.push('Right container not detected');
    }
    if (!layoutInfo.hasCanvas) {
      report.issues.push('Canvas not found');
    }
    
    fs.writeFileSync('story-climb-layout-report.json', JSON.stringify(report, null, 2));
    
    console.log('✅ Test completed! Check screenshots and report.');
    console.log('📊 Overall Result:', report.testResult);
    if (report.issues.length > 0) {
      console.log('⚠️ Issues found:', report.issues.join(', '));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();