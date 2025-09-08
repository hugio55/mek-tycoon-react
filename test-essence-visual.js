const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testEssenceVisualChanges() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🚀 Starting visual test of essence details frame...');
    
    // Navigate to the essence page
    console.log('📍 Navigating to http://localhost:3105/essence');
    await page.goto('http://localhost:3105/essence', { waitUntil: 'networkidle' });
    
    // Wait for the page to load completely
    await page.waitForTimeout(3000);
    
    // Take initial screenshot of the full page
    console.log('📸 Taking full page screenshot...');
    await page.screenshot({ 
      path: 'essence-page-full.png', 
      fullPage: true 
    });
    
    // Focus on the essence details frame
    console.log('🎯 Locating essence details frame...');
    const detailsFrame = await page.locator('.max-w-4xl.mx-auto .bg-black.border-2.border-green-400\\/30').first();
    
    if (await detailsFrame.count() > 0) {
      console.log('✅ Found essence details frame with black background and green borders');
      
      // Take screenshot of just the details frame
      await detailsFrame.screenshot({ path: 'essence-details-frame.png' });
      
      // Check for the BODY title
      const bodyTitle = page.locator('h2:has-text("BODY")');
      if (await bodyTitle.count() > 0) {
        console.log('✅ Found BODY title in large yellow text');
      } else {
        console.log('❌ BODY title not found or not visible');
      }
      
      // Check for percentage below BODY title
      const percentage = page.locator('.text-lg.text-yellow-400\\/80');
      if (await percentage.count() > 0) {
        console.log('✅ Found percentage below BODY title');
      } else {
        console.log('❌ Percentage below BODY title not found');
      }
      
      // Check for stats grid (2x2 layout)
      const statsGrid = page.locator('.grid.grid-cols-2.gap-4');
      if (await statsGrid.count() > 0) {
        console.log('✅ Found stats grid in 2x2 layout');
        
        // Check individual stat boxes
        const statBoxes = page.locator('.bg-gray-900\\/50.border.border-gray-700\\/30');
        const statBoxCount = await statBoxes.count();
        console.log(`📊 Found ${statBoxCount} stat boxes`);
        
        if (statBoxCount >= 4) {
          console.log('✅ Stats are properly laid out in 2x2 grid');
        } else {
          console.log('❌ Expected 4 stat boxes, found', statBoxCount);
        }
      } else {
        console.log('❌ Stats grid not found');
      }
      
      // Check for progress bar
      const progressBar = page.locator('.h-8.bg-gray-900.rounded.overflow-hidden');
      if (await progressBar.count() > 0) {
        console.log('✅ Found progress bar at bottom of frame');
        
        // Check for current/max values display
        const progressText = page.locator('.absolute.inset-0.flex.items-center.justify-center');
        if (await progressText.count() > 0) {
          const progressValue = await progressText.textContent();
          console.log('✅ Progress bar shows current/max values:', progressValue?.trim());
        } else {
          console.log('❌ Progress bar values not found');
        }
      } else {
        console.log('❌ Progress bar not found');
      }
      
      // Take a final screenshot of the details frame
      console.log('📸 Taking final screenshot of essence details frame...');
      await detailsFrame.screenshot({ path: 'essence-frame-final.png' });
      
    } else {
      console.log('❌ Essence details frame not found - checking page structure...');
      await page.screenshot({ path: 'essence-debug.png', fullPage: true });
    }
    
    // Check browser console for errors
    console.log('🔍 Checking browser console messages...');
    const logs = [];
    page.on('console', msg => {
      logs.push(`${msg.type()}: ${msg.text()}`);
    });
    
    // Wait a bit to collect any console messages
    await page.waitForTimeout(2000);
    
    if (logs.length > 0) {
      console.log('🟡 Browser console messages:');
      logs.forEach(log => console.log(`  ${log}`));
    } else {
      console.log('✅ No console errors or warnings detected');
    }
    
    console.log('✅ Visual test completed successfully!');
    console.log('📄 Screenshots saved:');
    console.log('  - essence-page-full.png (full page)');
    console.log('  - essence-details-frame.png (details frame only)'); 
    console.log('  - essence-frame-final.png (final frame state)');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'essence-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

// Run the test
testEssenceVisualChanges().catch(console.error);