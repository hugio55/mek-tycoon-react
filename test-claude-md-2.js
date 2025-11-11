const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const logs = [];

  // Listen for console messages
  page.on('console', msg => {
    const text = msg.text();
    logs.push(`[${msg.type()}] ${text}`);
    if (text.includes('📄CLAUDE') || text.includes('CLAUDE')) {
      console.log('🎯 FOUND:', text);
    }
  });

  // Navigate to the page
  console.log('Navigating to page...');
  await page.goto('http://localhost:3200/admin/claude-md-viewer');

  // Wait for component to mount
  console.log('Waiting for component...');
  await page.waitForTimeout(5000);

  // Check if component is visible
  const summaryExists = await page.locator('text=CLAUDE.md Summary').count();
  console.log('Summary header visible:', summaryExists > 0);

  // Check for sections count
  const totalSectionsText = await page.locator('text=Total Sections:').textContent().catch(() => null);
  console.log('Total Sections text:', totalSectionsText);

  // Get all console logs
  console.log('\n=== ALL CONSOLE LOGS ===');
  const claudeLogs = logs.filter(l => l.includes('📄CLAUDE'));
  console.log('CLAUDE logs found:', claudeLogs.length);
  claudeLogs.forEach(log => console.log(log));

  if (claudeLogs.length === 0) {
    console.log('\n⚠️  NO CLAUDE LOGS FOUND');
    console.log('Total logs:', logs.length);
    console.log('\nLast 10 logs:');
    logs.slice(-10).forEach(log => console.log(log));
  }

  await browser.close();
})();
