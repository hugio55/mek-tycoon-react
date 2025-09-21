const { chromium } = require('playwright');

async function testMekNodeClick() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect all console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(text);

    // Print gold reward messages immediately
    if (text.includes('Deployed mek data for gold reward:')) {
      console.log('\n🎯 FOUND GOLD REWARD LOG:');
      console.log(text);
      console.log('---');
    }
  });

  try {
    console.log('Navigating to story-climb page...');
    await page.goto('http://localhost:3100/scrap-yard/story-climb');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('Looking for nodes...');

    // Take a screenshot to see what's on the page
    await page.screenshot({ path: 'story-climb-nodes.png', fullPage: true });

    // Look for various node selectors
    const possibleNodeSelectors = [
      '.story-node',
      '[data-node-id]',
      '.node',
      '.challenger-node',
      '.normal-node',
      '.mek-node',
      'div[onclick*="click"]',
      'button',
      '.clickable'
    ];

    let foundNodes = [];

    for (const selector of possibleNodeSelectors) {
      try {
        const nodes = await page.locator(selector).all();
        if (nodes.length > 0) {
          console.log(`Found ${nodes.length} nodes with selector: ${selector}`);
          foundNodes.push({selector, count: nodes.length, nodes});
        }
      } catch (e) {
        // Selector not found, continue
      }
    }

    if (foundNodes.length === 0) {
      console.log('No nodes found with any selector. Taking screenshot and examining page structure...');

      // Get page content to understand structure
      const bodyText = await page.locator('body').textContent();
      console.log('Page text content (first 500 chars):', bodyText.slice(0, 500));

      // Look for any clickable elements
      const clickables = await page.locator('*[onclick], button, [role="button"]').all();
      console.log(`Found ${clickables.length} potentially clickable elements`);

      await page.waitForTimeout(5000);
      await browser.close();
      return;
    }

    // Try to find normal mek nodes (not event nodes)
    for (const nodeGroup of foundNodes) {
      console.log(`\nTesting nodes with selector: ${nodeGroup.selector}`);

      for (let i = 0; i < Math.min(nodeGroup.nodes.length, 5); i++) {
        const node = nodeGroup.nodes[i];

        try {
          const nodeText = await node.textContent();
          console.log(`Node ${i + 1} text: "${nodeText}"`);

          // Skip nodes that have "E" in them (event nodes)
          if (nodeText && nodeText.includes('E') && nodeText.length < 10) {
            console.log(`Skipping event node: ${nodeText}`);
            continue;
          }

          console.log(`Clicking node ${i + 1}...`);

          // Clear console messages before click
          consoleMessages.length = 0;

          await node.click();
          await page.waitForTimeout(1000);

          // Check for the specific log message
          const goldRewardLogs = consoleMessages.filter(msg =>
            msg.includes('Deployed mek data for gold reward:')
          );

          if (goldRewardLogs.length > 0) {
            console.log('\n✅ SUCCESS! Found gold reward log:');
            goldRewardLogs.forEach(log => console.log(log));

            // Take screenshot after successful click
            await page.screenshot({ path: 'successful-mek-click.png' });

            await page.waitForTimeout(2000);
            await browser.close();
            return;
          } else {
            console.log('No gold reward log found after this click');
          }

        } catch (error) {
          console.log(`Error clicking node ${i + 1}:`, error.message);
        }
      }
    }

    console.log('\nNo gold reward logs found. All console messages:');
    const relevantLogs = consoleMessages.filter(msg =>
      msg.includes('mek') || msg.includes('gold') || msg.includes('reward') || msg.includes('Deployed')
    );
    relevantLogs.forEach((msg, i) => console.log(`${i + 1}: ${msg}`));

  } catch (error) {
    console.error('Error during test:', error);
  }

  await page.waitForTimeout(5000);
  await browser.close();
}

testMekNodeClick().catch(console.error);