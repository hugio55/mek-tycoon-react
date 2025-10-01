const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to mek-rate-logging page...');
  await page.goto('http://localhost:3100/mek-rate-logging');

  // Wait for page to load
  await page.waitForTimeout(3000);

  console.log('Taking initial screenshot...');
  await page.screenshot({ path: 'leaderboard-initial.png', fullPage: true });

  // Wait for leaderboard to load
  console.log('Waiting for leaderboard data...');
  await page.waitForTimeout(5000);

  console.log('Taking leaderboard screenshot...');
  await page.screenshot({ path: 'leaderboard-loaded.png', fullPage: true });

  // Check for "Low Mek co" in the leaderboard
  console.log('Searching for "Low Mek co" in leaderboard...');
  const leaderboardText = await page.textContent('body').catch(() => '');

  if (leaderboardText.includes('Low Mek co')) {
    console.log('✓ Found "Low Mek co" in the page');

    // Try to find the specific leaderboard section
    const topCompanies = await page.locator('text=TOP COMPANIES').count();
    console.log(`Found ${topCompanies} "TOP COMPANIES" headers`);
  } else {
    console.log('✗ "Low Mek co" not found in page');
  }

  // Get console logs
  console.log('\n--- Browser Console Messages ---');
  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });

  // Check for errors
  page.on('pageerror', error => {
    console.error(`[PAGE ERROR] ${error.message}`);
  });

  // Wait a bit more to capture any async errors
  await page.waitForTimeout(3000);

  console.log('\nScreenshots saved:');
  console.log('- leaderboard-initial.png');
  console.log('- leaderboard-loaded.png');
  console.log('\nPress Ctrl+C to close browser...');

  // Keep browser open for manual inspection
  await page.waitForTimeout(30000);

  await browser.close();
})();