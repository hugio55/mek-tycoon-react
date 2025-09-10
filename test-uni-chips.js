const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  // Navigate to the page
  await page.goto("http://localhost:3100/uni-chips");
  await page.waitForSelector("h1");
  
  console.log("Page loaded, taking initial screenshot...");
  await page.screenshot({ path: "test-initial.png", fullPage: true });
  
  // Test hover on rarity bias percentages
  console.log("Testing hover on rarity bias percentages...");
  const biasElements = page.locator("text=+15%");
  if (await biasElements.count() > 0) {
    await biasElements.first().hover();
    await page.waitForTimeout(2000); // Wait to see tooltip
    await page.screenshot({ path: "test-hover-bias.png", fullPage: true });
    console.log("Hover test completed");
  }
  
  // Test clicking T2 chip
  console.log("Testing T2 chip selection...");
  const t2Button = page.locator("button").filter({ hasText: "T2" }).first();
  if (await t2Button.count() > 0) {
    await t2Button.click();
    await page.waitForTimeout(1000); // Wait for animations
    await page.screenshot({ path: "test-t2-selected.png", fullPage: true });
    console.log("T2 selection test completed");
  }
  
  console.log("All tests completed");
  await browser.close();
})();
