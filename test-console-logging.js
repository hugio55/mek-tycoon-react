const { chromium } = require('playwright');

async function testStoryClimbConsole() {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen for console logs
  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    console.log('CONSOLE:', text);
    consoleMessages.push(text);
  });

  try {
    console.log('Navigating to story-climb page...');
    await page.goto('http://localhost:3100/scrap-yard/story-climb');

    console.log('Waiting for page to load...');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('Taking initial screenshot...');
    await page.screenshot({ path: 'story-climb-initial.png', fullPage: true });

    console.log('Looking for normal mek nodes (not event nodes)...');
    // Look for nodes that don't have the "E" label
    const normalNodes = await page.locator('.story-node').filter({ hasNotText: 'E' }).all();
    console.log(`Found ${normalNodes.length} potential normal nodes`);

    if (normalNodes.length > 0) {
      console.log('Clicking on the first normal mek node...');
      await normalNodes[0].click();

      // Wait a bit for any console logs to appear
      await page.waitForTimeout(2000);

      console.log('Taking screenshot after click...');
      await page.screenshot({ path: 'story-climb-after-click.png', fullPage: true });

      // Look specifically for the gold reward log
      const goldRewardLogs = consoleMessages.filter(msg => msg.includes('Deployed mek data for gold reward:'));

      if (goldRewardLogs.length > 0) {
        console.log('\n=== GOLD REWARD LOG FOUND ===');
        goldRewardLogs.forEach(log => {
          console.log('LOG:', log);
        });
      } else {
        console.log('\n=== NO GOLD REWARD LOGS FOUND ===');
        console.log('All console messages captured:');
        consoleMessages.forEach((msg, i) => {
          console.log(`${i + 1}: ${msg}`);
        });
      }
    } else {
      console.log('No normal mek nodes found. Taking screenshot of current state...');
      await page.screenshot({ path: 'story-climb-no-nodes.png', fullPage: true });

      // Let's also check what nodes are available
      const allNodes = await page.locator('.story-node').all();
      console.log(`Total nodes found: ${allNodes.length}`);

      for (let i = 0; i < Math.min(allNodes.length, 5); i++) {
        const nodeText = await allNodes[i].textContent();
        console.log(`Node ${i + 1}: "${nodeText}"`);
      }
    }

  } catch (error) {
    console.error('Error during test:', error);
    await page.screenshot({ path: 'story-climb-error.png', fullPage: true });
  }

  console.log('Keeping browser open for 10 seconds for manual inspection...');
  await page.waitForTimeout(10000);

  await browser.close();
}

testStoryClimbConsole().catch(console.error);