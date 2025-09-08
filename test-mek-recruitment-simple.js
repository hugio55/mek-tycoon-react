const { chromium } = require('playwright');
const fs = require('fs');

async function testMekRecruitmentFixes() {
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--window-size=1920,1080']
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  try {
    console.log('Navigating to contracts page...');
    await page.goto('http://localhost:3100/contracts/single-missions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'test-screenshots/test1-initial.png',
      fullPage: true 
    });
    console.log('✓ Initial page screenshot taken');

    // TEST 1: Mek Slot Image Display
    console.log('\n=== TEST 1: Mek Slot Image Display ===');
    
    // Find and click an empty slot
    const emptySlot = await page.locator('.mek-slot > div').filter({ hasNot: page.locator('img') }).first();
    await emptySlot.click();
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: 'test-screenshots/test1-modal-open.png',
      fullPage: true 
    });
    console.log('✓ Modal opened');
    
    // Click a mek to recruit it
    const mekToRecruit = await page.locator('.grid img[alt*="Mek"]').first();
    await mekToRecruit.click({ force: true });
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: 'test-screenshots/test1-mek-recruited.png',
      fullPage: true 
    });
    console.log('✓ Mek recruited');
    
    // Check if mek image fills the slot properly
    const filledSlots = await page.locator('.mek-slot img').all();
    if (filledSlots.length > 0) {
      const firstFilledSlot = filledSlots[0];
      const bounds = await firstFilledSlot.boundingBox();
      
      results.tests.push({
        test: 'Mek Image Fills Slot',
        passed: bounds && bounds.height >= 80,
        details: `Image height: ${bounds?.height || 0}px (should be >= 80px for full slot)`
      });
      
      // Check that no mek number is displayed on the slot
      const slotParent = await firstFilledSlot.evaluateHandle(el => el.parentElement);
      const hasNumber = await slotParent.evaluate(el => el.textContent.match(/Mek #\d+/));
      
      results.tests.push({
        test: 'No Mek Number on Slot',
        passed: !hasNumber,
        details: hasNumber ? 'Mek number found (should not be displayed)' : 'No mek number (correct)'
      });
    }

    // TEST 2: Tooltip Positioning
    console.log('\n=== TEST 2: Tooltip Positioning ===');
    
    // Click on filled slots to test tooltips
    const filledSlot = await page.locator('.mek-slot').filter({ has: page.locator('img') }).first();
    await filledSlot.click();
    await page.waitForTimeout(1000);
    
    // Check if tooltip appears
    const tooltip = await page.locator('.absolute').filter({ hasText: /Head:|Body:|Trait:/ }).first();
    const tooltipVisible = await tooltip.isVisible().catch(() => false);
    
    if (tooltipVisible) {
      const tooltipBounds = await tooltip.boundingBox();
      const viewportSize = page.viewportSize();
      
      const isWithinBounds = tooltipBounds && 
        tooltipBounds.x >= 0 && 
        tooltipBounds.y >= 0 &&
        (tooltipBounds.x + tooltipBounds.width) <= viewportSize.width &&
        (tooltipBounds.y + tooltipBounds.height) <= viewportSize.height;
      
      results.tests.push({
        test: 'Tooltip Within Screen Bounds',
        passed: isWithinBounds,
        details: tooltipBounds ? 
          `Position: ${Math.round(tooltipBounds.x)},${Math.round(tooltipBounds.y)} (within viewport: ${isWithinBounds})` :
          'Tooltip not found'
      });
      
      await page.screenshot({ 
        path: 'test-screenshots/test2-tooltip.png',
        fullPage: false 
      });
      console.log('✓ Tooltip screenshot taken');
    } else {
      results.tests.push({
        test: 'Tooltip Appears',
        passed: false,
        details: 'Tooltip did not appear when clicking filled slot'
      });
    }
    
    // Click away to hide tooltip
    await page.click('body', { position: { x: 10, y: 10 } });
    await page.waitForTimeout(500);

    // TEST 3: Visual Checks in Modal
    console.log('\n=== TEST 3: Visual Checks in Modal ===');
    
    // Open modal again
    const emptySlot2 = await page.locator('.mek-slot > div').filter({ hasNot: page.locator('img') }).first();
    if (await emptySlot2.count() > 0) {
      await emptySlot2.click();
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: 'test-screenshots/test3-modal-visual.png',
        fullPage: true 
      });
      console.log('✓ Modal visual screenshot taken');
      
      // Check for trait bubbles
      const traitBubbles = await page.locator('.rounded-full').filter({ has: page.locator('img[alt*="variation"]') }).count();
      results.tests.push({
        test: 'Trait Bubbles Visible',
        passed: traitBubbles > 0,
        details: `Found ${traitBubbles} trait bubbles in modal`
      });
      
      // Hover over a mek to see matching highlights
      const mekInModal = await page.locator('.grid img[alt*="Mek"]').first();
      await mekInModal.hover();
      await page.waitForTimeout(1000);
      
      await page.screenshot({ 
        path: 'test-screenshots/test3-hover-effects.png',
        fullPage: true 
      });
      console.log('✓ Hover effects screenshot taken');
      
      // Check progress bar
      const progressBar = await page.locator('.h-6.rounded-full').first();
      const progressBarVisible = await progressBar.isVisible().catch(() => false);
      
      results.tests.push({
        test: 'Progress Bar Visible',
        passed: progressBarVisible,
        details: progressBarVisible ? 'Progress bar is visible in modal' : 'Progress bar not found'
      });
      
      // Check for green preview on hover
      const greenPreview = await page.locator('.bg-green-500').count();
      results.tests.push({
        test: 'Green Progress Preview on Hover',
        passed: greenPreview > 0,
        details: greenPreview > 0 ? 'Green preview shows on hover' : 'No green preview visible'
      });
    }

    // Final screenshot
    await page.screenshot({ 
      path: 'test-screenshots/test-final.png',
      fullPage: true 
    });
    console.log('✓ Final screenshot taken');

  } catch (error) {
    console.error('Error during testing:', error.message);
    results.error = error.message;
  } finally {
    // Save results
    fs.writeFileSync(
      'mek-recruitment-results.json',
      JSON.stringify(results, null, 2)
    );
    
    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('TEST RESULTS SUMMARY');
    console.log('='.repeat(50));
    
    const passed = results.tests.filter(t => t.passed).length;
    const failed = results.tests.filter(t => !t.passed).length;
    
    console.log(`\nTotal Tests: ${results.tests.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${Math.round((passed / results.tests.length) * 100)}%`);
    
    console.log('\n' + '='.repeat(50));
    console.log('DETAILED RESULTS:');
    console.log('='.repeat(50));
    
    results.tests.forEach(test => {
      const status = test.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`\n${status}: ${test.test}`);
      console.log(`   Details: ${test.details}`);
    });
    
    console.log('\n' + '='.repeat(50));
    console.log('Screenshots saved in test-screenshots/ directory');
    console.log('Results saved to mek-recruitment-results.json');
    console.log('='.repeat(50));
    
    await browser.close();
  }
}

testMekRecruitmentFixes().catch(console.error);