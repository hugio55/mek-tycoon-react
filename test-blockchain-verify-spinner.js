const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to the page
  console.log('Navigating to mek-rate-logging page...');
  await page.goto('http://localhost:3100/mek-rate-logging');

  // Wait for page to load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Take initial screenshot
  console.log('Taking initial screenshot...');
  await page.screenshot({
    path: 'blockchain-verify-initial.png',
    fullPage: true
  });

  // Look for the Blockchain Verify button - it's inside a HolographicButton component
  console.log('Looking for Blockchain Verify button...');

  // Try multiple selectors since the button might be in a custom component
  let button = await page.locator('text="Blockchain Verify"').first();

  if (await button.count() === 0) {
    console.log('Trying alternative selector...');
    button = await page.locator('[class*="button"]:has-text("Blockchain")').first();
  }

  if (await button.count() === 0) {
    console.log('ERROR: Could not find Blockchain Verify button');
    console.log('Available buttons:', await page.locator('button').allTextContents());
    await browser.close();
    return;
  }

  // Check initial button state
  const initialText = await button.innerText();
  console.log(`Initial button text: "${initialText}"`);

  // Take screenshot focused on the button
  await button.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: 'blockchain-verify-button-before.png',
    fullPage: false
  });

  // Set up console listener
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  // Click the button
  console.log('Clicking Blockchain Verify button...');
  await button.click();

  // Take immediate screenshot after click
  await page.waitForTimeout(100);
  await page.screenshot({
    path: 'blockchain-verify-clicked-100ms.png',
    fullPage: false
  });

  // Take another screenshot after 500ms
  await page.waitForTimeout(400);
  await page.screenshot({
    path: 'blockchain-verify-clicked-500ms.png',
    fullPage: false
  });

  // Check button text after clicking
  const clickedText = await button.innerText();
  console.log(`Button text after click: "${clickedText}"`);

  // Check if button is disabled
  const isDisabled = await button.isDisabled();
  console.log(`Button disabled: ${isDisabled}`);

  // Look for spinner or loading indicator - check for the specific spinner structure
  const spinnerSelector = '.animate-spin';
  const hasSpinner = await page.locator(spinnerSelector).count();
  console.log(`Spinner/loading elements found: ${hasSpinner}`);

  // Check if spinner is visible
  if (hasSpinner > 0) {
    const spinnerVisible = await page.locator(spinnerSelector).first().isVisible();
    console.log(`Spinner is visible: ${spinnerVisible}`);
  }

  // Take screenshot after 1 second
  await page.waitForTimeout(500);
  await page.screenshot({
    path: 'blockchain-verify-clicked-1s.png',
    fullPage: false
  });

  // Take screenshot after 2 seconds
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: 'blockchain-verify-clicked-2s.png',
    fullPage: false
  });

  // Check if text contains "VERIFYING"
  const currentText = await button.innerText();
  console.log(`Current button text: "${currentText}"`);
  console.log(`Text contains VERIFYING: ${currentText.includes('VERIFYING')}`);

  // Wait a bit longer to see if verification completes
  console.log('Waiting for verification to complete...');
  await page.waitForTimeout(5000);

  // Take final screenshot
  await page.screenshot({
    path: 'blockchain-verify-final.png',
    fullPage: false
  });

  const finalText = await button.innerText();
  console.log(`Final button text: "${finalText}"`);

  console.log('\n=== TEST COMPLETE ===');
  console.log('Screenshots saved:');
  console.log('- blockchain-verify-initial.png');
  console.log('- blockchain-verify-button-before.png');
  console.log('- blockchain-verify-clicked-100ms.png');
  console.log('- blockchain-verify-clicked-500ms.png');
  console.log('- blockchain-verify-clicked-1s.png');
  console.log('- blockchain-verify-clicked-2s.png');
  console.log('- blockchain-verify-final.png');

  await browser.close();
})();
