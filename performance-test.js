const { chromium } = require('playwright');
const path = require('path');

async function performanceTest() {
  console.log('🚀 Starting Performance Test for mek-rate-logging...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable performance monitoring
  await page.coverage.startJSCoverage();
  await page.coverage.startCSSCoverage();

  const metrics = [];
  const consoleLogs = [];
  const performanceWarnings = [];

  // Capture console messages
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push({ type: msg.type(), text });
    if (msg.type() === 'warning' || msg.type() === 'error') {
      performanceWarnings.push(text);
    }
  });

  try {
    console.log('📍 Navigating to http://localhost:3100/mek-rate-logging...');
    await page.goto('http://localhost:3100/mek-rate-logging', { waitUntil: 'networkidle' });

    // Take initial screenshot
    console.log('📸 Taking initial screenshot...');
    await page.screenshot({ path: 'performance-test-initial.png', fullPage: true });

    // Get initial metrics
    const initialMetrics = await page.evaluate(() => ({
      memory: performance.memory ? {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      } : null,
      timing: performance.timing.loadEventEnd - performance.timing.navigationStart
    }));

    console.log('\n📊 Initial Metrics:');
    console.log('   Load Time:', initialMetrics.timing, 'ms');
    if (initialMetrics.memory) {
      console.log('   Memory Used:', (initialMetrics.memory.usedJSHeapSize / 1048576).toFixed(2), 'MB');
    }

    // Wait for content to load
    await page.waitForTimeout(2000);

    // Test 1: Scroll Performance
    console.log('\n🔄 TEST 1: Scroll Performance');
    const scrollMetrics = await page.evaluate(async () => {
      const scrollResults = { frames: [], jankCount: 0, droppedFrames: 0 };
      let lastFrameTime = performance.now();
      let frameCount = 0;

      const measureFrame = () => {
        const now = performance.now();
        const frameDuration = now - lastFrameTime;
        scrollResults.frames.push(frameDuration);

        // Frame took longer than 16.67ms (60fps) + buffer
        if (frameDuration > 20) {
          scrollResults.jankCount++;
        }
        if (frameDuration > 33) { // More than 2 frames worth
          scrollResults.droppedFrames++;
        }

        lastFrameTime = now;
        frameCount++;
      };

      // Scroll down slowly
      const scrollContainer = document.scrollingElement || document.documentElement;
      const scrollHeight = scrollContainer.scrollHeight;
      const step = scrollHeight / 100;

      for (let i = 0; i < 100; i++) {
        window.scrollTo(0, step * i);
        measureFrame();
        await new Promise(resolve => setTimeout(resolve, 16));
      }

      // Scroll back up
      for (let i = 100; i >= 0; i--) {
        window.scrollTo(0, step * i);
        measureFrame();
        await new Promise(resolve => setTimeout(resolve, 16));
      }

      const avgFrameTime = scrollResults.frames.reduce((a, b) => a + b, 0) / scrollResults.frames.length;
      const maxFrameTime = Math.max(...scrollResults.frames);
      const minFrameTime = Math.min(...scrollResults.frames);

      return {
        avgFPS: 1000 / avgFrameTime,
        avgFrameTime,
        maxFrameTime,
        minFrameTime,
        jankCount: scrollResults.jankCount,
        droppedFrames: scrollResults.droppedFrames,
        totalFrames: frameCount
      };
    });

    console.log('   Average FPS:', scrollMetrics.avgFPS.toFixed(2));
    console.log('   Avg Frame Time:', scrollMetrics.avgFrameTime.toFixed(2), 'ms');
    console.log('   Max Frame Time:', scrollMetrics.maxFrameTime.toFixed(2), 'ms');
    console.log('   Jank Events:', scrollMetrics.jankCount, '/', scrollMetrics.totalFrames);
    console.log('   Dropped Frames:', scrollMetrics.droppedFrames);

    await page.screenshot({ path: 'performance-test-scrolled.png', fullPage: true });

    // Test 2: Item Count and Rendering
    console.log('\n📦 TEST 2: Item Count and Rendering');
    const itemMetrics = await page.evaluate(() => {
      const items = document.querySelectorAll('[data-mek-item], .mek-card, .border');
      const images = document.querySelectorAll('img');
      return {
        totalItems: items.length,
        totalImages: images.length
      };
    });
    console.log('   Total Items Rendered:', itemMetrics.totalItems);
    console.log('   Total Images:', itemMetrics.totalImages);

    // Test 3: Network Analysis
    console.log('\n🌐 TEST 3: Network Analysis');
    const client = await page.context().newCDPSession(page);
    await client.send('Network.enable');

    const networkRequests = [];
    client.on('Network.requestWillBeSent', request => {
      networkRequests.push({
        url: request.request.url,
        type: request.type
      });
    });

    // Trigger some interactions
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(1000);
    await page.mouse.wheel(0, -500);
    await page.waitForTimeout(1000);

    console.log('   Network Requests During Test:', networkRequests.length);
    const imageRequests = networkRequests.filter(r => r.type === 'Image');
    console.log('   Image Requests:', imageRequests.length);

    // Test 4: Memory Usage After Extended Use
    console.log('\n💾 TEST 4: Memory Usage After Extended Use');

    // Simulate extended use with rapid scrolling
    await page.evaluate(async () => {
      for (let cycle = 0; cycle < 5; cycle++) {
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise(resolve => setTimeout(resolve, 200));
        window.scrollTo(0, 0);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    });

    const finalMetrics = await page.evaluate(() => ({
      memory: performance.memory ? {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      } : null
    }));

    if (finalMetrics.memory && initialMetrics.memory) {
      const memoryGrowth = finalMetrics.memory.usedJSHeapSize - initialMetrics.memory.usedJSHeapSize;
      console.log('   Initial Memory:', (initialMetrics.memory.usedJSHeapSize / 1048576).toFixed(2), 'MB');
      console.log('   Final Memory:', (finalMetrics.memory.usedJSHeapSize / 1048576).toFixed(2), 'MB');
      console.log('   Memory Growth:', (memoryGrowth / 1048576).toFixed(2), 'MB');
      console.log('   Memory Usage:', ((finalMetrics.memory.usedJSHeapSize / finalMetrics.memory.jsHeapSizeLimit) * 100).toFixed(2), '%');
    }

    await page.screenshot({ path: 'performance-test-final.png', fullPage: true });

    // Test 5: Console Warnings and Errors
    console.log('\n⚠️  TEST 5: Console Analysis');
    const errors = consoleLogs.filter(l => l.type === 'error');
    const warnings = consoleLogs.filter(l => l.type === 'warning');

    console.log('   Total Console Messages:', consoleLogs.length);
    console.log('   Errors:', errors.length);
    console.log('   Warnings:', warnings.length);

    if (errors.length > 0) {
      console.log('\n   Error Messages:');
      errors.forEach(e => console.log('   -', e.text));
    }

    if (warnings.length > 0) {
      console.log('\n   Warning Messages:');
      warnings.forEach(w => console.log('   -', w.text));
    }

    // Coverage analysis
    const jsCoverage = await page.coverage.stopJSCoverage();
    const cssCoverage = await page.coverage.stopCSSCoverage();

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 PERFORMANCE TEST SUMMARY');
    console.log('='.repeat(60));

    console.log('\n✅ GOOD:');
    if (scrollMetrics.avgFPS >= 55) console.log('   - Smooth scrolling (>55 FPS)');
    if (scrollMetrics.jankCount < scrollMetrics.totalFrames * 0.1) console.log('   - Low jank rate (<10%)');
    if (errors.length === 0) console.log('   - No console errors');

    console.log('\n❌ ISSUES:');
    if (scrollMetrics.avgFPS < 55) {
      console.log('   - LOW FPS:', scrollMetrics.avgFPS.toFixed(2), '(target: 60)');
    }
    if (scrollMetrics.jankCount > scrollMetrics.totalFrames * 0.1) {
      console.log('   - HIGH JANK RATE:', ((scrollMetrics.jankCount / scrollMetrics.totalFrames) * 100).toFixed(2), '%');
    }
    if (scrollMetrics.droppedFrames > 0) {
      console.log('   - DROPPED FRAMES:', scrollMetrics.droppedFrames);
    }
    if (errors.length > 0) {
      console.log('   - CONSOLE ERRORS:', errors.length);
    }
    if (finalMetrics.memory && initialMetrics.memory) {
      const memoryGrowth = finalMetrics.memory.usedJSHeapSize - initialMetrics.memory.usedJSHeapSize;
      if (memoryGrowth > 10485760) { // 10MB
        console.log('   - SIGNIFICANT MEMORY GROWTH:', (memoryGrowth / 1048576).toFixed(2), 'MB');
      }
    }

    console.log('\n📸 Screenshots saved:');
    console.log('   - performance-test-initial.png');
    console.log('   - performance-test-scrolled.png');
    console.log('   - performance-test-final.png');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

performanceTest().catch(console.error);
