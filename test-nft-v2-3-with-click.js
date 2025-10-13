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

  const errors = [];
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
    await page.waitForTimeout(3000);
    console.log('  ✓ Page loaded');

    console.log('\n[Step 2] Clicking on a mission node to open card...');
    // Look for clickable nodes - they typically have an image
    const nodeImages = page.locator('image[href*="/event-images"], image[href*="/mek-images"]').first();
    const nodeExists = await nodeImages.count();

    if (nodeExists > 0) {
      await nodeImages.click();
      await page.waitForTimeout(2000); // Wait for card to animate in
      console.log('  ✓ Clicked on node');
    } else {
      // Try clicking any circle/node element
      const anyNode = page.locator('circle').first();
      await anyNode.click();
      await page.waitForTimeout(2000);
      console.log('  ✓ Clicked on circle node');
    }

    console.log('\n[Step 3] Looking for V2 variation selector in card...');
    const v2Selectors = await page.locator('text=/V2-\\d/').count();
    console.log(`  Found ${v2Selectors} V2 style selector(s)`);

    if (v2Selectors > 0) {
      console.log('\n[Step 4] Clicking V2-3: Header option...');
      const v2_3Button = page.locator('button:has-text("V2-3")').first();
      const isVisible = await v2_3Button.isVisible().catch(() => false);

      if (isVisible) {
        await v2_3Button.click();
        await page.waitForTimeout(1000);
        console.log('  ✓ Selected V2-3 (Card Header)');
      } else {
        console.log('  ⚠ V2-3 button not visible, trying text search...');
        await page.locator('text=V2-3').first().click();
        await page.waitForTimeout(1000);
        console.log('  ✓ Clicked V2-3 via text search');
      }
    }

    console.log('\n[Step 5] Verifying "Cardano Fee" section...');
    const cardanoFeeCount = await page.locator('text=Cardano Fee').count();
    console.log(`  Found ${cardanoFeeCount} "Cardano Fee" header(s)`);

    if (cardanoFeeCount > 0) {
      console.log('\n[Step 6] ✅ NFT UNLOCK SECTION FOUND - Analyzing layout...');

      const cardanoHeader = page.locator('text=Cardano Fee').first();
      const nftSection = cardanoHeader.locator('xpath=ancestor::div[contains(@class, "rounded-xl")]').first();

      // Verify each expected element
      console.log('\n  Layout Element Checks:');

      const headerVisible = await cardanoHeader.isVisible();
      console.log(`    ✓ Header "Cardano Fee": ${headerVisible ? '✅ VISIBLE' : '❌ NOT VISIBLE'}`);

      const remaining = await nftSection.locator('text=/Remaining.*of/i').isVisible().catch(() => false);
      console.log(`    ✓ "Remaining X of Y": ${remaining ? '✅ VISIBLE' : '❌ NOT FOUND'}`);

      const overshoot = await nftSection.locator('text=/Overshoot Discount/i').isVisible().catch(() => false);
      console.log(`    ✓ "Overshoot Discount" box: ${overshoot ? '✅ VISIBLE' : '⚠ Not visible (may be 0%)'}`);

      const original = await nftSection.locator('text=Original').isVisible().catch(() => false);
      console.log(`    ✓ "Original" price label: ${original ? '✅ VISIBLE' : '❌ NOT FOUND'}`);

      const discounted = await nftSection.locator('text=Discounted').isVisible().catch(() => false);
      console.log(`    ✓ "Discounted" price label: ${discounted ? '✅ VISIBLE' : '❌ NOT FOUND'}`);

      const ada = await nftSection.locator('text=ADA').count();
      console.log(`    ✓ "ADA" currency labels: ${ada > 0 ? `✅ FOUND (${ada} instances)` : '❌ NOT FOUND'}`);

      // Check text sizes
      const remainingEl = nftSection.locator('text=/Remaining/i').first();
      const fontSize = await remainingEl.evaluate(el => window.getComputedStyle(el).fontSize).catch(() => 'unknown');
      console.log(`    ✓ "Remaining" font size: ${fontSize}`);

      console.log('\n[Step 7] Taking screenshots...');

      // Focused NFT section screenshot
      const sectionPath = path.join(__dirname, 'nft-v2-3-section-FINAL.png');
      await nftSection.screenshot({ path: sectionPath });
      console.log(`    ✓ NFT section: ${sectionPath}`);

      // Full mission card screenshot
      const cardPath = path.join(__dirname, 'mission-card-with-nft-v2-3.png');
      const missionCard = page.locator('[class*="backdrop-blur"]').first();
      await missionCard.screenshot({ path: cardPath });
      console.log(`    ✓ Full card: ${cardPath}`);

      // Full page for context
      const pagePath = path.join(__dirname, 'story-climb-with-card-open-v2-3.png');
      await page.screenshot({ path: pagePath, fullPage: false });
      console.log(`    ✓ Full page: ${pagePath}`);

      // Text content analysis
      const sectionText = await nftSection.textContent();
      console.log('\n[Step 8] Text Content Verification:');
      console.log(`    "Cardano Fee" in header: ${sectionText.includes('Cardano Fee') ? '✅' : '❌'}`);
      console.log(`    "Remaining" count: ${sectionText.includes('Remaining') ? '✅' : '❌'}`);
      console.log(`    "Overshoot Discount": ${sectionText.includes('Overshoot') ? '✅' : '❌ (may be hidden if 0%)'}`);
      console.log(`    "Original" price: ${sectionText.includes('Original') ? '✅' : '❌'}`);
      console.log(`    "Discounted" price: ${sectionText.includes('Discounted') ? '✅' : '❌'}`);

    } else {
      console.log('\n  ⚠ WARNING: No "Cardano Fee" section found after clicking node');
      console.log('  Possible reasons:');
      console.log('    - This node may not have NFT unlock requirements');
      console.log('    - NFT section is conditional on mission type');
      console.log('    - Need to select V2 variation first');

      // Take debug screenshot
      const debugPath = path.join(__dirname, 'card-opened-no-nft.png');
      await page.screenshot({ path: debugPath, fullPage: false });
      console.log(`  Debug screenshot: ${debugPath}`);
    }

    console.log('\n[Step 9] Console Error Summary:');
    console.log(`  Page JavaScript Errors: ${errors.length}`);
    if (errors.length > 0) {
      console.log('  Errors:');
      errors.forEach(err => console.log(`    - ${err}`));
    } else {
      console.log('  ✅ No JavaScript errors detected');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ VERIFICATION COMPLETE');
    console.log('='.repeat(60));
    console.log('Browser will stay open for 20 seconds for manual inspection...\n');
    await page.waitForTimeout(20000);

  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
    await page.screenshot({ path: path.join(__dirname, 'test-error.png') });
    console.log('Error screenshot saved to test-error.png');
  } finally {
    await browser.close();
    console.log('\nBrowser closed.');
  }
})();
