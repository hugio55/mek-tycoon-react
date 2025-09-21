const { chromium } = require('playwright');

async function testSpecificNodes() {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect console messages specifically for gold rewards
  const goldRewardMessages = [];
  page.on('console', msg => {
    const text = msg.text();

    if (text.includes('Deployed mek data for gold reward:')) {
      console.log('\n🎯 GOLD REWARD LOG FOUND:');
      console.log(text);
      goldRewardMessages.push(text);
    }
  });

  try {
    console.log('Navigating to story-climb page...');
    await page.goto('http://localhost:3100/scrap-yard/story-climb');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Wait for the content to load properly
    console.log('Waiting for story nodes to appear...');
    await page.waitForSelector('svg', { timeout: 10000 });

    // Take screenshot
    await page.screenshot({ path: 'before-node-click.png', fullPage: true });

    // Try to find clickable elements within the SVG (the circular nodes)
    console.log('Looking for clickable nodes in the tree...');

    // Look for circle elements or g elements that might be clickable
    const svgElements = await page.locator('svg circle, svg g[role="button"], svg g[onclick], svg g[data-node-id]').all();
    console.log(`Found ${svgElements.length} SVG elements`);

    if (svgElements.length === 0) {
      // Try alternative selectors for the nodes
      const alternativeSelectors = [
        'svg g',
        '[data-testid*="node"]',
        '[id*="node"]',
        '[class*="node"]',
        'circle'
      ];

      for (const selector of alternativeSelectors) {
        const elements = await page.locator(selector).all();
        if (elements.length > 0) {
          console.log(`Found ${elements.length} elements with selector: ${selector}`);
          svgElements.push(...elements.slice(0, 10)); // Add up to 10 elements
          break;
        }
      }
    }

    // Try clicking on various elements
    if (svgElements.length > 0) {
      for (let i = 0; i < Math.min(svgElements.length, 10); i++) {
        try {
          console.log(`\nAttempting to click element ${i + 1}...`);

          // Force click to avoid intercepted events
          await svgElements[i].click({ force: true });
          await page.waitForTimeout(1000);

          if (goldRewardMessages.length > 0) {
            console.log('✅ Found gold reward message!');
            break;
          }

        } catch (error) {
          console.log(`Error clicking element ${i + 1}: ${error.message}`);
        }
      }
    }

    // If no SVG elements worked, try JavaScript evaluation to click nodes
    if (goldRewardMessages.length === 0) {
      console.log('\nTrying JavaScript click on nodes...');

      await page.evaluate(() => {
        // Look for any elements that might be nodes
        const possibleNodes = document.querySelectorAll('circle, [data-node-id], .story-node, .node');
        console.log(`Found ${possibleNodes.length} possible nodes via JS`);

        for (let i = 0; i < possibleNodes.length; i++) {
          const node = possibleNodes[i];

          // Try to get text content to avoid event nodes
          const text = node.textContent || node.getAttribute('data-text') || '';
          if (text.includes('E') && text.length < 5) {
            console.log(`Skipping event node: ${text}`);
            continue;
          }

          console.log(`JS clicking node ${i + 1}...`);

          // Try clicking the node
          if (node.click) {
            node.click();
          } else if (node.dispatchEvent) {
            node.dispatchEvent(new Event('click', { bubbles: true }));
          }

          // Give it a moment
          break; // Just try the first valid node
        }
      });

      await page.waitForTimeout(2000);
    }

    // Check if we got any gold reward messages
    if (goldRewardMessages.length > 0) {
      console.log('\n✅ SUCCESS! Gold reward messages captured:');
      goldRewardMessages.forEach((msg, i) => {
        console.log(`${i + 1}: ${msg}`);
      });

      // Take a screenshot of the successful state
      await page.screenshot({ path: 'successful-gold-reward.png' });

    } else {
      console.log('\n❌ No gold reward messages found');

      // Let's examine the page structure to understand what's available
      const pageStructure = await page.evaluate(() => {
        const svg = document.querySelector('svg');
        if (svg) {
          const circles = svg.querySelectorAll('circle');
          const groups = svg.querySelectorAll('g');
          return {
            svgExists: true,
            circleCount: circles.length,
            groupCount: groups.length,
            hasClickHandlers: Array.from(groups).some(g => g.onclick || g.getAttribute('onclick'))
          };
        }
        return { svgExists: false };
      });

      console.log('Page structure analysis:', pageStructure);
    }

  } catch (error) {
    console.error('Test error:', error);
  }

  console.log('\nKeeping browser open for 10 seconds for manual inspection...');
  await page.waitForTimeout(10000);
  await browser.close();
}

testSpecificNodes().catch(console.error);