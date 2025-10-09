const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console messages
  const consoleMessages = [];
  const pageErrors = [];

  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    consoleMessages.push({ type, text });
    console.log(`[CONSOLE ${type.toUpperCase()}] ${text}`);
  });

  page.on('pageerror', exception => {
    pageErrors.push(exception.message);
    console.log(`[PAGE ERROR] ${exception.message}`);
  });

  // Navigate to the page
  console.log('\n=== Navigating to http://localhost:3100/ ===\n');
  await page.goto('http://localhost:3100/', { waitUntil: 'networkidle' });

  // Wait a bit to capture any async errors
  await page.waitForTimeout(3000);

  // Check for gold accumulation
  console.log('\n=== Checking Gold State ===');
  const goldState = await page.evaluate(() => {
    // Try to find gold value on page
    const goldElements = document.querySelectorAll('[data-testid*="gold"], .gold, [class*="gold"]');
    const goldText = Array.from(goldElements).map(el => el.textContent).join(', ');

    // Check if animations are running
    const hasAnimations = getComputedStyle(document.body).animationName !== 'none';

    return {
      goldElements: goldText,
      hasAnimations,
      url: window.location.href,
      title: document.title
    };
  });

  console.log('Gold elements found:', goldState.goldElements);
  console.log('Has animations:', goldState.hasAnimations);
  console.log('Page URL:', goldState.url);
  console.log('Page title:', goldState.title);

  // Summary
  console.log('\n=== SUMMARY ===');
  console.log(`Total console messages: ${consoleMessages.length}`);
  console.log(`Console errors: ${consoleMessages.filter(m => m.type === 'error').length}`);
  console.log(`Console warnings: ${consoleMessages.filter(m => m.type === 'warning').length}`);
  console.log(`Page errors: ${pageErrors.length}`);

  if (pageErrors.length > 0) {
    console.log('\n=== PAGE ERRORS ===');
    pageErrors.forEach((err, i) => console.log(`${i + 1}. ${err}`));
  }

  const errors = consoleMessages.filter(m => m.type === 'error');
  if (errors.length > 0) {
    console.log('\n=== CONSOLE ERRORS ===');
    errors.forEach((err, i) => console.log(`${i + 1}. ${err.text}`));
  }

  const warnings = consoleMessages.filter(m => m.type === 'warning');
  if (warnings.length > 0) {
    console.log('\n=== CONSOLE WARNINGS ===');
    warnings.forEach((warn, i) => console.log(`${i + 1}. ${warn.text}`));
  }

  console.log('\n=== Keeping browser open for 30 seconds for manual inspection ===');
  await page.waitForTimeout(30000);

  await browser.close();
})();
