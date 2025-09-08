const puppeteer = require('puppeteer');
const fs = require('fs');

async function testProfileTooltip() {
  let browser;
  try {
    console.log('Launching browser...');
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1440, height: 900 }
    });
    
    const page = await browser.newPage();
    console.log('Navigating to profile page...');
    await page.goto('http://localhost:3100/profile', { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });

    // Take initial screenshot
    console.log('Taking initial screenshot...');
    await page.screenshot({ path: 'profile-initial.png', fullPage: true });

    // Wait for page to load and look for Mek cards
    console.log('Waiting for Mek cards to load...');
    await page.waitForSelector('[class*="mek-card"]', { timeout: 10000 });

    // Find all Mek cards
    const mekCards = await page.$$('[class*="mek-card"]');
    console.log(`Found ${mekCards.length} Mek cards`);

    if (mekCards.length > 0) {
      // Test hovering over the first Mek card
      console.log('Hovering over first Mek card...');
      await mekCards[0].hover();
      
      // Wait a moment for tooltip to appear
      await page.waitForTimeout(1000);
      
      // Take screenshot with tooltip
      console.log('Taking screenshot with tooltip...');
      await page.screenshot({ path: 'profile-tooltip-hover.png', fullPage: true });

      // Check if tooltip is visible
      const tooltip = await page.$('[class*="tooltip"], [role="tooltip"], .absolute.z-50');
      if (tooltip) {
        console.log('✅ Tooltip found!');
        
        // Get tooltip content
        const tooltipContent = await tooltip.evaluate(el => el.textContent);
        console.log('Tooltip content:', tooltipContent);
        
        // Check for expected elements
        const hasNumber = tooltipContent.includes('#') || /\d+/.test(tooltipContent);
        const hasLevel = tooltipContent.toLowerCase().includes('level');
        const hasGoldHr = tooltipContent.toLowerCase().includes('gold') && tooltipContent.toLowerCase().includes('hr');
        const hasClickInfo = tooltipContent.toLowerCase().includes('click');
        
        console.log('Content analysis:');
        console.log('- Has Mek number:', hasNumber);
        console.log('- Has Level info:', hasLevel);
        console.log('- Has Gold/Hr info:', hasGoldHr);
        console.log('- Has "Click for more info":', hasClickInfo);
        
        // Check for trait bubble images
        const traitBubbles = await tooltip.$$('img, .w-8.h-8.rounded-full, [class*="trait"], [class*="bubble"]');
        console.log('- Trait bubbles found:', traitBubbles.length);
        
      } else {
        console.log('❌ No tooltip found');
        
        // Check if there are any hover effects at all
        const hoverElements = await page.$$('.hover\\:visible, .group:hover, [class*="hover"]');
        console.log(`Found ${hoverElements.length} elements with hover effects`);
      }

      // Move mouse away and take another screenshot
      await page.mouse.move(100, 100);
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'profile-tooltip-after-hover.png', fullPage: true });
    }

    // Check console for any errors
    const logs = await page.evaluate(() => {
      return window.console ? console.log.toString() : 'No console available';
    });

    console.log('Test completed successfully');
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testProfileTooltip();