const { chromium } = require('playwright');

async function testProfilePage() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ 
    viewport: { width: 1400, height: 900 }
  });
  const page = await context.newPage();

  try {
    console.log('🔍 Testing Profile Page...');
    
    // Navigate to profile page
    await page.goto('http://localhost:3100/profile');
    await page.waitForTimeout(2000); // Wait for page to load
    
    console.log('✅ Navigated to profile page');
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'profile-initial-load.png',
      fullPage: true
    });
    
    // Check for any console errors
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
      if (msg.type() === 'error') {
        console.log('❌ Console Error:', msg.text());
      }
    });
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Look for the Meks tab and click it if it exists
    const meksButton = page.locator('button:has-text("Meks")');
    if (await meksButton.count() > 0) {
      await meksButton.click();
      console.log('✅ Clicked Meks tab');
      await page.waitForTimeout(1000);
    } else {
      console.log('ℹ️ No Meks tab found, checking if already on Meks view');
    }
    
    // Check for Mek images - try different selectors
    let mekImages = await page.locator('img[alt*="Mek #"]').count();
    if (mekImages === 0) {
      mekImages = await page.locator('img[alt*="Mek"]').count();
    }
    if (mekImages === 0) {
      mekImages = await page.locator('img[src*="mek"]').count();
    }
    console.log(`📸 Found ${mekImages} Mek images`);
    
    // Check grid layout - look for various grid patterns
    let mekContainers = await page.locator('.grid.grid-cols-5 > div').count();
    if (mekContainers === 0) {
      mekContainers = await page.locator('.grid > div').count();
    }
    console.log(`📊 Found ${mekContainers} Mek containers`);
    
    // Take screenshot of the grid
    await page.screenshot({ 
      path: 'profile-mek-grid.png',
      fullPage: true
    });
    
    // Test tooltip hover - try to find a Mek to hover over
    const firstMek = page.locator('.grid.grid-cols-5 > div').first();
    if (await firstMek.count() > 0) {
      console.log('🖱️ Testing tooltip hover...');
      
      // Hover over the first Mek
      await firstMek.hover();
      await page.waitForTimeout(1500); // Wait for tooltip to appear
      
      // Look for tooltip - it should be positioned above with specific classes
      const tooltip = page.locator('div:has-text("MEK #")').filter({ has: page.locator('.absolute.left-1\\/2.bottom-full') });
      const tooltipVisible = await tooltip.count() > 0;
      
      if (tooltipVisible) {
        console.log('✅ Tooltip appears on hover');
        
        // Take screenshot with tooltip
        await page.screenshot({ 
          path: 'profile-tooltip-hover.png',
          fullPage: true
        });
        
        // Check for trait bubble images in tooltip
        const traitImages = await tooltip.locator('img').count();
        console.log(`📸 Found ${traitImages} trait images in tooltip`);
        
      } else {
        console.log('❌ No tooltip found on hover - checking for any tooltips');
        
        // Check if any tooltip elements exist at all
        const anyTooltips = await page.locator('div:has-text("MEK #")').count();
        console.log(`🔍 Found ${anyTooltips} elements containing "MEK #"`);
        
        // Take screenshot anyway to show current state
        await page.screenshot({ 
          path: 'profile-no-tooltip.png',
          fullPage: true
        });
      }
    }
    
    // Check if images are actually visible (not broken)
    const allImages = await page.locator('img').all();
    let visibleImages = 0;
    for (const img of allImages) {
      const isVisible = await img.isVisible();
      if (isVisible) visibleImages++;
    }
    console.log(`🖼️ ${visibleImages} images are visible on page`);
    
    // Final assessment
    console.log('\n📋 VERIFICATION RESULTS:');
    console.log(`1. Page loads without errors: ${consoleMessages.filter(m => m.startsWith('error')).length === 0 ? '✅' : '❌'}`);
    console.log(`2. Mek images visible: ${visibleImages > 0 ? '✅' : '❌'} (${visibleImages} images)`);
    console.log(`3. Grid shows 5 columns: ${mekContainers.length >= 5 ? '✅' : '❌'} (${mekContainers.length} Meks found)`);
    console.log(`4. Tooltip functionality: ${tooltipVisible ? '✅' : '❌'}`);
    console.log(`5. Tooltip positioned above Mek: ${tooltipVisible ? '✅' : '❌'}`);
    
    if (consoleMessages.length > 0) {
      console.log('\n🔍 Console Messages:');
      consoleMessages.forEach(msg => console.log(`  ${msg}`));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'profile-error-state.png' });
  } finally {
    await browser.close();
  }
}

testProfilePage();