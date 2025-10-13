const { chromium } = require('playwright');
const path = require('path');

(async () => {
  console.log('='.repeat(60));
  console.log('VISUAL VERIFICATION: NFT Unlock Section (V2-3 Card Header)');
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Capture console messages and errors
  const consoleMessages = [];
  const errors = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push({ type: msg.type(), text });
    if (msg.type() === 'error') {
      console.log(`  [Console ERROR] ${text}`);
    }
  });

  page.on('pageerror', error => {
    errors.push(error.message);
    console.error(`  [Page ERROR] ${error.message}`);
  });

  try {
    console.log('\n[Step 1] Navigating to story-climb page...');
    await page.goto('http://localhost:3100/scrap-yard/story-climb', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.waitForTimeout(3000); // Extra wait for React rendering
    console.log('  ✓ Page loaded');

    console.log('\n[Step 2] Looking for mission cards with NFT sections...');

    // Check if there's a mission card (event nodes typically have NFT sections)
    const missionCards = await page.locator('[class*="absolute"][class*="rounded"]').count();
    console.log(`  Found ${missionCards} mission card elements`);

    // Look for V2 variation selector (should be in debug panel)
    console.log('\n[Step 3] Searching for V2 Price Card Style selector...');
    const v2StyleButtons = await page.locator('button:has-text("V2-")').count();
    console.log(`  Found ${v2StyleButtons} V2 style selector buttons`);

    if (v2StyleButtons > 0) {
      console.log('\n[Step 4] Clicking V2-3: Header (Card Header Style)...');
      const headerButton = page.locator('button:has-text("V2-3")').first();
      await headerButton.click();
      await page.waitForTimeout(1000); // Wait for UI update
      console.log('  ✓ Clicked V2-3 selector');

      // Take screenshot after clicking
      const afterClickPath = path.join(__dirname, 'nft-v2-3-selected.png');
      await page.screenshot({ path: afterClickPath, fullPage: false });
      console.log(`  Screenshot: ${afterClickPath}`);
    } else {
      console.log('  ⚠ No V2 style selectors found - checking if cards exist...');
    }

    console.log('\n[Step 5] Locating "Cardano Fee" header...');
    const cardanoFeeCount = await page.locator('text=Cardano Fee').count();
    console.log(`  Found ${cardanoFeeCount} "Cardano Fee" header(s)`);

    if (cardanoFeeCount > 0) {
      console.log('\n[Step 6] Analyzing NFT unlock section layout...');

      const cardanoFeeElement = page.locator('text=Cardano Fee').first();
      const nftSection = cardanoFeeElement.locator('xpath=ancestor::div[contains(@class, "bg-gradient-to-br")]').first();

      // Check for all expected elements
      const hasHeader = await cardanoFeeElement.isVisible();
      console.log(`  ✓ Header "Cardano Fee": ${hasHeader ? 'VISIBLE' : 'NOT FOUND'}`);

      const remainingText = await nftSection.locator('text=/Remaining:/i').isVisible().catch(() => false);
      console.log(`  ✓ "Remaining" count: ${remainingText ? 'VISIBLE' : 'NOT FOUND'}`);

      const discountText = await nftSection.locator('text=/Overshoot Discount/i').isVisible().catch(() => false);
      console.log(`  ✓ "Overshoot Discount": ${discountText ? 'VISIBLE' : 'NOT FOUND (or 0%)'}`);

      const originalPrice = await nftSection.locator('text=/Original/i').isVisible().catch(() => false);
      console.log(`  ✓ "Original" price label: ${originalPrice ? 'VISIBLE' : 'NOT FOUND'}`);

      const discountedPrice = await nftSection.locator('text=/Discounted/i').isVisible().catch(() => false);
      console.log(`  ✓ "Discounted" price label: ${discountedPrice ? 'VISIBLE' : 'NOT FOUND'}`);

      // Take focused screenshot of NFT section
      console.log('\n[Step 7] Taking screenshots...');
      const sectionPath = path.join(__dirname, 'nft-unlock-section-v2-3-focused.png');
      await nftSection.screenshot({ path: sectionPath });
      console.log(`  ✓ NFT section screenshot: ${sectionPath}`);

      // Take full page screenshot for context
      const fullPagePath = path.join(__dirname, 'story-climb-full-page-v2-3.png');
      await page.screenshot({ path: fullPagePath, fullPage: true });
      console.log(`  ✓ Full page screenshot: ${fullPagePath}`);

      // Get text content for verification
      const sectionText = await nftSection.textContent();
      console.log('\n[Step 8] Section text content analysis:');
      console.log(`  Contains "Cardano Fee": ${sectionText.includes('Cardano Fee')}`);
      console.log(`  Contains "Remaining": ${sectionText.includes('Remaining')}`);
      console.log(`  Contains "Overshoot": ${sectionText.includes('Overshoot')}`);
      console.log(`  Contains "Original": ${sectionText.includes('Original')}`);
      console.log(`  Contains "Discounted": ${sectionText.includes('Discounted')}`);
      console.log(`  Contains "ADA": ${sectionText.includes('ADA')}`);

    } else {
      console.log('\n  ⚠ No "Cardano Fee" sections found');
      console.log('  This might mean:');
      console.log('    - No missions currently have NFT unlock requirements');
      console.log('    - The V2 variation is not set to style 3 (Card Header)');
      console.log('    - The debug panel needs to be toggled');

      // Try to find any debug panel
      const debugPanel = await page.locator('text=/Debug|V2-|Variation/i').count();
      console.log(`\n  Debug elements found: ${debugPanel}`);

      // Take screenshot for debugging
      const debugPath = path.join(__dirname, 'story-climb-no-nft-debug.png');
      await page.screenshot({ path: debugPath, fullPage: true });
      console.log(`  Debug screenshot: ${debugPath}`);
    }

    console.log('\n[Step 9] Console output summary:');
    const errorMessages = consoleMessages.filter(m => m.type === 'error');
    const warningMessages = consoleMessages.filter(m => m.type === 'warning');

    console.log(`  Total console messages: ${consoleMessages.length}`);
    console.log(`  Errors: ${errorMessages.length}`);
    console.log(`  Warnings: ${warningMessages.length}`);
    console.log(`  Page Errors: ${errors.length}`);

    if (errorMessages.length > 0) {
      console.log('\n  Console Errors (first 5):');
      errorMessages.slice(0, 5).forEach(msg => console.log(`    - ${msg.text}`));
    }

    if (errors.length > 0) {
      console.log('\n  Page Errors:');
      errors.forEach(err => console.log(`    - ${err}`));
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ VERIFICATION COMPLETE');
    console.log('='.repeat(60));
    console.log('Browser will stay open for 15 seconds for manual inspection...\n');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    await page.screenshot({ path: path.join(__dirname, 'verification-error.png') });
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
})();
