import { test, expect } from '@playwright/test';

test('WebGL diagnostic - check rendering pipeline', async ({ page }) => {
  const consoleLogs: string[] = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
    if (text.includes('[⭐')) {
      console.log(text);
    }
  });

  await page.goto('http://localhost:3200/landing');
  await page.waitForTimeout(3000);

  // Inject diagnostic code to check WebGL state
  const diagnostics = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return { error: 'No canvas found' };

    // Check container opacity
    const container = canvas.parentElement;
    const containerStyle = container ? window.getComputedStyle(container) : null;

    const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
    if (!gl) return { error: 'No WebGL context' };

    return {
      canvasSize: { width: canvas.width, height: canvas.height },
      containerOpacity: containerStyle?.opacity || 'unknown',
      containerDisplay: containerStyle?.display || 'unknown',
      containerVisibility: containerStyle?.visibility || 'unknown',
      viewport: gl.getParameter(gl.VIEWPORT),
      clearColor: gl.getParameter(gl.COLOR_CLEAR_VALUE),
      blend: gl.isEnabled(gl.BLEND),
      depthTest: gl.isEnabled(gl.DEPTH_TEST),
      blendFunc: {
        src: gl.getParameter(gl.BLEND_SRC_RGB),
        dst: gl.getParameter(gl.BLEND_DST_RGB),
      },
      // Try to access THREE.js scene if available
      hasThreeJS: typeof (window as any).THREE !== 'undefined',
    };
  });

  console.log('WebGL Diagnostics:', JSON.stringify(diagnostics, null, 2));

  // Check console logs for star creation
  const starCreationLog = consoleLogs.find(log => log.includes('[⭐BG-STARS] Sample star data'));
  if (starCreationLog) {
    console.log('Star creation log found:', starCreationLog);
  }

  // Check if particleCount is in logs
  const animationLogs = consoleLogs.filter(log => log.includes('[⭐BG-STARS] Animation frame'));
  console.log(`Found ${animationLogs.length} animation frame logs`);
  if (animationLogs.length > 0) {
    console.log('Latest animation log:', animationLogs[animationLogs.length - 1]);
  }
});
