const { chromium } = require('playwright');

async function testUniChipsPage() {
  console.log('Starting uni-chips page visual test...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // Navigate to uni-chips page
    console.log('1. Navigating to uni-chips page...');
    await page.goto('http://localhost:3100/uni-chips', { waitUntil: 'networkidle' });
    
    // Take initial screenshot
    console.log('2. Taking initial screenshot...');
    await page.screenshot({ path: 'uni-chips-initial.png', fullPage: true });
    
    // Check page title and header
    console.log('3. Checking page structure...');
    const title = await page.textContent('h1, [class*="title"], [class*="header"]').catch(() => null);
    console.log(`   Page title/header: ${title || 'Not found'}`);
    
    // Check chip display
    console.log('4. Testing chip display...');
    
    // Count total chips
    const chipElements = await page.locator('[class*="chip"], [data-testid*="chip"], img[src*="chip"]').count();
    console.log(`   Total chips found: ${chipElements}`);
    
    // Check for grid layout
    const gridContainer = await page.locator('[class*="grid"], [style*="grid"], [class*="chip-container"]').first();
    if (await gridContainer.count() > 0) {
      console.log('   ✓ Grid container found');
      const gridStyles = await gridContainer.evaluate(el => window.getComputedStyle(el).display);
      console.log(`   Grid display: ${gridStyles}`);
    }
    
    // Check for locked/unlocked states
    const unlockedChips = await page.locator('[class*="unlocked"], [data-unlocked="true"], :not([class*="locked"]):not([class*="disabled"])').count();
    const lockedChips = await page.locator('[class*="locked"], [class*="disabled"], [data-locked="true"]').count();
    console.log(`   Unlocked chips: ${unlockedChips}`);
    console.log(`   Locked chips: ${lockedChips}`);
    
    // Test hover effects on chips
    console.log('5. Testing chip interactions...');
    const firstChip = page.locator('[class*="chip"], img[src*="chip"]').first();
    if (await firstChip.count() > 0) {
      await firstChip.hover();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'uni-chips-hover.png', fullPage: true });
      console.log('   ✓ Hover test completed');
    }
    
    // Check recipe cards
    console.log('6. Testing recipe cards...');
    const recipeCards = await page.locator('[class*="recipe"], [class*="card"], [data-testid*="recipe"]').count();
    console.log(`   Recipe cards found: ${recipeCards}`);
    
    // Check for craft buttons
    const craftButtons = await page.locator('button:has-text("craft"), button[class*="craft"], [data-testid*="craft"]').count();
    console.log(`   Craft buttons found: ${craftButtons}`);
    
    // Check for progress bars
    const progressBars = await page.locator('[class*="progress"], [role="progressbar"], .progress-bar').count();
    console.log(`   Progress bars found: ${progressBars}`);
    
    // Check console for errors
    console.log('7. Checking console messages...');
    const logs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(`ERROR: ${msg.text()}`);
      } else if (msg.type() === 'warning') {
        logs.push(`WARNING: ${msg.text()}`);
      }
    });
    
    await page.waitForTimeout(2000); // Wait for any delayed console messages
    
    if (logs.length > 0) {
      console.log('   Console messages:');
      logs.forEach(log => console.log(`     ${log}`));
    } else {
      console.log('   ✓ No console errors or warnings');
    }
    
    // Check visual aesthetics
    console.log('8. Checking visual aesthetics...');
    
    // Check for yellow/gold colors
    const yellowElements = await page.locator('[class*="yellow"], [class*="gold"], [style*="yellow"], [style*="gold"]').count();
    console.log(`   Elements with yellow/gold styling: ${yellowElements}`);
    
    // Check for industrial styling classes
    const industrialElements = await page.locator('[class*="industrial"], [class*="sci-fi"], [class*="mek-"]').count();
    console.log(`   Elements with industrial styling: ${industrialElements}`);
    
    // Take final screenshot
    console.log('9. Taking final screenshot...');
    await page.screenshot({ path: 'uni-chips-final.png', fullPage: true });
    
    console.log('\n✓ Uni-chips page test completed successfully!');
    console.log('Screenshots saved: uni-chips-initial.png, uni-chips-hover.png, uni-chips-final.png');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  } finally {
    await browser.close();
  }
}

testUniChipsPage();