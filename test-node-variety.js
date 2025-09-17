// Test to verify that different nodes show different mek data
// Run this in the browser console on the Story Climb page

console.log('=== NODE VARIETY TEST ===');

// Function to simulate clicking a node at specific coordinates
async function clickNodeAt(x, y) {
  const canvas = document.querySelector('canvas');
  if (!canvas) {
    console.error('Canvas not found');
    return null;
  }

  // Create and dispatch click event
  const event = new MouseEvent('click', {
    clientX: canvas.getBoundingClientRect().left + x,
    clientY: canvas.getBoundingClientRect().top + y,
    bubbles: true,
    cancelable: true
  });

  canvas.dispatchEvent(event);

  // Wait for UI to update
  await new Promise(resolve => setTimeout(resolve, 500));

  // Extract debug info from the DOM
  const debugPanel = document.querySelector('.bg-black\\/90.backdrop-blur-sm.p-3');
  if (debugPanel) {
    const text = debugPanel.innerText;
    const assetMatch = text.match(/Asset ID: #(\d+)/);
    const rankMatch = text.match(/Rank: (\d+)/);
    const goldMatch = text.match(/Gold: ([\d,]+)/);
    const xpMatch = text.match(/XP: ([\d,]+)/);

    if (assetMatch && rankMatch) {
      return {
        assetId: assetMatch[1],
        rank: parseInt(rankMatch[1]),
        gold: goldMatch ? goldMatch[1] : 'N/A',
        xp: xpMatch ? xpMatch[1] : 'N/A'
      };
    }
  }

  return null;
}

// Test clicking different nodes
async function testNodeVariety() {
  console.log('Testing node variety by clicking different positions...\n');

  // Test positions - different areas of the tree
  const testPositions = [
    { x: 300, y: 800, name: 'Bottom center node' },
    { x: 200, y: 700, name: 'Mid-left node' },
    { x: 400, y: 700, name: 'Mid-right node' },
    { x: 300, y: 600, name: 'Upper-mid node' },
    { x: 250, y: 500, name: 'Upper-left node' }
  ];

  const results = [];

  for (const pos of testPositions) {
    console.log(`Clicking ${pos.name} at (${pos.x}, ${pos.y})...`);
    const mekData = await clickNodeAt(pos.x, pos.y);

    if (mekData) {
      results.push({ ...pos, ...mekData });
      console.log(`  Found: Asset #${mekData.assetId}, Rank ${mekData.rank}`);
    } else {
      console.log(`  No data found (might not be a node at this position)`);
    }
  }

  // Analyze results
  console.log('\n=== RESULTS ANALYSIS ===');
  console.log(`Tested ${results.length} nodes`);

  if (results.length > 0) {
    // Check for duplicates
    const assetIds = results.map(r => r.assetId);
    const uniqueAssets = new Set(assetIds);

    console.log(`Unique Asset IDs: ${uniqueAssets.size}`);
    console.log(`Duplicate Asset IDs: ${assetIds.length - uniqueAssets.size}`);

    // Show all results
    console.log('\nDetailed Results:');
    results.forEach(r => {
      console.log(`  ${r.name}: Asset #${r.assetId}, Rank ${r.rank}, Gold ${r.gold}, XP ${r.xp}`);
    });

    // Check if all are the same (the bug we're fixing)
    if (uniqueAssets.size === 1) {
      console.error('\n❌ FAIL: All nodes show the same mek data!');
      console.error('This indicates the pipeline bug is still present.');
    } else if (uniqueAssets.size < results.length) {
      console.warn('\n⚠️ WARNING: Some nodes show duplicate mek data');
      console.warn('This may be expected if nodes are at exact same positions.');
    } else {
      console.log('\n✅ PASS: All nodes show different mek data!');
      console.log('The pipeline is working correctly.');
    }
  }
}

// Run the test
console.log('Starting test in 2 seconds...');
console.log('Make sure debug mode is enabled (press D key)');
setTimeout(testNodeVariety, 2000);