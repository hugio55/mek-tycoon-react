// Quick script to check console errors
const puppeteer = require('puppeteer');

(async () => {
  let browser;
  try {
    console.log('Launching browser...');
    browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Collect console messages
    const messages = [];
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      messages.push({ type, text });
      console.log(`[${type.toUpperCase()}] ${text}`);
    });

    // Collect page errors
    page.on('pageerror', error => {
      console.log('[PAGE ERROR]', error.message);
      messages.push({ type: 'error', text: error.message });
    });

    // Navigate to the page
    console.log('Navigating to http://localhost:3100/mek-rate-logging...');
    await page.goto('http://localhost:3100/mek-rate-logging', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Wait a bit for React to render
    await page.waitForTimeout(3000);

    // Take a screenshot
    await page.screenshot({ path: 'mek-rate-logging-screenshot.png' });
    console.log('Screenshot saved to mek-rate-logging-screenshot.png');

    // Get the page content
    const content = await page.content();
    console.log('\n=== PAGE CONTENT (first 500 chars) ===');
    console.log(content.substring(0, 500));

    // Print summary
    console.log('\n=== CONSOLE SUMMARY ===');
    const errors = messages.filter(m => m.type === 'error');
    const warnings = messages.filter(m => m.type === 'warning');
    console.log(`Total messages: ${messages.length}`);
    console.log(`Errors: ${errors.length}`);
    console.log(`Warnings: ${warnings.length}`);

    if (errors.length > 0) {
      console.log('\n=== ERRORS ===');
      errors.forEach(e => console.log(e.text));
    }

  } catch (error) {
    console.error('Script error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();