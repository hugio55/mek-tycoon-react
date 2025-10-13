const { chromium } = require('playwright');

(async () => {
  console.log('\n========================================');
  console.log('MANUAL VISUAL VERIFICATION');
  console.log('========================================\n');
  console.log('Instructions:');
  console.log('1. Browser will open to story-climb page');
  console.log('2. Click on any EVENT node (red/event nodes typically have NFTs)');
  console.log('3. In the mission card, look for the V2 variation selector');
  console.log('4. Click "V2-3: Header" to see the Card Header variation');
  console.log('5. Verify the NFT section shows:');
  console.log('   - Header: "Cardano Fee"');
  console.log('   - Large: "Remaining: X of Y"');
  console.log('   - Yellow box: "Overshoot Discount: X% OFF"');
  console.log('   - Price grid: Original | Discounted');
  console.log('\nBrowser will stay open for 60 seconds...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 }
  });

  // Monitor console errors
  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.message);
    console.error(`❌ Page Error: ${error.message}`);
  });

  try {
    await page.goto('http://localhost:3100/scrap-yard/story-climb', {
      waitUntil: 'networkidle'
    });

    console.log('✓ Page loaded - waiting for manual verification...\n');

    // Wait for user to interact
    await page.waitForTimeout(60000);

    console.log('\n========================================');
    if (errors.length > 0) {
      console.log(`⚠ Detected ${errors.length} JavaScript error(s)`);
    } else {
      console.log('✅ No JavaScript errors detected');
    }
    console.log('========================================\n');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
    console.log('Browser closed.\n');
  }
})();
