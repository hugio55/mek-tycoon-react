import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Capture console logs
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error' || type === 'warning') {
      console.log(`[BROWSER ${type.toUpperCase()}]`, text);
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    console.log('[PAGE ERROR]', error.message);
  });

  await page.goto('http://localhost:3200/landing-v2');
  await page.waitForTimeout(3000);

  // Check if phase cards are in the DOM at all
  const phaseCardsExist = await page.locator('[class*="phase"]').count();
  console.log('Elements with "phase" in class:', phaseCardsExist);

  // Check current state
  const bodyHTML = await page.evaluate(() => document.body.innerText);
  console.log('Page contains "Phase I":', bodyHTML.includes('Phase I'));
  console.log('Page contains "Phase II":', bodyHTML.includes('Phase II'));

  // Try clicking the guard button
  try {
    const guardButton = page.locator('button').first();
    await guardButton.click();
    console.log('Clicked guard button');
    await page.waitForTimeout(8000);

    // Check again after clicking
    const bodyHTMLAfter = await page.evaluate(() => document.body.innerText);
    console.log('\nAfter click:');
    console.log('Page contains "Phase I":', bodyHTMLAfter.includes('Phase I'));
    console.log('Page contains "Phase II":', bodyHTMLAfter.includes('Phase II'));
  } catch (e) {
    console.log('Error clicking button:', e.message);
  }

  await browser.close();
})();
