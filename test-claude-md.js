const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Listen for console messages
  page.on('console', msg => {
    console.log('[BROWSER]', msg.type(), msg.text());
  });

  // Navigate to the page
  await page.goto('http://localhost:3200/admin/claude-md-viewer');

  // Wait a bit for the component to load
  await page.waitForTimeout(3000);

  // Get the text content
  const content = await page.textContent('body');
  console.log('\n=== PAGE TEXT ===');
  console.log(content.substring(0, 500));

  await browser.close();
})();
