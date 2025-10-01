const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false }); // Use headful for debugging
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(`${msg.type()}: ${text}`);
    console.log(`[CONSOLE ${msg.type()}]: ${text}`);
  });

  // Capture page errors
  page.on('pageerror', error => {
    console.log(`[PAGE ERROR]: ${error.message}`);
    consoleMessages.push(`error: ${error.message}`);
  });

  console.log('Navigating to mek-rate-logging page...');
  await page.goto('http://localhost:3100/mek-rate-logging', { waitUntil: 'networkidle' });

  // Wait for content to load
  await page.waitForTimeout(3000);

  // Take initial screenshot
  const screenshotPath = path.join(__dirname, 'cumulative-gold-with-context.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('Screenshot saved to:', screenshotPath);

  // Check if wallet connection is required
  const walletError = await page.locator('text=NO CARDANO WALLETS DETECTED').isVisible().catch(() => false);
  console.log('\nWallet detection error shown:', walletError);

  // Try to find the cumulative gold element regardless
  const goldSection = await page.evaluate(() => {
    // Look for the cumulative gold label
    const labels = Array.from(document.querySelectorAll('div, span, p'));
    for (const label of labels) {
      if (label.textContent && label.textContent.includes('Cumulative Gold')) {
        const parent = label.closest('div');
        if (parent) {
          return {
            found: true,
            labelText: label.textContent,
            parentHTML: parent.innerHTML,
            parentText: parent.textContent
          };
        }
      }
    }
    return { found: false };
  });

  console.log('\n=== CUMULATIVE GOLD SECTION ===');
  console.log(JSON.stringify(goldSection, null, 2));

  // Try to extract just the numeric value
  if (goldSection.found) {
    const numericValue = await page.evaluate(() => {
      const divs = Array.from(document.querySelectorAll('div'));
      for (const div of divs) {
        if (div.textContent && div.textContent.includes('Total Cumulative Gold')) {
          // Get the next sibling or child with the actual value
          const valueDiv = div.nextElementSibling || div.querySelector('.text-yellow-400');
          if (valueDiv) {
            return valueDiv.textContent.trim();
          }
        }
      }
      return null;
    });
    console.log('\nExtracted cumulative gold value:', numericValue);
  }

  // Check for the actual page state
  const pageState = await page.evaluate(() => {
    return {
      hasGoldDisplay: !!document.querySelector('.text-yellow-400'),
      bodyText: document.body.innerText.substring(0, 500)
    };
  });

  console.log('\n=== PAGE STATE ===');
  console.log('Has gold display elements:', pageState.hasGoldDisplay);
  console.log('Body text preview:', pageState.bodyText);

  console.log('\n=== ALL CONSOLE MESSAGES ===');
  consoleMessages.forEach(msg => console.log(msg));

  console.log('\nBrowser will stay open for 10 seconds for manual inspection...');
  await page.waitForTimeout(10000);

  await browser.close();
})();