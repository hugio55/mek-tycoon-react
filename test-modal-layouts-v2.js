const { chromium } = require('playwright');
const fs = require('fs');

async function testModalLayouts() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  
  // Set viewport to a standard size
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  const results = {
    timestamp: new Date().toISOString(),
    testResults: {},
    screenshots: []
  };
  
  try {
    console.log('🚀 Starting modal layout tests...');
    
    // Navigate to the contracts page
    await page.goto('http://localhost:3100/contracts/single-missions');
    await page.waitForTimeout(3000);
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'test-screenshots/00-initial-page.png',
      fullPage: true 
    });
    results.screenshots.push('00-initial-page.png');
    console.log('✅ Initial page loaded');
    
    // Test each layout option
    const layoutOptions = [
      { value: 'v1', name: 'Option 1: Industrial Sharp', color: 'yellow' },
      { value: 'v2', name: 'Option 2: Neon Cyberpunk', color: 'cyan' },
      { value: 'v3', name: 'Option 3: Clean Professional', color: 'blue' }
    ];
    
    for (const layout of layoutOptions) {
      console.log(`\n🧪 Testing ${layout.name}...`);
      
      // Initialize test results for this layout
      results.testResults[layout.value] = {
        name: layout.name,
        tests: {}
      };
      
      try {
        // Select the layout option from dropdown
        console.log('  📝 Selecting layout option...');
        await page.selectOption('select', layout.value);
        await page.waitForTimeout(1000);
        
        // Take screenshot of layout selection
        const selectionScreenshot = `01-${layout.value}-selected.png`;
        await page.screenshot({ 
          path: `test-screenshots/${selectionScreenshot}`,
          fullPage: true 
        });
        results.screenshots.push(selectionScreenshot);
        
        // TEST 1: Modal Opening
        console.log('  📍 Test 1: Opening modal...');
        
        // Find and click first empty mek slot
        const mekSlot = await page.locator('.mek-slot').first();
        await mekSlot.click();
        await page.waitForTimeout(2000);
        
        // Check if modal is open
        const modalOpen = await page.isVisible('.fixed.inset-0');
        results.testResults[layout.value].tests.modalOpens = modalOpen;
        console.log(`    ✅ Modal opens: ${modalOpen}`);
        
        if (modalOpen) {
          // Take screenshot of opened modal
          const modalScreenshot = `02-${layout.value}-modal-open.png`;
          await page.screenshot({ 
            path: `test-screenshots/${modalScreenshot}`,
            fullPage: true 
          });
          results.screenshots.push(modalScreenshot);
          
          // TEST 2: Click Outside to Close
          console.log('  📍 Test 2: Click outside to close...');
          
          // Click on backdrop (use coordinates outside the modal)
          await page.click('body', { position: { x: 100, y: 100 } });
          await page.waitForTimeout(1000);
          
          // Check if modal closed
          const modalClosed = !(await page.isVisible('.fixed.inset-0'));
          results.testResults[layout.value].tests.clickOutsideToClose = modalClosed;
          console.log(`    ✅ Click outside closes modal: ${modalClosed}`);
          
          if (!modalClosed) {
            // Try clicking the backdrop div directly
            await page.click('.fixed.inset-0', { position: { x: 50, y: 50 } });
            await page.waitForTimeout(1000);
            const backdropClosed = !(await page.isVisible('.fixed.inset-0'));
            results.testResults[layout.value].tests.backdropClickCloses = backdropClosed;
            console.log(`    🔄 Backdrop click closes modal: ${backdropClosed}`);
          }
          
          // Re-open modal for further tests
          if (modalClosed) {
            await mekSlot.click();
            await page.waitForTimeout(2000);
          }
          
          // TEST 3: Visual Design Elements
          console.log('  📍 Test 3: Visual design inspection...');
          
          // Check for rounded corners (should be sharp for v1)
          const modalElement = await page.locator('.fixed.inset-0 > div').first();
          const borderRadius = await modalElement.evaluate(el => {
            const styles = getComputedStyle(el);
            return styles.borderRadius;
          });
          
          const hasSharpEdges = borderRadius === '0px' || borderRadius === '';
          results.testResults[layout.value].tests.hasSharpEdges = hasSharpEdges;
          console.log(`    ✅ Sharp edges (no rounds): ${hasSharpEdges} (border-radius: ${borderRadius})`);
          
          // Count variation bubbles (should be max 10)
          const bubbleCount = await page.locator('[alt], .w-20.h-20, .w-16.h-16').count();
          results.testResults[layout.value].tests.bubbleCount = bubbleCount;
          results.testResults[layout.value].tests.bubbleCountGood = bubbleCount <= 10;
          console.log(`    ✅ Variation bubbles: ${bubbleCount} (≤10: ${bubbleCount <= 10})`);
          
          // Check for chip slots visibility
          const chipSlots = await page.locator('[class*="chip"], .w-10.h-10').count();
          results.testResults[layout.value].tests.chipSlotsCount = chipSlots;
          results.testResults[layout.value].tests.chipSlotsVisible = chipSlots > 0;
          console.log(`    ✅ Chip slots visible: ${chipSlots > 0} (count: ${chipSlots})`);
          
          // TEST 4: Hover Interactions
          console.log('  📍 Test 4: Hover interactions...');
          
          // Find variation bubbles and hover over first one
          const firstBubble = await page.locator('img[alt], .w-20.h-20 img, .w-16.h-16 img').first();
          if (await firstBubble.count() > 0) {
            try {
              await firstBubble.hover();
              await page.waitForTimeout(1000);
              
              // Take screenshot of hover state
              const hoverScreenshot = `03-${layout.value}-hover-bubble.png`;
              await page.screenshot({ 
                path: `test-screenshots/${hoverScreenshot}`,
                fullPage: true 
              });
              results.screenshots.push(hoverScreenshot);
              
              // Check for tooltip or highlight
              const tooltip = await page.isVisible('[role="tooltip"], .tooltip');
              const highlight = await page.evaluate(() => {
                const elements = document.querySelectorAll('*');
                for (const el of elements) {
                  const styles = getComputedStyle(el);
                  if (styles.boxShadow.includes('ring') || 
                      styles.transform.includes('scale') ||
                      styles.opacity !== '1') {
                    return true;
                  }
                }
                return false;
              });
              
              results.testResults[layout.value].tests.hoverTooltip = tooltip;
              results.testResults[layout.value].tests.hoverEffect = highlight;
              console.log(`    ✅ Hover tooltip: ${tooltip}, Hover effect: ${highlight}`);
              
            } catch (error) {
              console.log(`    ⚠️ Hover test failed: ${error.message}`);
              results.testResults[layout.value].tests.hoverError = error.message;
            }
          }
          
          // TEST 5: Match Visibility
          console.log('  📍 Test 5: Match visibility...');
          
          // Look for highlighted/matched elements
          const matchHighlights = await page.evaluate(() => {
            const highlights = [];
            const allElements = document.querySelectorAll('*');
            
            for (const el of allElements) {
              const styles = getComputedStyle(el);
              
              // Check for match indicators
              if (
                styles.boxShadow.includes('yellow') ||
                styles.boxShadow.includes('cyan') ||
                styles.boxShadow.includes('green') ||
                styles.border.includes('yellow') ||
                styles.border.includes('cyan') ||
                styles.border.includes('green') ||
                styles.border.includes('blue') ||
                styles.backgroundColor.includes('yellow') ||
                el.textContent?.includes('+') ||
                el.className?.includes('animate-pulse')
              ) {
                highlights.push({
                  tagName: el.tagName,
                  className: el.className,
                  text: el.textContent?.substring(0, 20),
                  hasBoxShadow: !!styles.boxShadow,
                  hasBorder: !!styles.border,
                  hasAnimation: el.className?.includes('animate')
                });
              }
            }
            return highlights;
          });
          
          results.testResults[layout.value].tests.matchHighlights = matchHighlights.length;
          results.testResults[layout.value].tests.matchDetails = matchHighlights.slice(0, 5);
          console.log(`    ✅ Match highlights found: ${matchHighlights.length}`);
          
          // Take screenshot focusing on potential matches
          const matchScreenshot = `04-${layout.value}-matches.png`;
          await page.screenshot({ 
            path: `test-screenshots/${matchScreenshot}`,
            fullPage: true 
          });
          results.screenshots.push(matchScreenshot);
          
          // TEST 6: Layout Quality
          console.log('  📍 Test 6: Layout quality...');
          
          // Check for horizontal scroll
          const hasHorizontalScroll = await page.evaluate(() => {
            return document.body.scrollWidth > window.innerWidth;
          });
          
          // Check modal width
          const modalWidth = await page.locator('.fixed.inset-0 > div').first().evaluate(el => {
            return el.getBoundingClientRect().width;
          });
          
          results.testResults[layout.value].tests.hasHorizontalScroll = hasHorizontalScroll;
          results.testResults[layout.value].tests.modalWidth = modalWidth;
          results.testResults[layout.value].tests.layoutGood = !hasHorizontalScroll && modalWidth >= 800;
          
          console.log(`    ✅ No horizontal scroll: ${!hasHorizontalScroll}`);
          console.log(`    ✅ Modal width: ${modalWidth}px`);
          
          // Close modal with Escape key
          await page.keyboard.press('Escape');
          await page.waitForTimeout(1000);
          
          // Verify modal closed
          const escapeClosed = !(await page.isVisible('.fixed.inset-0'));
          results.testResults[layout.value].tests.escapeKeyCloses = escapeClosed;
          console.log(`    ✅ Escape key closes modal: ${escapeClosed}`);
          
        } else {
          console.log('    ❌ Modal did not open - skipping further tests');
        }
        
        console.log(`✅ ${layout.name} testing complete`);
        
      } catch (error) {
        console.error(`❌ Error testing ${layout.name}:`, error.message);
        results.testResults[layout.value].error = error.message;
      }
    }
    
    // Generate summary
    console.log('\n📊 COMPREHENSIVE TEST SUMMARY:');
    console.log('===============================');
    
    for (const [layoutKey, data] of Object.entries(results.testResults)) {
      console.log(`\n${layoutKey.toUpperCase()} - ${data.name}:`);
      console.log('  Basic Functionality:');
      console.log(`    Modal Opens: ${data.tests?.modalOpens ? '✅' : '❌'}`);
      console.log(`    Click Outside Closes: ${data.tests?.clickOutsideToClose ? '✅' : '❌'}`);
      console.log(`    Escape Key Closes: ${data.tests?.escapeKeyCloses ? '✅' : '❌'}`);
      
      console.log('  Visual Design:');
      console.log(`    Sharp Edges: ${data.tests?.hasSharpEdges ? '✅' : '❌'}`);
      console.log(`    Bubble Count ≤10: ${data.tests?.bubbleCountGood ? '✅' : '❌'} (${data.tests?.bubbleCount})`);
      console.log(`    Chip Slots Visible: ${data.tests?.chipSlotsVisible ? '✅' : '❌'} (${data.tests?.chipSlotsCount})`);
      
      console.log('  Interactions:');
      console.log(`    Hover Effects: ${data.tests?.hoverEffect ? '✅' : '❌'}`);
      console.log(`    Match Highlights: ${data.tests?.matchHighlights || 0} found`);
      
      console.log('  Layout Quality:');
      console.log(`    No H-Scroll: ${!data.tests?.hasHorizontalScroll ? '✅' : '❌'}`);
      console.log(`    Good Width: ${data.tests?.modalWidth}px ${data.tests?.modalWidth >= 800 ? '✅' : '❌'}`);
      
      if (data.error) {
        console.log(`  ❌ Error: ${data.error}`);
      }
    }
    
    // Save detailed results
    fs.writeFileSync('modal-test-results.json', JSON.stringify(results, null, 2));
    console.log('\n🎉 All tests completed!');
    console.log(`📸 ${results.screenshots.length} screenshots saved in test-screenshots/ directory`);
    console.log('📋 Detailed results saved in modal-test-results.json');
    
  } catch (error) {
    console.error('💥 Test runner failed:', error);
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
  console.log('\n✨ Modal layout testing complete!');
  console.log('Check modal-test-results.json for detailed analysis');
}).catch(error => {
  console.error('💥 Test execution failed:', error);
});