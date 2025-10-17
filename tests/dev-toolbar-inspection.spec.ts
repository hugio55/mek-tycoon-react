import { test, expect } from '@playwright/test';

test('Dev Toolbar Page - Comprehensive Inspection', async ({ page }) => {
  // Array to collect console messages
  const consoleMessages: string[] = [];
  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];
  const pageErrors: string[] = [];
  const networkFailures: string[] = [];

  // Listen to console events
  page.on('console', msg => {
    const text = `[${msg.type()}] ${msg.text()}`;
    consoleMessages.push(text);

    if (msg.type() === 'error') {
      consoleErrors.push(text);
    } else if (msg.type() === 'warning') {
      consoleWarnings.push(text);
    }
  });

  // Listen to page errors
  page.on('pageerror', exception => {
    pageErrors.push(exception.message);
  });

  // Listen to failed network requests
  page.on('requestfailed', request => {
    networkFailures.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
  });

  console.log('\n========================================');
  console.log('🔍 STARTING DEV TOOLBAR INSPECTION');
  console.log('========================================\n');

  // Navigate to the page
  console.log('📍 Navigating to http://localhost:3100/dev-toolbar...');
  await page.goto('http://localhost:3100/dev-toolbar', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  console.log('✅ Page loaded\n');

  // Take initial screenshot
  console.log('📸 Taking initial screenshot...');
  await page.screenshot({
    path: 'C:\\Users\\Ben Meyers\\Documents\\Mek Tycoon\\TYCOON REACT 8-27\\mek-tycoon-react\\test-results\\dev-toolbar-01-initial.png',
    fullPage: true
  });
  console.log('✅ Screenshot saved: test-results/dev-toolbar-01-initial.png\n');

  // Wait a moment for any dynamic content to load
  await page.waitForTimeout(2000);

  // Check page title
  const title = await page.title();
  console.log(`📄 Page Title: "${title}"\n`);

  // Check for toolbar buttons
  console.log('🔘 Checking for toolbar buttons...');
  const toolbarButtons = await page.locator('button, a[role="button"]').all();
  console.log(`   Found ${toolbarButtons.length} button elements\n`);

  // Check for Edit Mode button specifically
  console.log('🔍 Looking for "Edit Mode" button...');
  const editModeButton = page.locator('button:has-text("Edit Mode"), button:has-text("edit mode")').first();
  const editModeExists = await editModeButton.count() > 0;
  console.log(`   Edit Mode button exists: ${editModeExists}\n`);

  // Check for Loading text
  console.log('⏳ Checking for "Loading..." text...');
  const loadingText = page.locator('text=Loading').first();
  const isLoading = await loadingText.count() > 0;
  console.log(`   Page showing loading state: ${isLoading}\n`);

  // Check for visible content
  console.log('📝 Checking page content...');
  const bodyText = await page.locator('body').innerText();
  const hasContent = bodyText.trim().length > 0;
  console.log(`   Page has visible content: ${hasContent}`);
  console.log(`   Content length: ${bodyText.trim().length} characters\n`);

  // Check for styling issues (plain text appearance)
  console.log('🎨 Checking for styling...');
  const bodyStyles = await page.locator('body').evaluate(el => {
    const computed = window.getComputedStyle(el);
    return {
      backgroundColor: computed.backgroundColor,
      color: computed.color,
      fontFamily: computed.fontFamily
    };
  });
  console.log(`   Background: ${bodyStyles.backgroundColor}`);
  console.log(`   Text color: ${bodyStyles.color}`);
  console.log(`   Font: ${bodyStyles.fontFamily}\n`);

  // Try to click Edit Mode if it exists
  if (editModeExists) {
    console.log('🖱️  Testing Edit Mode button click...');
    await editModeButton.click();
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'C:\\Users\\Ben Meyers\\Documents\\Mek Tycoon\\TYCOON REACT 8-27\\mek-tycoon-react\\test-results\\dev-toolbar-02-edit-mode-clicked.png',
      fullPage: true
    });
    console.log('✅ Screenshot saved: test-results/dev-toolbar-02-edit-mode-clicked.png\n');
  }

  // Check for any toolbar items
  console.log('🔍 Looking for toolbar items...');
  const toolbarItems = await page.locator('[class*="toolbar"], [class*="tool-"], [data-testid*="tool"]').all();
  console.log(`   Found ${toolbarItems.length} toolbar-related elements\n`);

  // Print summary
  console.log('\n========================================');
  console.log('📊 INSPECTION SUMMARY');
  console.log('========================================\n');

  console.log(`✅ Page loaded successfully: YES`);
  console.log(`📄 Page title: "${title}"`);
  console.log(`🔘 Buttons found: ${toolbarButtons.length}`);
  console.log(`✏️  Edit Mode button: ${editModeExists ? 'YES' : 'NO'}`);
  console.log(`⏳ Loading state: ${isLoading ? 'YES (stuck?)' : 'NO'}`);
  console.log(`📝 Has content: ${hasContent ? 'YES' : 'NO'}`);
  console.log(`🎨 Background color: ${bodyStyles.backgroundColor}`);

  console.log(`\n🐛 Console Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    consoleErrors.forEach(err => console.log(`   ❌ ${err}`));
  }

  console.log(`\n⚠️  Console Warnings: ${consoleWarnings.length}`);
  if (consoleWarnings.length > 0 && consoleWarnings.length <= 5) {
    consoleWarnings.forEach(warn => console.log(`   ⚠️  ${warn}`));
  } else if (consoleWarnings.length > 5) {
    console.log(`   (${consoleWarnings.length} warnings - too many to display)`);
  }

  console.log(`\n💥 Page Errors: ${pageErrors.length}`);
  if (pageErrors.length > 0) {
    pageErrors.forEach(err => console.log(`   💥 ${err}`));
  }

  console.log(`\n🌐 Network Failures: ${networkFailures.length}`);
  if (networkFailures.length > 0) {
    networkFailures.forEach(fail => console.log(`   🌐 ${fail}`));
  }

  console.log('\n========================================');
  console.log('🏁 INSPECTION COMPLETE');
  console.log('========================================\n');

  // Final assertion - just to make the test pass/fail
  expect(hasContent).toBe(true);
});
