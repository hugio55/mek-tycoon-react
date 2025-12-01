import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('http://localhost:3200/landing-v2');
  await page.waitForTimeout(2000);

  // Click the left button (Guard sound)
  const buttons = await page.locator('button').all();
  if (buttons.length > 0) {
    await buttons[0].click();
  }

  // Wait for reveal animation
  await page.waitForTimeout(6000);

  // Scroll down to see phase cards
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);

  await page.screenshot({ path: 'landing-full.png', fullPage: true });

  await browser.close();
  console.log('Screenshot saved as landing-full.png');
})();
