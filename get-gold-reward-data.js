const { chromium } = require('playwright');

async function getGoldRewardData() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();

  let goldRewardData = null;

  page.on('console', msg => {
    const text = msg.text();

    if (text.includes('Deployed mek data for gold reward:')) {
      console.log('\n=== FOUND THE GOLD REWARD DATA ===');
      console.log(text);
      goldRewardData = text;

      // Try to extract just the object part
      const match = text.match(/Deployed mek data for gold reward:\s*(.+)/);
      if (match) {
        console.log('\nExtracted data:');
        console.log(match[1]);
      }
    }
  });

  try {
    console.log('Navigating to story-climb page...');
    await page.goto('http://localhost:3100/scrap-yard/story-climb');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('Looking for canvas and attempting strategic clicks...');

    // Get the canvas
    const canvas = await page.locator('canvas').first();
    const canvasBounds = await canvas.boundingBox();

    // Try clicking on several strategic positions where normal mek nodes might be
    const strategicClicks = [
      // Based on the screenshot, try clicking in the circular node areas
      { x: canvasBounds.x + canvasBounds.width * 0.35, y: canvasBounds.y + canvasBounds.height * 0.45, desc: "Upper left area" },
      { x: canvasBounds.x + canvasBounds.width * 0.65, y: canvasBounds.y + canvasBounds.height * 0.45, desc: "Upper right area" },
      { x: canvasBounds.x + canvasBounds.width * 0.3, y: canvasBounds.y + canvasBounds.height * 0.6, desc: "Mid left area" },
      { x: canvasBounds.x + canvasBounds.width * 0.7, y: canvasBounds.y + canvasBounds.height * 0.6, desc: "Mid right area" },
      { x: canvasBounds.x + canvasBounds.width * 0.45, y: canvasBounds.y + canvasBounds.height * 0.35, desc: "Upper center" },
    ];

    for (let i = 0; i < strategicClicks.length && !goldRewardData; i++) {
      const click = strategicClicks[i];
      console.log(`\nTrying click ${i + 1}: ${click.desc} at (${Math.round(click.x)}, ${Math.round(click.y)})`);

      await page.mouse.click(click.x, click.y);
      await page.waitForTimeout(1500);

      if (goldRewardData) {
        console.log(`✅ Success with click ${i + 1}!`);
        break;
      }
    }

    if (!goldRewardData) {
      console.log('\nNo gold reward data found with strategic clicks. Trying more positions...');

      // Try a grid of positions across the tree area
      for (let x = 0.2; x <= 0.8 && !goldRewardData; x += 0.15) {
        for (let y = 0.3; y <= 0.7 && !goldRewardData; y += 0.1) {
          const clickX = canvasBounds.x + canvasBounds.width * x;
          const clickY = canvasBounds.y + canvasBounds.height * y;

          console.log(`Grid click at (${Math.round(clickX)}, ${Math.round(clickY)})`);
          await page.mouse.click(clickX, clickY);
          await page.waitForTimeout(500);
        }
      }
    }

    // Final result
    if (goldRewardData) {
      console.log('\n🎯 FINAL RESULT - Gold Reward Data Found:');
      console.log('='.repeat(60));
      console.log(goldRewardData);
      console.log('='.repeat(60));
    } else {
      console.log('\n❌ No gold reward data was captured');
    }

  } catch (error) {
    console.error('Error:', error);
  }

  await page.waitForTimeout(3000);
  await browser.close();

  return goldRewardData;
}

getGoldRewardData().then(result => {
  if (result) {
    console.log('\n✅ Script completed successfully!');
    console.log('Gold reward data was captured and logged above.');
  } else {
    console.log('\n❌ Script completed but no gold reward data was found.');
  }
}).catch(console.error);