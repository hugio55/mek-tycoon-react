const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('http://localhost:3200/admin/claude-md-viewer');
  await page.waitForTimeout(3000);

  // Check for sections
  const totalSections = await page.locator('text=Total Sections:').textContent();
  console.log('✓', totalSections);

  const criticalCount = await page.locator('text=Critical:').textContent();
  console.log('✓', criticalCount);

  const protectionCount = await page.locator('text=Protection:').textContent();
  console.log('✓', protectionCount);

  const configCount = await page.locator('text=Configuration:').textContent();
  console.log('✓', configCount);

  // Check if section cards are visible
  const criticalSectionVisible = await page.locator('text=Critical Sections').isVisible();
  console.log('✓ Critical Sections visible:', criticalSectionVisible);

  const protectionSectionVisible = await page.locator('text=Protection Rules').isVisible();
  console.log('✓ Protection Rules visible:', protectionSectionVisible);

  await browser.close();
})();
