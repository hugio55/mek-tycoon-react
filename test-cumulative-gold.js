const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Navigating to mek-rate-logging page...');
  await page.goto('http://localhost:3100/mek-rate-logging', { waitUntil: 'networkidle' });

  // Wait for content to load
  await page.waitForTimeout(3000);

  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`);
  });

  // Take initial screenshot
  const screenshotPath = path.join(__dirname, 'cumulative-gold-initial.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('Initial screenshot saved to:', screenshotPath);

  // Try to extract cumulative gold value
  const cumulativeGold = await page.evaluate(() => {
    // Look for elements containing "Cumulative Gold" or similar
    const labels = Array.from(document.querySelectorAll('label, div, span, p'));
    for (const label of labels) {
      if (label.textContent.toLowerCase().includes('cumulative') &&
          label.textContent.toLowerCase().includes('gold')) {
        // Found the label, try to find the value nearby
        const parent = label.closest('div');
        if (parent) {
          const valueElement = parent.querySelector('input, span, div');
          if (valueElement) {
            return valueElement.textContent || valueElement.value || 'Value not found';
          }
        }
      }
    }

    // Alternative: look for any gold-related values
    const allText = document.body.innerText;
    const goldMatches = allText.match(/cumulative[^0-9]*([0-9,]+)/i);
    if (goldMatches) {
      return goldMatches[1];
    }

    return 'Could not locate cumulative gold value';
  });

  console.log('\n=== CUMULATIVE GOLD VALUE ===');
  console.log('Value found:', cumulativeGold);

  // Wait 5 seconds and check again
  console.log('\nWaiting 5 seconds to check for real-time updates...');
  await page.waitForTimeout(5000);

  const cumulativeGoldAfter = await page.evaluate(() => {
    const allText = document.body.innerText;
    const goldMatches = allText.match(/cumulative[^0-9]*([0-9,]+)/i);
    if (goldMatches) {
      return goldMatches[1];
    }
    return 'Could not locate cumulative gold value';
  });

  const screenshotPathAfter = path.join(__dirname, 'cumulative-gold-after-5s.png');
  await page.screenshot({ path: screenshotPathAfter, fullPage: true });
  console.log('After-wait screenshot saved to:', screenshotPathAfter);

  console.log('Value after 5s:', cumulativeGoldAfter);
  console.log('Value changed:', cumulativeGold !== cumulativeGoldAfter);

  console.log('\n=== CONSOLE MESSAGES ===');
  if (consoleMessages.length > 0) {
    consoleMessages.forEach(msg => console.log(msg));
  } else {
    console.log('No console messages captured');
  }

  await browser.close();
})();