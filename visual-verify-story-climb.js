const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function verifyStoryClimbLayout() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  try {
    const page = await browser.newPage();
    
    // Listen for console messages
    page.on('console', (msg) => {
      console.log('Browser Console:', msg.type(), msg.text());
    });
    
    // Listen for errors
    page.on('error', (err) => {
      console.error('Browser Error:', err.message);
    });
    
    console.log('Navigating to Story Climb page...');
    await page.goto('http://localhost:3200/scrap-yard/story-climb', { 
      waitUntil: 'domcontentloaded', 
      timeout: 20000 
    });
    
    // Wait for React to load and canvas to render
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Take initial screenshot
    console.log('Taking initial screenshot...');
    await page.screenshot({ 
      path: 'story-climb-verification.png', 
      fullPage: true 
    });
    
    // Check grid container dimensions
    const gridInfo = await page.evaluate(() => {
      const gridContainer = document.querySelector('[style*="aspect-ratio"], .bg-black\\/60, canvas');
      if (!gridContainer) return { error: 'No grid container found' };
      
      const rect = gridContainer.getBoundingClientRect();
      const styles = window.getComputedStyle(gridContainer);
      
      return {
        width: rect.width,
        height: rect.height,
        aspectRatio: rect.width / rect.height,
        computedAspectRatio: styles.aspectRatio,
        className: gridContainer.className,
        id: gridContainer.id
      };
    });
    
    console.log('Grid Container Info:', gridInfo);
    
    // Check for start node (green circle)
    const startNodeInfo = await page.evaluate(() => {
      // Look for start node patterns
      const possibleStartNodes = [
        ...document.querySelectorAll('[class*="start"], [class*="green"], [data-node="start"]'),
        ...document.querySelectorAll('circle[fill*="green"], [style*="background"][style*="green"]'),
        ...document.querySelectorAll('.node:first-child, [data-tier="0"]')
      ];
      
      if (possibleStartNodes.length === 0) {
        return { error: 'No start node found' };
      }
      
      const startNode = possibleStartNodes[0];
      const rect = startNode.getBoundingClientRect();
      
      return {
        found: true,
        position: { x: rect.left, y: rect.top },
        size: { width: rect.width, height: rect.height },
        className: startNode.className,
        tagName: startNode.tagName
      };
    });
    
    console.log('Start Node Info:', startNodeInfo);
    
    // Check tree layout and node visibility
    const treeLayoutInfo = await page.evaluate(() => {
      const allNodes = document.querySelectorAll('[class*="node"], circle, [data-tier]');
      if (allNodes.length === 0) return { error: 'No nodes found' };
      
      let leftmost = Infinity, rightmost = -Infinity, topmost = Infinity, bottommost = -Infinity;
      const nodePositions = [];
      
      allNodes.forEach((node, index) => {
        const rect = node.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) { // Only count visible nodes
          leftmost = Math.min(leftmost, rect.left);
          rightmost = Math.max(rightmost, rect.right);
          topmost = Math.min(topmost, rect.top);
          bottommost = Math.max(bottommost, rect.bottom);
          
          nodePositions.push({
            index,
            x: rect.left,
            y: rect.top,
            className: node.className,
            visible: true
          });
        }
      });
      
      return {
        totalNodes: allNodes.length,
        visibleNodes: nodePositions.length,
        bounds: { leftmost, rightmost, topmost, bottommost },
        treeWidth: rightmost - leftmost,
        treeHeight: bottommost - topmost,
        nodePositions: nodePositions.slice(0, 10) // First 10 for brevity
      };
    });
    
    console.log('Tree Layout Info:', treeLayoutInfo);
    
    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      url: 'http://localhost:3200/scrap-yard/story-climb',
      gridContainer: gridInfo,
      startNode: startNodeInfo,
      treeLayout: treeLayoutInfo,
      verification: {
        aspectRatio23: gridInfo.aspectRatio ? (gridInfo.aspectRatio >= 1.3 && gridInfo.aspectRatio <= 1.4) : false,
        startNodeVisible: !startNodeInfo.error,
        nodesVisible: treeLayoutInfo.visibleNodes > 0,
        treeSpansHorizontally: treeLayoutInfo.treeWidth > treeLayoutInfo.treeHeight
      }
    };
    
    // Save report
    fs.writeFileSync('story-climb-verification-report.json', JSON.stringify(report, null, 2));
    
    console.log('\n=== STORY CLIMB VERIFICATION RESULTS ===');
    console.log(`✅ Grid aspect ratio (2:3 target): ${report.verification.aspectRatio23 ? 'PASS' : 'FAIL'} (Actual: ${gridInfo.aspectRatio?.toFixed(2)})`);
    console.log(`✅ Start node visible: ${report.verification.startNodeVisible ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Nodes visible: ${report.verification.nodesVisible ? 'PASS' : 'FAIL'} (${treeLayoutInfo.visibleNodes} nodes)`);
    console.log(`✅ Tree spans horizontally: ${report.verification.treeSpansHorizontally ? 'PASS' : 'FAIL'} (W: ${treeLayoutInfo.treeWidth}px, H: ${treeLayoutInfo.treeHeight}px)`);
    console.log('\nScreenshot saved as: story-climb-verification.png');
    console.log('Full report saved as: story-climb-verification-report.json');
    
  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    await browser.close();
  }
}

verifyStoryClimbLayout().catch(console.error);