const { chromium } = require('playwright');

async function testUniChipsPageSimple() {
  console.log('Starting uni-chips page visual verification...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Collect console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const level = msg.type();
    if (level === 'error' || level === 'warning') {
      consoleMessages.push(`${level.toUpperCase()}: ${msg.text()}`);
    }
  });

  try {
    console.log('1. Navigating to uni-chips page...');
    await page.goto('http://localhost:3100/uni-chips', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('2. Taking full page screenshot...');
    await page.screenshot({ 
      path: 'uni-chips-page.png', 
      fullPage: true 
    });
    
    console.log('3. Checking page content...');
    
    // Check title
    const title = await page.locator('h1, .text-4xl, [class*="title"]').first().textContent().catch(() => null);
    console.log(`   Page title: ${title || 'Not found'}`);
    
    // Count chips
    const chipImages = await page.locator('img[src*="chip"]').count();
    console.log(`   Chip images found: ${chipImages}`);
    
    // Check grid layout
    const hasGrid = await page.locator('.grid-cols-5, .grid-cols-2, [class*="grid"]').count();
    console.log(`   Grid containers found: ${hasGrid}`);
    
    // Check recipe cards
    const recipeElements = await page.locator('[class*="recipe"], .recipe-card, [data-testid*="recipe"]').count();
    console.log(`   Recipe-related elements: ${recipeElements}`);
    
    // Check buttons
    const buttons = await page.locator('button').count();
    console.log(`   Buttons found: ${buttons}`);
    
    console.log('4. Taking viewport screenshot...');
    await page.screenshot({ 
      path: 'uni-chips-viewport.png',
      clip: { x: 0, y: 0, width: 1920, height: 1080 }
    });
    
    console.log('5. Checking visual elements...');
    
    // Check for yellow/gold styling
    const styledElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      let yellowCount = 0;
      let glowCount = 0;
      
      elements.forEach(el => {
        const styles = window.getComputedStyle(el);
        const classes = el.className;
        
        if (styles.color.includes('255, 193') || classes.includes('yellow') || classes.includes('gold')) {
          yellowCount++;
        }
        
        if (styles.boxShadow.includes('glow') || classes.includes('glow')) {
          glowCount++;
        }
      });
      
      return { yellowCount, glowCount };
    });
    
    console.log(`   Elements with yellow/gold styling: ${styledElements.yellowCount}`);
    console.log(`   Elements with glow effects: ${styledElements.glowCount}`);
    
    console.log('6. Waiting for any delayed elements...');
    await page.waitForTimeout(3000);
    
    console.log('7. Final screenshot after delay...');
    await page.screenshot({ 
      path: 'uni-chips-final.png', 
      fullPage: true 
    });
    
    // Report console messages
    if (consoleMessages.length > 0) {
      console.log('8. Console Messages:');
      consoleMessages.forEach(msg => console.log(`   ${msg}`));
    } else {
      console.log('8. ✓ No console errors or warnings detected');
    }
    
    console.log('\n✓ Uni-chips page verification completed!');
    console.log('Screenshots saved:');
    console.log('  - uni-chips-page.png (full page)');
    console.log('  - uni-chips-viewport.png (viewport)');
    console.log('  - uni-chips-final.png (final state)');
    
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    
    // Try to take an error screenshot
    try {
      await page.screenshot({ path: 'uni-chips-error.png', fullPage: true });
      console.log('Error screenshot saved as uni-chips-error.png');
    } catch (screenshotError) {
      console.log('Could not take error screenshot');
    }
  } finally {
    await browser.close();
  }
}

testUniChipsPageSimple();