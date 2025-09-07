const { chromium } = require('playwright');

async function takeScreenshot() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to http://localhost:3101/talent-builder');
    await page.goto('http://localhost:3101/talent-builder');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ path: 'talent-builder-screenshot.png', fullPage: true });
    console.log('Screenshot saved as talent-builder-screenshot.png');
    
    // Check console messages
    const logs = [];
    page.on('console', msg => logs.push(msg.text()));
    
    // Wait a bit more for any console messages
    await page.waitForTimeout(2000);
    
    if (logs.length > 0) {
      console.log('Console messages:');
      logs.forEach(log => console.log('  ', log));
    } else {
      console.log('No console messages found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

takeScreenshot();