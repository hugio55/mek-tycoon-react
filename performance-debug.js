const { chromium } = require('playwright');

async function debugPerformance() {
  console.log('🔍 Debugging mek-rate-logging page...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500 // Slow down to see what's happening
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleLogs = [];

  // Capture all console messages with details
  page.on('console', msg => {
    const log = {
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    };
    consoleLogs.push(log);
    console.log(`[${msg.type().toUpperCase()}]`, msg.text());
  });

  // Capture page errors
  page.on('pageerror', error => {
    console.log('❌ PAGE ERROR:', error.message);
  });

  // Capture network errors
  page.on('requestfailed', request => {
    console.log('🌐 REQUEST FAILED:', request.url(), request.failure().errorText);
  });

  try {
    console.log('📍 Navigating to http://localhost:3100/mek-rate-logging...\n');

    const response = await page.goto('http://localhost:3100/mek-rate-logging', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    console.log('\n📊 Response Status:', response.status());

    // Wait a bit for React to render
    await page.waitForTimeout(3000);

    // Take screenshot of current state
    await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
    console.log('📸 Screenshot saved: debug-screenshot.png');

    // Check what's on the page
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        bodyText: document.body?.innerText?.substring(0, 500),
        elementCount: document.querySelectorAll('*').length,
        hasError: document.body?.innerText?.includes('Error'),
        mekCards: document.querySelectorAll('[class*="mek"]').length,
        images: document.querySelectorAll('img').length,
        buttons: document.querySelectorAll('button').length
      };
    });

    console.log('\n📄 Page Content Analysis:');
    console.log('   Title:', pageContent.title);
    console.log('   Element Count:', pageContent.elementCount);
    console.log('   Mek Elements:', pageContent.mekCards);
    console.log('   Images:', pageContent.images);
    console.log('   Buttons:', pageContent.buttons);
    console.log('   Has Error:', pageContent.hasError);
    console.log('\n   Body Preview:', pageContent.bodyText);

    console.log('\n⏳ Waiting 10 seconds to observe behavior...');
    await page.waitForTimeout(10000);

    await page.screenshot({ path: 'debug-screenshot-after-wait.png', fullPage: true });
    console.log('📸 Screenshot after wait saved');

    console.log('\n📋 Total Console Messages:', consoleLogs.length);

  } catch (error) {
    console.error('❌ Error during debugging:', error.message);
    await page.screenshot({ path: 'debug-error.png', fullPage: true });
  } finally {
    console.log('\n⏸️  Keeping browser open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);
    await browser.close();
  }
}

debugPerformance().catch(console.error);
