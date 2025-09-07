const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testModalLayouts() {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();
  
  // Set viewport to a standard size
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  const results = {
    timestamp: new Date().toISOString(),
    testResults: {}
  };
  
  try {
    console.log('🚀 Starting modal layout tests...');
    
    // Navigate to the contracts page
    await page.goto('http://localhost:3100/contracts/single-missions');
    await page.waitForTimeout(2000);
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'test-screenshots/00-initial-page.png',
      fullPage: true 
    });
    console.log('✅ Initial page loaded');
    
    // Test each layout option
    const layoutOptions = [
      { value: 'v1', name: 'Option 1: Industrial Sharp' },
      { value: 'v2', name: 'Option 2: Neon Cyberpunk' },
      { value: 'v3', name: 'Option 3: Clean Professional' }
    ];
    
    for (const layout of layoutOptions) {
      console.log(`\n🧪 Testing ${layout.name}...`);
      
      // Select the layout option
      await page.selectOption('select[class*="jsx"]', layout.value);
      await page.waitForTimeout(1000);
      
      // Take screenshot of layout selection
      await page.screenshot({ 
        path: `test-screenshots/01-${layout.value}-selected.png`,
        fullPage: true 
      });
      
      // Test 1: Click Outside to Close Test
      console.log('  📍 Testing click outside to close...');
      
      // Click on first empty mek slot to open modal
      await page.click('.mek-slot:first-child');
      await page.waitForTimeout(1500);
      
      // Take screenshot of modal open
      await page.screenshot({ 
        path: `test-screenshots/02-${layout.value}-modal-open.png`,
        fullPage: true 
      });
      
      // Check if modal is visible
      const modalVisible = await page.isVisible('.modal-backdrop, .modal-overlay, [role="dialog"], .fixed.inset-0');
      console.log(`    ✅ Modal opened: ${modalVisible}`);
      
      // Try to click outside to close
      if (modalVisible) {
        // Click on backdrop area
        await page.click('body', { position: { x: 100, y: 100 } });
        await page.waitForTimeout(1000);
        
        // Check if modal closed
        const modalClosed = !(await page.isVisible('.modal-backdrop, .modal-overlay, [role="dialog"], .fixed.inset-0'));
        console.log(`    ✅ Modal closed on outside click: ${modalClosed}`);
        
        results.testResults[layout.value] = {
          ...results.testResults[layout.value],
          clickOutsideToClose: modalClosed
        };
      }
      
      // Test 2: Visual Design Test
      console.log('  📍 Testing visual design...');
      
      // Open modal again for design inspection
      await page.click('.mek-slot:first-child');
      await page.waitForTimeout(1500);
      
      // Check for rounded corners (should be sharp)
      const hasRoundedCorners = await page.evaluate(() => {
        const modals = document.querySelectorAll('[role="dialog"], .modal, .fixed.inset-0 > div');
        for (const modal of modals) {
          const styles = getComputedStyle(modal);
          if (styles.borderRadius && styles.borderRadius !== '0px') {
            return true;
          }
        }
        return false;
      });
      
      // Count variation bubbles
      const bubbleCount = await page.locator('.rounded-full, [class*="bubble"], [class*="variation"]').count();
      
      // Check for chip slots cutoff
      const chipSlotsVisible = await page.locator('[class*="chip"], [class*="slot"]').count();
      
      results.testResults[layout.value] = {
        ...results.testResults[layout.value],
        hasRoundedCorners: hasRoundedCorners,
        bubbleCount: bubbleCount,
        chipSlotsVisible: chipSlotsVisible
      };
      
      console.log(`    ✅ Rounded corners: ${hasRoundedCorners ? 'FOUND (should be sharp)' : 'NONE (good)'}`);
      console.log(`    ✅ Variation bubbles: ${bubbleCount}`);
      console.log(`    ✅ Chip slots visible: ${chipSlotsVisible}`);
      
      // Test 3: Hover Interactions
      console.log('  📍 Testing hover interactions...');
      
      // Find meks with matching traits
      const mekElements = await page.locator('[class*="mek"], [data-mek-id], img[alt*="mek"]').all();
      
      if (mekElements.length > 0) {
        // Hover over first mek
        await mekElements[0].hover();
        await page.waitForTimeout(1000);
        
        // Take screenshot of hover state
        await page.screenshot({ 
          path: `test-screenshots/03-${layout.value}-hover-state.png`,
          fullPage: true 
        });
        
        // Check if tooltip appeared
        const tooltipVisible = await page.isVisible('[role="tooltip"], .tooltip, [class*="tooltip"]');
        console.log(`    ✅ Hover tooltip: ${tooltipVisible}`);
        
        results.testResults[layout.value] = {
          ...results.testResults[layout.value],
          hoverTooltip: tooltipVisible
        };
      }
      
      // Test 4: Match Visibility
      console.log('  📍 Testing match visibility...');
      
      // Look for highlighted/matched elements
      const highlightedElements = await page.evaluate(() => {
        const highlighted = [];
        const allElements = document.querySelectorAll('*');
        
        for (const el of allElements) {
          const styles = getComputedStyle(el);
          
          // Check for various highlight indicators
          if (
            styles.boxShadow.includes('yellow') ||
            styles.boxShadow.includes('glow') ||
            styles.border.includes('yellow') ||
            styles.backgroundColor.includes('yellow') ||
            styles.border.includes('green') ||
            styles.border.includes('blue') ||
            styles.border.includes('cyan') ||
            styles.border.includes('purple')
          ) {
            highlighted.push({
              tagName: el.tagName,
              className: el.className,
              styles: {
                boxShadow: styles.boxShadow,
                border: styles.border,
                backgroundColor: styles.backgroundColor
              }
            });
          }
        }
        return highlighted;
      });
      
      console.log(`    ✅ Highlighted elements found: ${highlightedElements.length}`);
      results.testResults[layout.value] = {
        ...results.testResults[layout.value],
        highlightedElements: highlightedElements.length,
        highlightDetails: highlightedElements.slice(0, 3) // Store first 3 for reference
      };
      
      // Test 5: Layout Quality
      console.log('  📍 Testing layout quality...');
      
      // Check viewport and scrolling
      const viewportWidth = await page.viewportSize();
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const hasHorizontalScroll = bodyWidth > viewportWidth.width;
      
      // Check text readability
      const textElements = await page.locator('text=').all();
      const textReadable = textElements.length > 0;
      
      results.testResults[layout.value] = {
        ...results.testResults[layout.value],
        hasHorizontalScroll,
        textReadable,
        viewportWidth: viewportWidth.width,
        bodyWidth
      };
      
      console.log(`    ✅ Horizontal scroll: ${hasHorizontalScroll ? 'YES (potential issue)' : 'NO (good)'}`);
      console.log(`    ✅ Text readable: ${textReadable}`);
      
      // Take final screenshot of this layout
      await page.screenshot({ 
        path: `test-screenshots/04-${layout.value}-final-state.png`,
        fullPage: true 
      });
      
      // Close modal before next test
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
      
      console.log(`✅ ${layout.name} testing complete`);
    }
    
    // Save results to JSON file
    fs.writeFileSync('test-results.json', JSON.stringify(results, null, 2));
    
    console.log('\n📊 Test Summary:');
    console.log('================');
    
    for (const [layout, data] of Object.entries(results.testResults)) {
      console.log(`\n${layout.toUpperCase()}:`);
      console.log(`  Click outside to close: ${data.clickOutsideToClose ? '✅' : '❌'}`);
      console.log(`  Sharp edges (no rounds): ${!data.hasRoundedCorners ? '✅' : '❌'}`);
      console.log(`  Variation bubbles: ${data.bubbleCount <= 10 ? '✅' : '❌'} (${data.bubbleCount})`);
      console.log(`  Chip slots visible: ${data.chipSlotsVisible > 0 ? '✅' : '❌'} (${data.chipSlotsVisible})`);
      console.log(`  Hover tooltip: ${data.hoverTooltip ? '✅' : '❌'}`);
      console.log(`  Highlighted elements: ${data.highlightedElements} found`);
      console.log(`  No horizontal scroll: ${!data.hasHorizontalScroll ? '✅' : '❌'}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    results.error = error.message;
  } finally {
    await browser.close();
  }
  
  return results;
}

// Create screenshots directory if it doesn't exist
if (!fs.existsSync('test-screenshots')) {
  fs.mkdirSync('test-screenshots');
}

// Run the tests
testModalLayouts().then(results => {
  console.log('\n🎉 All tests completed!');
  console.log('📸 Screenshots saved in test-screenshots/ directory');
  console.log('📋 Detailed results saved in test-results.json');
}).catch(error => {
  console.error('💥 Test runner failed:', error);
});