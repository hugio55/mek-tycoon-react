const puppeteer = require('puppeteer');

async function checkStoryClimbPage() {
  try {
    console.log("Starting browser...");
    const browser = await puppeteer.launch({ 
      headless: false,
      slowMo: 50,
      args: ['--disable-web-security', '--no-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set up console logging
    page.on('console', (msg) => {
      console.log('PAGE LOG:', msg.type().toUpperCase(), msg.text());
    });
    
    page.on('pageerror', (error) => {
      console.log('PAGE ERROR:', error.message);
    });
    
    page.on('response', (response) => {
      if (!response.ok()) {
        console.log('FAILED REQUEST:', response.status(), response.url());
      }
    });
    
    console.log("Navigating to story-climb page...");
    const response = await page.goto('http://localhost:3100/scrap-yard/story-climb', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    console.log("Page status:", response.status());
    console.log("Page URL:", page.url());
    
    // Take screenshot
    await page.screenshot({ 
      path: 'story-climb-debug.png',
      fullPage: true 
    });
    console.log("Screenshot saved as story-climb-debug.png");
    
    // Wait for React to load and check for errors
    await page.waitForTimeout(5000);
    
    // Get page content
    const content = await page.content();
    console.log("Page has content length:", content.length);
    
    // Check if it's a 404 page
    const is404 = content.includes('404') || content.includes('Not Found');
    console.log("Is 404 page:", is404);
    
    // Look for specific elements
    const hasCanvas = await page.$('canvas') !== null;
    const hasStoryTree = await page.$eval('body', el => el.textContent.includes('STORY MODE'));
    
    console.log("Has canvas element:", hasCanvas);
    console.log("Has story mode text:", hasStoryTree);
    
    // Check console errors
    const logs = [];
    page.on('console', (msg) => logs.push(msg));
    await page.waitForTimeout(2000);
    
    console.log("Browser console messages:", logs.length);
    
    await browser.close();
  } catch (error) {
    console.error("Error:", error.message);
  }
}

checkStoryClimbPage();