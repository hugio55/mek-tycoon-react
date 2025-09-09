const { chromium } = require('playwright');

(async () => {
  console.log('\n🎯 Opening Buff Categories page for visual inspection...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--start-maximized']
  });
  
  const context = await browser.newContext({
    viewport: null,  // Use full screen
    screen: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Navigate to buff categories
  await page.goto('http://localhost:3100/admin/buff-categories');
  await page.waitForLoadState('networkidle');
  
  // Add visual indicators
  await page.evaluate(() => {
    // Add a red border to show the actual width being used
    const main = document.querySelector('.min-h-screen');
    if (main) {
      main.style.border = '3px solid red';
      main.style.boxSizing = 'border-box';
    }
    
    // Add viewport width indicator
    const indicator = document.createElement('div');
    indicator.style.position = 'fixed';
    indicator.style.top = '100px';
    indicator.style.right = '20px';
    indicator.style.background = 'yellow';
    indicator.style.color = 'black';
    indicator.style.padding = '10px';
    indicator.style.zIndex = '9999';
    indicator.style.fontWeight = 'bold';
    indicator.innerHTML = `
      Viewport: ${window.innerWidth}px<br>
      Main Width: ${main?.getBoundingClientRect().width}px<br>
      Full Width: ${main?.getBoundingClientRect().width === window.innerWidth ? '✅ YES' : '❌ NO'}
    `;
    document.body.appendChild(indicator);
  });
  
  console.log('✅ Page opened with visual indicators:');
  console.log('   - Red border shows actual content width');
  console.log('   - Yellow box shows width measurements');
  console.log('\n📋 Things to check:');
  console.log('   1. Red border should touch both edges of the window');
  console.log('   2. No horizontal scrollbar should be visible');
  console.log('   3. Form and table should span the full width');
  console.log('\n🎯 Compare with Talent Builder page...\n');
  
  // Open talent builder in new tab for comparison
  const page2 = await context.newPage();
  await page2.goto('http://localhost:3100/talent-builder');
  await page2.waitForLoadState('networkidle');
  
  await page2.evaluate(() => {
    const main = document.querySelector('.min-h-screen');
    if (main) {
      main.style.border = '3px solid green';
      main.style.boxSizing = 'border-box';
    }
    
    const indicator = document.createElement('div');
    indicator.style.position = 'fixed';
    indicator.style.top = '100px';
    indicator.style.right = '20px';
    indicator.style.background = 'lightgreen';
    indicator.style.color = 'black';
    indicator.style.padding = '10px';
    indicator.style.zIndex = '9999';
    indicator.style.fontWeight = 'bold';
    indicator.innerHTML = `
      Viewport: ${window.innerWidth}px<br>
      Main Width: ${main?.getBoundingClientRect().width}px<br>
      Full Width: ${main?.getBoundingClientRect().width === window.innerWidth ? '✅ YES' : '❌ NO'}
    `;
    document.body.appendChild(indicator);
  });
  
  console.log('✅ Talent Builder opened with green border for comparison');
  console.log('\n📝 Both pages should have the same width behavior');
  console.log('   - Switch between tabs to compare');
  console.log('   - Both should show "Full Width: ✅ YES"');
  
  console.log('\n✨ Browser will remain open for inspection.');
  console.log('   Press Ctrl+C to close.\n');
  
  // Keep browser open
  await new Promise(() => {});
})();