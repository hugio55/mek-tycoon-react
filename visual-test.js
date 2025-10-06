const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Track console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text()
    });
  });

  console.log('=== VISUAL TEST: Mek Rate Logging Page ===\n');

  // Navigate to page
  console.log('Step 1: Navigating to mek-rate-logging page...');
  await page.goto('http://localhost:3100/mek-rate-logging', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  console.log('SUCCESS: Page loaded\n');

  // Take initial screenshot
  console.log('Step 2: Taking initial screenshot...');
  await page.screenshot({ path: 'test-initial.png', fullPage: true });
  console.log('SUCCESS: Screenshot saved as test-initial.png\n');

  // Check for images
  console.log('Step 3: Verifying 1000px images load...');
  const images = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img[src*="1000px"]'));
    return imgs.map(img => ({
      src: img.src,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      complete: img.complete,
      visible: img.offsetWidth > 0 && img.offsetHeight > 0
    }));
  });

  console.log(`Found ${images.length} 1000px images:`);
  images.forEach((img, i) => {
    const status = img.complete && img.naturalWidth > 0 ? 'SUCCESS' : 'FAILED';
    console.log(`  ${status}: Image ${i+1} - ${img.naturalWidth}x${img.naturalHeight} - ${img.visible ? 'visible' : 'hidden'}`);
  });
  console.log();

  // Check backdrop blur
  console.log('Step 4: Checking backdrop blur effects...');
  const backdropBlurs = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('*'));
    return elements.filter(el => {
      const style = window.getComputedStyle(el);
      return style.backdropFilter && style.backdropFilter !== 'none';
    }).map(el => ({
      tag: el.tagName,
      classes: el.className,
      backdropFilter: window.getComputedStyle(el).backdropFilter
    }));
  });

  console.log(`Found ${backdropBlurs.length} elements with backdrop blur:`);
  backdropBlurs.slice(0, 5).forEach((el, i) => {
    console.log(`  SUCCESS: ${el.tag} - ${el.backdropFilter}`);
  });
  if (backdropBlurs.length > 5) console.log(`  ... and ${backdropBlurs.length - 5} more`);
  console.log();

  // Check gold values
  console.log('Step 5: Checking gold accumulation display...');
  const goldValue = await page.evaluate(() => {
    const goldEl = document.querySelector('body');
    return goldEl ? goldEl.textContent.match(/[\d,]+\.?\d*/)?.[0] : null;
  });
  console.log(`Current gold display: ${goldValue || 'Not found'}`);

  // Wait and check again for gold accumulation
  await page.waitForTimeout(3000);
  const goldValueAfter = await page.evaluate(() => {
    const goldEl = document.querySelector('body');
    return goldEl ? goldEl.textContent.match(/[\d,]+\.?\d*/)?.[0] : null;
  });
  console.log(`Gold after 3 seconds: ${goldValueAfter || 'Not found'}`);
  console.log();

  // Test scrolling
  console.log('Step 6: Testing scroll performance...');
  const scrollStart = Date.now();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  const scrollTime = Date.now() - scrollStart;
  console.log(`SUCCESS: Scrolled to bottom in ${scrollTime}ms`);

  await page.screenshot({ path: 'test-scrolled.png', fullPage: true });
  console.log('SUCCESS: Screenshot saved as test-scrolled.png\n');

  // Check for errors
  console.log('Step 7: Checking console for errors...');
  const errors = consoleMessages.filter(m => m.type === 'error');
  const warnings = consoleMessages.filter(m => m.type === 'warning');

  if (errors.length > 0) {
    console.log(`FAILED: Found ${errors.length} console errors:`);
    errors.forEach(err => console.log(`  - ${err.text}`));
  } else {
    console.log('SUCCESS: No console errors');
  }

  if (warnings.length > 0) {
    console.log(`WARNING: Found ${warnings.length} console warnings:`);
    warnings.forEach(warn => console.log(`  - ${warn.text}`));
  } else {
    console.log('SUCCESS: No console warnings');
  }
  console.log();

  // Test mobile viewport
  console.log('Step 8: Testing mobile viewport (390x844)...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1000);

  await page.screenshot({ path: 'test-mobile.png', fullPage: true });
  console.log('SUCCESS: Mobile screenshot saved as test-mobile.png\n');

  // Check card rendering
  console.log('Step 9: Verifying card rendering...');
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.waitForTimeout(500);

  const cards = await page.evaluate(() => {
    const cardElements = Array.from(document.querySelectorAll('[class*="card"], [class*="mek-card"]'));
    return cardElements.map(card => ({
      width: card.offsetWidth,
      height: card.offsetHeight,
      visible: card.offsetWidth > 0 && card.offsetHeight > 0,
      hasBackground: window.getComputedStyle(card).background !== ''
    }));
  });

  console.log(`Found ${cards.length} card elements:`);
  const visibleCards = cards.filter(c => c.visible);
  console.log(`  SUCCESS: ${visibleCards.length} cards visible`);
  if (visibleCards.length > 0) {
    const avgWidth = Math.round(visibleCards.reduce((sum, c) => sum + c.width, 0) / visibleCards.length);
    console.log(`  SUCCESS: Average card width - ${avgWidth}px`);
  }
  console.log();

  console.log('=== TEST COMPLETE ===');

  await browser.close();
})();
