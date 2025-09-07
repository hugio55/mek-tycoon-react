const { chromium } = require('playwright');

async function testHub() {
  let browser;
  try {
    console.log('Starting browser...');
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Collect console messages
    const consoleMessages = [];
    page.on('console', (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        args: msg.args().map(arg => arg.toString())
      });
    });

    // Collect network errors
    const networkErrors = [];
    page.on('response', (response) => {
      if (!response.ok()) {
        networkErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });

    console.log('Navigating to http://localhost:3100/hub...');
    await page.goto('http://localhost:3100/hub', { waitUntil: 'networkidle' });

    // Wait a bit for any async operations
    await page.waitForTimeout(3000);

    console.log('Taking screenshot...');
    await page.screenshot({ path: 'hub-screenshot.png', fullPage: true });

    // Get page content
    const pageTitle = await page.title();
    const bodyText = await page.textContent('body');

    console.log('\n=== PAGE ANALYSIS ===');
    console.log('Page Title:', pageTitle);
    
    console.log('\n=== VISIBLE TEXT (first 500 chars) ===');
    console.log(bodyText.substring(0, 500));

    console.log('\n=== CONSOLE MESSAGES ===');
    if (consoleMessages.length === 0) {
      console.log('No console messages');
    } else {
      consoleMessages.forEach((msg, i) => {
        console.log(`${i + 1}. [${msg.type.toUpperCase()}] ${msg.text}`);
      });
    }

    console.log('\n=== NETWORK ERRORS ===');
    if (networkErrors.length === 0) {
      console.log('No network errors');
    } else {
      networkErrors.forEach((error, i) => {
        console.log(`${i + 1}. ${error.status} ${error.statusText}: ${error.url}`);
      });
    }

    console.log('\n=== SCREENSHOT ===');
    console.log('Screenshot saved as hub-screenshot.png');

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testHub();