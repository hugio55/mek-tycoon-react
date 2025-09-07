const { chromium } = require('playwright');

async function takeScreenshot() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  try {
    console.log('Navigating to http://localhost:3102/event-node-rewards');
    await page.goto('http://localhost:3102/event-node-rewards');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for animations
    
    // Take screenshot of event-node-rewards page to check duplicate navigation
    await page.screenshot({ path: 'duplicate-nav-issue.png', fullPage: true });
    console.log('Screenshot saved as duplicate-nav-issue.png');
    
    // Check for navigation components
    const navCount = await page.evaluate(() => {
      const navElements = document.querySelectorAll('nav');
      const logoElements = document.querySelectorAll('img[alt*="Mek Tycoon Logo"]');
      const hubButtons = document.querySelectorAll('a[href="/hub"]');
      
      return {
        navElements: navElements.length,
        logoElements: logoElements.length,
        hubButtons: hubButtons.length,
        totalNavigationComponents: document.querySelectorAll('nav, .navigation, [class*="nav"]').length
      };
    });
    
    console.log('Navigation element counts:', navCount);
    
    // Check console messages
    const logs = [];
    page.on('console', msg => {
      logs.push(`${msg.type()}: ${msg.text()}`);
    });
    
    // Wait for console messages
    await page.waitForTimeout(2000);
    
    if (logs.length > 0) {
      console.log('Console messages:');
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

takeScreenshot();