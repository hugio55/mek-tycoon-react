const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  console.log('\n🔍 Testing Full Width Layout for Buff Categories Page\n');
  console.log('=' . repeat(60));
  
  // Navigate to buff categories page
  await page.goto('http://localhost:3100/admin/buff-categories');
  await page.waitForLoadState('networkidle');
  
  // Wait for content to be visible
  await page.waitForSelector('h1:has-text("Admin - Buff Categories")', { timeout: 5000 });
  
  // Get the viewport width
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  console.log(`\n✓ Viewport width: ${viewportWidth}px`);
  
  // Check main content container width
  const mainContent = await page.locator('.min-h-screen').first();
  const mainBox = await mainContent.boundingBox();
  console.log(`✓ Main content width: ${mainBox?.width}px`);
  
  // Check if using full viewport width
  const isFullWidth = mainBox?.width === viewportWidth;
  console.log(`\n${isFullWidth ? '✅' : '❌'} Page is ${isFullWidth ? 'using' : 'NOT using'} full viewport width`);
  
  // Check form section width
  const formSection = await page.locator('.bg-gray-900\\/50').first();
  const formBox = await formSection.boundingBox();
  console.log(`✓ Form section width: ${formBox?.width}px`);
  
  // Check table section width
  const tableSection = await page.locator('.bg-gray-900\\/50').nth(1);
  const tableBox = await tableSection.boundingBox();
  console.log(`✓ Table section width: ${tableBox?.width}px`);
  
  // Compare with talent builder for reference
  console.log('\n📊 Comparing with Talent Builder page (known full-width)...\n');
  await page.goto('http://localhost:3100/talent-builder');
  await page.waitForLoadState('networkidle');
  
  const talentContent = await page.locator('.min-h-screen').first();
  const talentBox = await talentContent.boundingBox();
  console.log(`✓ Talent Builder width: ${talentBox?.width}px`);
  
  const bothFullWidth = mainBox?.width === talentBox?.width && talentBox?.width === viewportWidth;
  
  console.log('\n' + '=' . repeat(60));
  console.log(`\n${bothFullWidth ? '✅ SUCCESS' : '⚠️  ISSUE'}: Both pages ${bothFullWidth ? 'are' : 'are NOT'} using full viewport width`);
  
  if (!bothFullWidth) {
    console.log('\n📝 Debug Info:');
    console.log(`  - Viewport: ${viewportWidth}px`);
    console.log(`  - Buff Categories: ${mainBox?.width}px`);
    console.log(`  - Talent Builder: ${talentBox?.width}px`);
    console.log(`  - Difference: ${Math.abs((mainBox?.width || 0) - viewportWidth)}px`);
  }
  
  // Take screenshots for visual verification
  await page.goto('http://localhost:3100/admin/buff-categories');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'buff-categories-full-width.png', fullPage: false });
  console.log('\n📸 Screenshot saved as buff-categories-full-width.png');
  
  console.log('\n✨ Test complete! Browser will remain open for manual inspection.');
  console.log('   Press Ctrl+C in terminal to close.\n');
  
  // Keep browser open for manual inspection
  await new Promise(() => {});
})();