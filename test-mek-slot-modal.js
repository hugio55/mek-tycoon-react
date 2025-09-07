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
  
  // Look for mek slots - they could be empty squares, circles, or placeholder elements
  console.log('Looking for mek slots...');
  
  // Various selectors for mek slots
  const mekSlotSelectors = [
    '[class*="mek-slot"]',
    '[class*="empty"]',
    '[class*="slot"]',
    '[class*="rounded-full"][class*="border"]',
    '[class*="w-8"][class*="h-8"]',
    '[class*="w-10"][class*="h-10"]',
    '[class*="w-12"][class*="h-12"]',
    'div[class*="border"][class*="rounded"]',
    'button[class*="rounded"]',
    '.cursor-pointer'
  ];
  
  let slotsFound = false;
  let clickedSlot = false;
  
  for (const selector of mekSlotSelectors) {
    const elements = await page.locator(selector).count();
    if (elements > 0) {
      console.log(`Found ${elements} elements matching: ${selector}`);
      
      // Try clicking the first few elements to find mek slots
      const slots = await page.locator(selector).all();
      for (let i = 0; i < Math.min(3, slots.length); i++) {
        try {
          const element = slots[i];
          
          // Get element info
          const boundingBox = await element.boundingBox();
          if (!boundingBox || boundingBox.width < 20 || boundingBox.height < 20) {
            continue; // Skip very small elements
          }
          
          console.log(`Trying to click element ${i} with selector: ${selector}`);
          await element.click();
          await page.waitForTimeout(1500);
          
          // Check if modal opened
          const modalSelectors = [
            '[class*="MekRecruitmentModal"]',
            '[class*="modal"]',
            '[role="dialog"]',
            '[class*="fixed"][class*="z-"]',
            'div:has-text("Variations")',
            '[class*="backdrop"]',
            '[class*="overlay"]'
          ];
          
          let modalOpened = false;
          for (const modalSelector of modalSelectors) {
            const modalCount = await page.locator(modalSelector).count();
            if (modalCount > 0) {
              console.log(`✓ Modal opened! Found with selector: ${modalSelector}`);
              modalOpened = true;
              slotsFound = true;
              clickedSlot = true;
              break;
            }
          }
          
          if (modalOpened) {
            // Take screenshot of modal with default state
            await page.screenshot({ path: 'modal-v4-default.png' });
            console.log('✓ Modal V4 screenshot (default) taken');
            
            // Look for variation count or display options
            const variationControls = [
              'select',
              'button:has-text("10")',
              'button:has-text("5")', 
              '[role="combobox"]',
              'div:has-text("Variations")',
              'input[type="number"]'
            ];
            
            let foundControl = false;
            for (const control of variationControls) {
              const count = await page.locator(control).count();
              if (count > 0) {
                console.log(`✓ Found variation control: ${control} (${count} elements)`);
                
                try {
                  const controlElement = page.locator(control).first();
                  await controlElement.click();
                  await page.waitForTimeout(500);
                  
                  // Look for 5 variations option
                  const fiveOption = page.locator('option:has-text("5"), button:has-text("5"), [data-value="5"]');
                  const fiveCount = await fiveOption.count();
                  
                  if (fiveCount > 0) {
                    await fiveOption.first().click();
                    await page.waitForTimeout(1500);
                    
                    console.log('✓ Changed to 5 variations');
                    await page.screenshot({ path: 'modal-v4-5variations.png' });
                    console.log('✓ Modal V4 screenshot (5 variations) taken');
                    foundControl = true;
                  }
                } catch (error) {
                  console.log(`Error with control ${control}: ${error.message}`);
                }
                
                if (foundControl) break;
              }
            }
            
            // Check for modal width and positioning
            const modalElement = page.locator('[class*="fixed"], [role="dialog"], [class*="modal"]').first();
            try {
              const styles = await modalElement.evaluate(el => {
                const computed = window.getComputedStyle(el);
                const rect = el.getBoundingClientRect();
                return {
                  width: computed.width,
                  maxWidth: computed.maxWidth,
                  position: computed.position,
                  actualWidth: rect.width,
                  actualHeight: rect.height
                };
              });
              console.log('Modal dimensions:', styles);
            } catch (error) {
              console.log('Could not get modal dimensions');
            }
            
            // Look for pulsating elements
            const pulsatingElements = page.locator('[class*="pulse"], [class*="animate"], [class*="glow"], [style*="animation"]');
            const pulsatingCount = await pulsatingElements.count();
            console.log(`Found ${pulsatingCount} potentially animated elements`);
            
            // Check for percentage text (should be removed)
            const percentageText = await page.locator('text=/%/').count();
            console.log(`Found ${percentageText} percentage indicators (should be 0)`);
            
            // Look for description text positioning
            const descriptions = page.locator('[class*="description"], p, div:has-text("Description")');
            const descCount = await descriptions.count();
            console.log(`Found ${descCount} potential description elements`);
            
            // Check for mini bubbles under meks
            const miniBubbles = page.locator('[class*="mini"], [class*="bubble"], [class*="circle"]:not([class*="large"])');
            const bubbleCount = await miniBubbles.count();
            console.log(`Found ${bubbleCount} potential mini bubbles`);
            
            // Try clicking a variation bubble if any exist
            const variationBubbles = page.locator('[class*="variation"], [class*="trait"], button[class*="rounded-full"]');
            const vBubbleCount = await variationBubbles.count();
            if (vBubbleCount > 0) {
              try {
                console.log(`Trying to click variation bubble (${vBubbleCount} found)`);
                await variationBubbles.first().click();
                await page.waitForTimeout(1000);
                await page.screenshot({ path: 'modal-v4-bubble-clicked.png' });
                console.log('✓ Clicked variation bubble, screenshot taken');
              } catch (error) {
                console.log(`Error clicking variation bubble: ${error.message}`);
              }
            }
            
            // Take final comprehensive screenshot
            await page.screenshot({ path: 'modal-v4-final-state.png' });
            console.log('✓ Final modal state screenshot taken');
            
            break;
          }
          
        } catch (error) {
          console.log(`Error clicking element with ${selector}: ${error.message}`);
        }
        
        if (clickedSlot) break;
      }
      
      if (clickedSlot) break;
    }
  }
  
  if (!slotsFound) {
    console.log('❌ No mek slots found or modal did not open');
    await page.screenshot({ path: 'page-no-modal.png' });
  }
  
  // Print console messages
  console.log('\n=== Browser Console Messages ===');
  consoleMessages.forEach(msg => console.log(msg));
  
  await page.waitForTimeout(2000);
  await browser.close();
  console.log('✓ Test completed');
})();