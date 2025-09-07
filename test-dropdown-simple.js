const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto('http://localhost:3100/contracts/single-missions');
  
  console.log('✓ Navigated to contracts page');
  await page.waitForTimeout(3000);
  
  // Collect console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`);
  });
  
  // Click mek slot to open modal
  console.log('Clicking mek slot...');
  await page.locator('[class*="mek-slot"]').first().click();
  await page.waitForTimeout(2000);
  
  // Take screenshot of current state
  await page.screenshot({ path: 'modal-current-state.png' });
  console.log('✓ Current modal state captured');
  
  // Try to change dropdown with force click
  try {
    console.log('Attempting to click variations dropdown...');
    
    // Try clicking the dropdown with force
    await page.locator('select').first().click({ force: true });
    await page.waitForTimeout(500);
    
    // Look for 10 variations option and click it
    const options = await page.locator('option').all();
    console.log(`Found ${options.length} dropdown options`);
    
    for (let i = 0; i < options.length; i++) {
      const text = await options[i].textContent();
      console.log(`Option ${i}: ${text}`);
      
      if (text && text.includes('10')) {
        console.log('Clicking 10 variations option...');
        await options[i].click();
        await page.waitForTimeout(1500);
        break;
      }
    }
    
    await page.screenshot({ path: 'modal-after-dropdown.png' });
    console.log('✓ Screenshot after dropdown change');
    
  } catch (error) {
    console.log(`Dropdown interaction failed: ${error.message}`);
  }
  
  // Test clicking variation bubble
  try {
    console.log('Attempting to click variation bubble...');
    const bubbles = page.locator('[class*="variation"], [class*="trait"], button[class*="rounded-full"]');
    const bubbleCount = await bubbles.count();
    console.log(`Found ${bubbleCount} potential bubbles`);
    
    if (bubbleCount > 0) {
      // Click the second bubble (KEVLAR) if available
      await bubbles.nth(2).click({ force: true });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'modal-bubble-filter.png' });
      console.log('✓ Variation bubble clicked and screenshot taken');
    }
  } catch (error) {
    console.log(`Bubble click failed: ${error.message}`);
  }
  
  // Check for console errors
  console.log('\n=== Browser Console Messages ===');
  consoleMessages.forEach(msg => console.log(msg));
  
  // Get final statistics
  const percentageCount = await page.locator('text=/%/').count();
  const pulsatingCount = await page.locator('[class*="pulse"], [class*="animate"]').count();
  
  console.log(`\n=== Modal Statistics ===`);
  console.log(`Percentage indicators found: ${percentageCount} (should be 0)`);
  console.log(`Pulsating elements found: ${pulsatingCount}`);
  
  await page.waitForTimeout(2000);
  await browser.close();
  console.log('✓ Test completed');
})();