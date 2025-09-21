const { chromium } = require('playwright');

async function testCanvasClick() {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect console messages specifically for gold rewards
  const goldRewardMessages = [];
  const allMessages = [];

  page.on('console', msg => {
    const text = msg.text();
    allMessages.push(text);

    if (text.includes('Deployed mek data for gold reward:')) {
      console.log('\n🎯 GOLD REWARD LOG FOUND:');
      console.log(text);
      goldRewardMessages.push(text);
    }

    // Also capture click-related messages
    if (text.includes('Click handler called') || text.includes('selected node') || text.includes('node:')) {
      console.log('CLICK LOG:', text);
    }
  });

  try {
    console.log('Navigating to story-climb page...');
    await page.goto('http://localhost:3100/scrap-yard/story-climb');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // Wait longer for deployment to load

    // Take initial screenshot
    await page.screenshot({ path: 'story-climb-before-click.png', fullPage: true });

    // Look for the canvas element
    console.log('Looking for canvas element...');
    const canvas = await page.locator('canvas').first();
    const canvasExists = await canvas.count();
    console.log(`Found ${canvasExists} canvas elements`);

    if (canvasExists === 0) {
      console.log('No canvas found!');
      await page.waitForTimeout(5000);
      await browser.close();
      return;
    }

    // Get canvas dimensions and click on a spot where nodes might be
    const canvasBounds = await canvas.boundingBox();
    console.log('Canvas bounds:', canvasBounds);

    // Try clicking in different areas where nodes typically appear
    const clickPositions = [
      { x: canvasBounds.x + canvasBounds.width * 0.3, y: canvasBounds.y + canvasBounds.height * 0.7 }, // Lower left area
      { x: canvasBounds.x + canvasBounds.width * 0.5, y: canvasBounds.y + canvasBounds.height * 0.6 }, // Center area
      { x: canvasBounds.x + canvasBounds.width * 0.4, y: canvasBounds.y + canvasBounds.height * 0.5 }, // Mid-left area
      { x: canvasBounds.x + canvasBounds.width * 0.6, y: canvasBounds.y + canvasBounds.height * 0.4 }, // Upper right
      { x: canvasBounds.x + canvasBounds.width * 0.5, y: canvasBounds.y + canvasBounds.height * 0.8 }, // Start area
    ];

    for (let i = 0; i < clickPositions.length; i++) {
      const pos = clickPositions[i];
      console.log(`\nAttempting click ${i + 1} at position (${Math.round(pos.x)}, ${Math.round(pos.y)})...`);

      // Clear previous messages
      allMessages.length = 0;

      // Click at this position
      await page.mouse.click(pos.x, pos.y);
      await page.waitForTimeout(2000);

      // Check if we got the gold reward message
      if (goldRewardMessages.length > 0) {
        console.log('✅ SUCCESS! Found gold reward message');
        await page.screenshot({ path: `successful-click-${i + 1}.png` });
        break;
      } else {
        console.log(`Click ${i + 1} did not trigger gold reward log`);

        // Show other relevant messages
        const relevantMessages = allMessages.filter(msg =>
          msg.includes('Click') || msg.includes('node') || msg.includes('selected') || msg.includes('mek')
        );
        if (relevantMessages.length > 0) {
          console.log('Other relevant messages:');
          relevantMessages.forEach(msg => console.log('  ', msg));
        }
      }
    }

    // If we still haven't found it, try clicking near visible node-like elements
    if (goldRewardMessages.length === 0) {
      console.log('\nTrying JavaScript-based click detection...');

      await page.evaluate(() => {
        // Look at the canvas context to understand what's drawn
        const canvas = document.querySelector('canvas');
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          console.log('Canvas size:', rect.width, 'x', rect.height);

          // Try clicking in the middle area where nodes typically are
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            clientX: rect.left + rect.width * 0.5,
            clientY: rect.top + rect.height * 0.6
          });

          console.log('Dispatching synthetic click at:', rect.left + rect.width * 0.5, rect.top + rect.height * 0.6);
          canvas.dispatchEvent(clickEvent);
        }
      });

      await page.waitForTimeout(2000);
    }

    // Final report
    if (goldRewardMessages.length > 0) {
      console.log('\n✅ SUCCESS! Final gold reward messages:');
      goldRewardMessages.forEach((msg, i) => {
        console.log(`${i + 1}: ${msg}`);
      });
    } else {
      console.log('\n❌ No gold reward messages found');
      console.log('Last 10 console messages:');
      allMessages.slice(-10).forEach((msg, i) => {
        console.log(`${i + 1}: ${msg}`);
      });
    }

  } catch (error) {
    console.error('Test error:', error);
  }

  console.log('\nKeeping browser open for 15 seconds for manual inspection...');
  await page.waitForTimeout(15000);
  await browser.close();
}

testCanvasClick().catch(console.error);