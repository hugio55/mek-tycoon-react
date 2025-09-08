const { chromium } = require('playwright');

async function testProfileTooltip() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  
  // Set up console logging
  const logs = [];
  page.on('console', msg => {
    logs.push(`${msg.type()}: ${msg.text()}`);
  });
  
  try {
    console.log('Navigating to http://localhost:3100/profile');
    await page.goto('http://localhost:3100/profile');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for data to load
    
    // Take initial screenshot
    await page.screenshot({ path: 'profile-initial.png', fullPage: true });
    console.log('Screenshot saved as profile-initial.png');
    
    // Look specifically for Mek cards in the meks tab
    console.log('Looking for Mek cards...');
    
    // First make sure we're on the Meks tab
    const meksTab = await page.$('button:has-text("Meks")');
    if (meksTab) {
      await meksTab.click();
      await page.waitForTimeout(500);
      console.log('Clicked Meks tab');
    }
    
    // Look for Mek cards using the specific structure from the code
    let mekCards = await page.$$('.relative.group.cursor-pointer');
    console.log(`Found ${mekCards.length} elements with .relative.group.cursor-pointer`);
    
    if (mekCards.length === 0) {
      // Try alternative selectors
      mekCards = await page.$$('.group.cursor-pointer');
      console.log(`Found ${mekCards.length} elements with .group.cursor-pointer`);
    }
    
    if (mekCards.length === 0) {
      // Try any group elements
      mekCards = await page.$$('.group');
      console.log(`Found ${mekCards.length} elements with .group class`);
    }
    
    if (mekCards.length > 0) {
      console.log(`Found ${mekCards.length} potential Mek cards`);
      
      // Get the bounding box of the first card
      const firstCard = mekCards[0];
      const cardBox = await firstCard.boundingBox();
      
      if (cardBox) {
        console.log('Card position:', cardBox);
        
        // Hover over the center of the card
        const centerX = cardBox.x + cardBox.width / 2;
        const centerY = cardBox.y + cardBox.height / 2;
        
        console.log(`Hovering at position (${centerX}, ${centerY})`);
        await page.mouse.move(centerX, centerY);
        await page.waitForTimeout(1500); // Wait for tooltip to appear
        
        // Take screenshot with potential tooltip
        await page.screenshot({ path: 'profile-tooltip-hover.png', fullPage: true });
        console.log('Screenshot saved as profile-tooltip-hover.png');
        
        // Look for the specific Mek tooltip structure
        const tooltipSelectors = [
          '.group-hover\\:opacity-100', // The main tooltip container
          '.opacity-0.group-hover\\:opacity-100', // Alternative selector
          '[class*="opacity-0"][class*="group-hover"]', // Any element with opacity-0 and group-hover
          '.bg-black\\/95.border-2.border-yellow-500\\/50', // The specific tooltip styling
          '[class*="MEK"]' // Look for MEK text
        ];
        
        let tooltipFound = false;
        for (const selector of tooltipSelectors) {
          const tooltip = await page.$(selector);
          if (tooltip) {
            console.log(`✅ Tooltip found with selector: ${selector}`);
            
            // Get tooltip content and styling
            const tooltipInfo = await tooltip.evaluate(el => ({
              content: el.textContent || el.innerText,
              className: el.className,
              style: el.getAttribute('style'),
              visible: window.getComputedStyle(el).visibility !== 'hidden' && 
                      window.getComputedStyle(el).opacity !== '0',
              position: el.getBoundingClientRect()
            }));
            
            console.log('Tooltip info:', tooltipInfo);
            
            if (tooltipInfo.content) {
              console.log('\n--- TOOLTIP CONTENT ANALYSIS ---');
              const content = tooltipInfo.content.toLowerCase();
              
              console.log('✅ Content found:', tooltipInfo.content);
              console.log('- Has Mek number:', /mek|#\d+|\d+/.test(content));
              console.log('- Has Level info:', content.includes('level'));
              console.log('- Has Gold/Hr info:', content.includes('gold') && (content.includes('hr') || content.includes('hour')));
              console.log('- Has Click info:', content.includes('click'));
              console.log('- Tooltip visible:', tooltipInfo.visible);
              
              // Look for trait bubble images within tooltip
              const traitImages = await tooltip.$$('img, [class*="trait"], [class*="bubble"], .rounded-full');
              console.log('- Trait elements found:', traitImages.length);
              
              tooltipFound = true;
            }
            break;
          }
        }
        
        if (!tooltipFound) {
          console.log('❌ No tooltip found with any selector');
          
          // Check if there are any hover effects at all
          const hoverElements = await page.evaluate(() => {
            const elements = document.querySelectorAll('*');
            let hoverCount = 0;
            elements.forEach(el => {
              const styles = window.getComputedStyle(el);
              if (el.className && (el.className.includes('hover') || el.className.includes('group'))) {
                hoverCount++;
              }
            });
            return hoverCount;
          });
          console.log(`Found ${hoverElements} elements with hover-related classes`);
        }
        
        // Move mouse away and take final screenshot
        await page.mouse.move(100, 100);
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'profile-after-hover.png', fullPage: true });
        console.log('Screenshot saved as profile-after-hover.png');
      }
    } else {
      console.log('❌ No Mek cards found on the page');
      
      // Debug: show what elements are on the page
      const pageElements = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*')).slice(0, 20);
        return elements.map(el => ({
          tag: el.tagName,
          classes: el.className,
          text: el.textContent?.substring(0, 50)
        }));
      });
      console.log('Page elements sample:', pageElements);
    }
    
    // Show console messages
    if (logs.length > 0) {
      console.log('\n--- CONSOLE MESSAGES ---');
      logs.forEach(log => console.log('  ', log));
    } else {
      console.log('No console messages detected');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testProfileTooltip();