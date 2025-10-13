const { chromium } = require('playwright');
const path = require('path');

(async () => {
  console.log('Starting visual verification...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Capture console messages
  const consoleMessages = [];
  const errors = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push({ type: msg.type(), text });
    console.log(`[Console ${msg.type()}] ${text}`);
  });

  page.on('pageerror', error => {
    errors.push(error.message);
    console.error(`[Page Error] ${error.message}`);
  });

  try {
    console.log('\n1. Navigating to story-climb page...');
    await page.goto('http://localhost:3100/scrap-yard/story-climb', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.waitForTimeout(2000);

    console.log('\n2. Looking for StoryMissionCard with NFT unlock section...');

    // Check if any cards with NFT sections exist
    const nftSections = await page.locator('text=Cardano Fee').count();
    console.log(`   Found ${nftSections} NFT unlock section(s)`);

    if (nftSections > 0) {
      console.log('\n3. Checking first NFT unlock section layout...');

      // Find the card header variation section
      const cardHeaderSection = page.locator('text=Cardano Fee').first();
      const cardContainer = cardHeaderSection.locator('xpath=ancestor::div[contains(@class, "bg-gradient-to-br")]').first();

      // Take screenshot of the full NFT section
      const screenshotPath = path.join(__dirname, 'nft-unlock-section-v2-3.png');
      await cardContainer.screenshot({ path: screenshotPath });
      console.log(`   Screenshot saved to: ${screenshotPath}`);

      // Verify elements exist
      const hasHeader = await cardHeaderSection.isVisible();
      console.log(`   ✓ Header "Cardano Fee": ${hasHeader ? 'VISIBLE' : 'NOT FOUND'}`);

      const remainingText = await page.locator('text=Remaining:').first().isVisible().catch(() => false);
      console.log(`   ✓ "Remaining" count: ${remainingText ? 'VISIBLE' : 'NOT FOUND'}`);

      const discountBox = await page.locator('text=Overshoot Discount:').first().isVisible().catch(() => false);
      console.log(`   ✓ "Overshoot Discount" box: ${discountBox ? 'VISIBLE' : 'NOT FOUND (may be 0% discount)'}`);

      // Check for price comparison
      const priceElements = await page.locator('text=/Original|Discounted/i').count();
      console.log(`   ✓ Price comparison elements: ${priceElements > 0 ? 'FOUND' : 'NOT FOUND'}`);

      // Take full page screenshot
      const fullPagePath = path.join(__dirname, 'story-climb-full-page.png');
      await page.screenshot({ path: fullPagePath, fullPage: true });
      console.log(`\n   Full page screenshot: ${fullPagePath}`);

    } else {
      console.log('   ⚠ No NFT unlock sections found on page');
      console.log('   This might mean no missions have NFT requirements, or the page needs scrolling');

      // Try scrolling to find more content
      await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(1000);

      const afterScroll = await page.locator('text=Cardano Fee').count();
      console.log(`   After scrolling: Found ${afterScroll} NFT section(s)`);
    }

    console.log('\n4. Console output summary:');
    const errorMessages = consoleMessages.filter(m => m.type === 'error');
    const warningMessages = consoleMessages.filter(m => m.type === 'warning');

    console.log(`   Errors: ${errorMessages.length}`);
    console.log(`   Warnings: ${warningMessages.length}`);
    console.log(`   Page Errors: ${errors.length}`);

    if (errorMessages.length > 0) {
      console.log('\n   Console Errors:');
      errorMessages.forEach(msg => console.log(`   - ${msg.text}`));
    }

    if (errors.length > 0) {
      console.log('\n   Page Errors:');
      errors.forEach(err => console.log(`   - ${err}`));
    }

    console.log('\n✅ Visual verification complete!');
    console.log('   Browser will stay open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('\n❌ Error during verification:', error.message);
    await page.screenshot({ path: path.join(__dirname, 'error-screenshot.png') });
  } finally {
    await browser.close();
  }
})();
