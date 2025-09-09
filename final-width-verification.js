const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  console.log('\n✨ FINAL VERIFICATION: Full Width Layout Test\n');
  console.log('=' . repeat(70));
  
  // Test 1: Buff Categories Page
  console.log('\n📌 Testing Admin Buff Categories Page...');
  await page.goto('http://localhost:3100/admin/buff-categories');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('h1:has-text("Admin - Buff Categories")', { timeout: 5000 });
  
  const buffCategoriesData = await page.evaluate(() => {
    const viewport = window.innerWidth;
    const main = document.querySelector('.min-h-screen');
    const mainBox = main?.getBoundingClientRect();
    const formSection = document.querySelector('.bg-gray-900\\/50');
    const formBox = formSection?.getBoundingClientRect();
    
    return {
      viewport,
      mainWidth: mainBox?.width,
      formWidth: formBox?.width,
      isFullWidth: mainBox?.width === viewport
    };
  });
  
  console.log(`  ✓ Viewport: ${buffCategoriesData.viewport}px`);
  console.log(`  ✓ Main content: ${buffCategoriesData.mainWidth}px`);
  console.log(`  ✓ Form section: ${buffCategoriesData.formWidth}px`);
  console.log(`  ${buffCategoriesData.isFullWidth ? '✅' : '❌'} Using full width: ${buffCategoriesData.isFullWidth}`);
  
  // Test 2: Talent Builder Page (for comparison)
  console.log('\n📌 Testing Talent Builder Page (reference)...');
  await page.goto('http://localhost:3100/talent-builder');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  const talentBuilderData = await page.evaluate(() => {
    const viewport = window.innerWidth;
    const main = document.querySelector('.min-h-screen');
    const mainBox = main?.getBoundingClientRect();
    
    return {
      viewport,
      mainWidth: mainBox?.width,
      isFullWidth: mainBox?.width === viewport
    };
  });
  
  console.log(`  ✓ Viewport: ${talentBuilderData.viewport}px`);
  console.log(`  ✓ Main content: ${talentBuilderData.mainWidth}px`);
  console.log(`  ${talentBuilderData.isFullWidth ? '✅' : '❌'} Using full width: ${talentBuilderData.isFullWidth}`);
  
  // Test 3: Regular page (Hub) - should NOT be full width
  console.log('\n📌 Testing Hub Page (should be constrained)...');
  await page.goto('http://localhost:3100/hub');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  const hubData = await page.evaluate(() => {
    const viewport = window.innerWidth;
    const nav = document.querySelector('nav');
    const navContainer = nav?.parentElement;
    const navBox = navContainer?.getBoundingClientRect();
    
    return {
      viewport,
      navWidth: navBox?.width,
      isConstrained: navBox?.width < viewport && navBox?.width <= 910 // 900px + padding
    };
  });
  
  console.log(`  ✓ Viewport: ${hubData.viewport}px`);
  console.log(`  ✓ Navigation container: ${hubData.navWidth}px`);
  console.log(`  ${hubData.isConstrained ? '✅' : '❌'} Properly constrained: ${hubData.isConstrained}`);
  
  // Summary
  console.log('\n' + '=' . repeat(70));
  console.log('\n🎯 SUMMARY:\n');
  
  const allTestsPassed = 
    buffCategoriesData.isFullWidth && 
    talentBuilderData.isFullWidth && 
    hubData.isConstrained;
  
  if (allTestsPassed) {
    console.log('  ✅ SUCCESS! All layout tests passed:');
    console.log('     - Admin pages use full viewport width');
    console.log('     - Talent builder uses full viewport width');
    console.log('     - Regular pages remain properly constrained');
  } else {
    console.log('  ⚠️  Some tests failed:');
    if (!buffCategoriesData.isFullWidth) {
      console.log('     ❌ Admin buff categories NOT using full width');
    }
    if (!talentBuilderData.isFullWidth) {
      console.log('     ❌ Talent builder NOT using full width');
    }
    if (!hubData.isConstrained) {
      console.log('     ❌ Hub page NOT properly constrained');
    }
  }
  
  // Take screenshots
  await page.goto('http://localhost:3100/admin/buff-categories');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'final-buff-categories.png', fullPage: false });
  console.log('\n📸 Screenshot saved as final-buff-categories.png');
  
  console.log('\n✨ Verification complete! Browser will close in 5 seconds...\n');
  await page.waitForTimeout(5000);
  await browser.close();
})();