const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testMissionControlVariations() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, 'mission-control-screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  try {
    console.log('🚀 Starting Mission Control UI Testing...');

    // Navigate to the demo page
    await page.goto('http://localhost:3100/mission-control-demo');
    await page.waitForLoadState('networkidle');

    console.log('📸 Taking initial page screenshot...');
    await page.screenshot({
      path: path.join(screenshotsDir, '00-initial-page.png'),
      fullPage: true
    });

    // Get console messages
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });

    // Test each variation
    for (let i = 1; i <= 5; i++) {
      console.log(`\n🎯 Testing Variation ${i}...`);

      // Click variation button
      await page.click(`button:has-text("${i}.")`);
      await page.waitForTimeout(500); // Allow animation to complete

      // Take screenshot of main variation
      await page.screenshot({
        path: path.join(screenshotsDir, `${i.toString().padStart(2, '0')}-variation-${i}.png`),
        fullPage: true
      });

      // Test different node types for this variation
      const nodeTypes = ['normal', 'boss', 'final_boss', 'event'];
      for (const nodeType of nodeTypes) {
        console.log(`  📋 Testing ${nodeType} node type...`);

        // Select node type
        await page.selectOption('select', nodeType);
        await page.waitForTimeout(300);

        // Take screenshot
        await page.screenshot({
          path: path.join(screenshotsDir, `${i.toString().padStart(2, '0')}-variation-${i}-${nodeType}.png`),
          fullPage: false,
          clip: { x: 0, y: 0, width: 1400, height: 900 }
        });
      }

      // Test deploy button states
      console.log(`  🔘 Testing deploy button states...`);

      // Reset to boss mode for consistent testing
      await page.selectOption('select', 'boss');
      await page.waitForTimeout(200);

      // Test disabled state
      await page.click('button:has-text("ENABLED")');
      await page.waitForTimeout(300);
      await page.screenshot({
        path: path.join(screenshotsDir, `${i.toString().padStart(2, '0')}-variation-${i}-disabled.png`),
        fullPage: false,
        clip: { x: 0, y: 0, width: 1400, height: 900 }
      });

      // Re-enable
      await page.click('button:has-text("DISABLED")');
      await page.waitForTimeout(300);

      // Test deploy button hover (if visible)
      const deployButton = page.locator('button:has-text("DEPLOY")').first();
      if (await deployButton.isVisible()) {
        await deployButton.hover();
        await page.waitForTimeout(200);
        await page.screenshot({
          path: path.join(screenshotsDir, `${i.toString().padStart(2, '0')}-variation-${i}-hover.png`),
          fullPage: false,
          clip: { x: 0, y: 0, width: 1400, height: 900 }
        });
      }
    }

    // Test responsiveness by changing viewport
    console.log('\n📱 Testing responsiveness...');
    await page.setViewportSize({ width: 768, height: 1024 }); // Tablet
    await page.screenshot({
      path: path.join(screenshotsDir, '99-responsive-tablet.png'),
      fullPage: true
    });

    await page.setViewportSize({ width: 375, height: 667 }); // Mobile
    await page.screenshot({
      path: path.join(screenshotsDir, '99-responsive-mobile.png'),
      fullPage: true
    });

    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });

    console.log('\n✅ Testing completed successfully!');
    console.log(`📁 Screenshots saved to: ${screenshotsDir}`);
    console.log(`📊 Console messages captured: ${consoleMessages.length}`);

    if (consoleMessages.length > 0) {
      console.log('\n🚨 Console Messages:');
      consoleMessages.forEach(msg => console.log(`  ${msg}`));
    }

    return {
      success: true,
      screenshotsPath: screenshotsDir,
      consoleMessages: consoleMessages,
      variationsTested: 5
    };

  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error.message,
      screenshotsPath: screenshotsDir
    };
  } finally {
    await browser.close();
  }
}

// Run the test
testMissionControlVariations().then(results => {
  console.log('\n📋 Test Results Summary:');
  console.log(JSON.stringify(results, null, 2));
  process.exit(results.success ? 0 : 1);
});