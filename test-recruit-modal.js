const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Set viewport
  await page.setViewportSize({ width: 1400, height: 900 });
  
  // Navigate to the contracts page
  await page.goto('http://localhost:3100/contracts/single-missions');
  
  console.log('✓ Navigated to contracts page');
  
  // Wait for page to load
  await page.waitForTimeout(3000);
  
  // Collect console logs
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`);
  });
  
  // Look specifically for RECRUIT buttons
  console.log('Looking for RECRUIT buttons...');
  const recruitButtons = await page.locator('button:has-text("RECRUIT")').count();
  console.log(`Found ${recruitButtons} RECRUIT buttons`);
  
  if (recruitButtons > 0) {
    // Click the first RECRUIT button
    console.log('Clicking first RECRUIT button...');
    await page.locator('button:has-text("RECRUIT")').first().click();
    
    // Wait for modal to appear
    await page.waitForTimeout(2000);
    
    // Check if modal opened by looking for common modal indicators
    const modalSelectors = [
      '[role="dialog"]',
      '.modal',
      '[class*="fixed"][class*="z-"]',
      '[class*="backdrop"]',
      'div:has-text("Variations")',
      '[class*="overlay"]'
    ];
    
    let modalFound = false;
    let modalElement = null;
    
    for (const selector of modalSelectors) {
      const elements = await page.locator(selector).count();
      if (elements > 0) {
        modalElement = page.locator(selector).first();
        modalFound = true;
        console.log(`✓ Modal found using selector: ${selector}`);
        break;
      }
    }
    
    if (modalFound) {
      // Take screenshot of modal with default state
      await page.screenshot({ path: 'modal-default-state.png', fullPage: false });
      console.log('✓ Modal screenshot (default state) taken');
      
      // Look for variation count dropdown
      const dropdownSelectors = [
        'select:has(option:text("10"))',
        'select:has(option:text("5"))',
        'button:has-text("10")',
        'button:has-text("Variations")',
        '[role="combobox"]'
      ];
      
      let dropdownFound = false;
      for (const selector of dropdownSelectors) {
        const elements = await page.locator(selector).count();
        if (elements > 0) {
          console.log(`✓ Dropdown found using: ${selector}`);
          
          // Try to change to 5 variations
          try {
            await page.locator(selector).first().click();
            await page.waitForTimeout(500);
            
            // Look for 5 variations option
            const fiveOption = page.locator('option:has-text("5"), [value="5"], button:has-text("5")');
            const fiveCount = await fiveOption.count();
            
            if (fiveCount > 0) {
              await fiveOption.first().click();
              await page.waitForTimeout(1500);
              
              console.log('✓ Changed to 5 variations');
              await page.screenshot({ path: 'modal-5-variations.png' });
              console.log('✓ Modal screenshot (5 variations) taken');
              dropdownFound = true;
            }
          } catch (error) {
            console.log(`Error interacting with dropdown: ${error.message}`);
          }
          
          break;
        }
      }
      
      if (!dropdownFound) {
        console.log('⚠ Variation count dropdown not found');
      }
      
      // Look for pulsating elements
      const pulsatingSelectors = [
        '[class*="pulse"]',
        '[class*="animate-pulse"]',
        '[style*="animation"]',
        '[class*="glow"]',
        '[class*="ping"]'
      ];
      
      let pulsatingCount = 0;
      for (const selector of pulsatingSelectors) {
        const count = await page.locator(selector).count();
        pulsatingCount += count;
      }
      console.log(`Found ${pulsatingCount} elements with pulsating/animation classes`);
      
      // Check for percentage indicators (should be removed)
      const percentageElements = await page.locator('text=/%/').count();
      console.log(`Found ${percentageElements} percentage indicators (should be 0)`);
      
      // Check modal width by getting computed styles
      try {
        const modalWidth = await modalElement.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            width: styles.width,
            maxWidth: styles.maxWidth,
            className: el.className
          };
        });
        console.log(`Modal dimensions:`, modalWidth);
      } catch (error) {
        console.log('Could not get modal dimensions');
      }
      
      // Take final comprehensive screenshot
      await page.screenshot({ path: 'modal-final-verification.png', fullPage: true });
      console.log('✓ Final verification screenshot taken');
      
      // Try clicking a variation bubble to test filtering
      const variationBubbles = page.locator('[class*="bubble"], [class*="circle"], button[class*="rounded-full"]');
      const bubbleCount = await variationBubbles.count();
      console.log(`Found ${bubbleCount} potential variation bubbles`);
      
      if (bubbleCount > 0) {
        try {
          await variationBubbles.first().click();
          await page.waitForTimeout(1000);
          console.log('✓ Clicked variation bubble');
          await page.screenshot({ path: 'modal-bubble-clicked.png' });
        } catch (error) {
          console.log(`Error clicking bubble: ${error.message}`);
        }
      }
      
    } else {
      console.log('❌ Modal not found after clicking RECRUIT button');
      await page.screenshot({ path: 'page-after-recruit-click.png' });
    }
    
  } else {
    console.log('❌ No RECRUIT buttons found');
  }
  
  // Print console messages
  console.log('\n=== Browser Console Messages ===');
  consoleMessages.forEach(msg => console.log(msg));
  
  await page.waitForTimeout(2000);
  await browser.close();
  console.log('✓ Test completed');
})();