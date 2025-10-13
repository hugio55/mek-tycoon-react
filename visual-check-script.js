const { chromium } = require('playwright');

(async () => {
  console.log('Starting visual verification...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Monitor console messages
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      console.log(`[CONSOLE ${type.toUpperCase()}]:`, msg.text());
    }
  });

  // Monitor page errors
  page.on('pageerror', exception => {
    console.log('[PAGE ERROR]:', exception.message);
  });

  console.log('Navigating to http://localhost:3100/story-climb...');
  await page.goto('http://localhost:3100/story-climb', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  console.log('Page loaded. Waiting for content to stabilize...');
  await page.waitForTimeout(3000);

  // Take full page screenshot of initial state
  await page.screenshot({
    path: 'screenshots/story-climb-initial.png',
    fullPage: true
  });
  console.log('Saved: screenshots/story-climb-initial.png');

  // Try to find and click a story node to reveal the mission card
  console.log('\nLooking for clickable story nodes...');
  const storyNodes = page.locator('circle[class*="cursor-pointer"], [class*="node"][class*="cursor"]');
  const nodeCount = await storyNodes.count();
  console.log(`Found ${nodeCount} potential story nodes`);

  if (nodeCount > 0) {
    console.log('Clicking first available node...');
    await storyNodes.first().click();
    await page.waitForTimeout(1000);

    // Take screenshot after clicking node
    await page.screenshot({
      path: 'screenshots/story-climb-after-node-click.png',
      fullPage: true
    });
    console.log('Saved: screenshots/story-climb-after-node-click.png');
  } else {
    console.log('No nodes found, page may be empty or using different selectors');
  }

  // Check for key elements
  console.log('\n=== CHECKING FOR EXPECTED ELEMENTS ===');

  const checks = [
    { name: 'Cardano Fee header', selector: 'text=/Cardano Fee/i' },
    { name: 'ADA Fee text', selector: 'text=/ADA Fee/i' },
    { name: 'Remaining text', selector: 'text=/Remaining:/i' },
    { name: 'Overshoot Discount', selector: 'text=/Overshoot Discount/i' },
    { name: 'ADA currency', selector: 'text=/ADA/i' }
  ];

  for (const check of checks) {
    const count = await page.locator(check.selector).count();
    const status = count > 0 ? '✓ FOUND' : '✗ NOT FOUND';
    console.log(`${status} - ${check.name} (${count} instances)`);
  }

  // Find and screenshot pricing sections
  const pricingSections = page.locator('[class*="bg-gradient"]').filter({
    hasText: /ADA|Cardano/i
  });

  const pricingCount = await pricingSections.count();
  console.log(`\nFound ${pricingCount} pricing sections`);

  if (pricingCount > 0) {
    for (let i = 0; i < Math.min(pricingCount, 3); i++) {
      await pricingSections.nth(i).screenshot({
        path: `screenshots/pricing-section-${i + 1}.png`
      });
      console.log(`Saved: screenshots/pricing-section-${i + 1}.png`);
    }
  }

  console.log('\n=== VISUAL VERIFICATION COMPLETE ===');
  console.log('Screenshots saved to ./screenshots/');
  console.log('\nPress Ctrl+C to close the browser or wait 30 seconds...');

  // Keep browser open for 30 seconds for manual inspection
  await page.waitForTimeout(30000);

  await browser.close();
})();
