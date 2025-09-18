// Test script to verify event data pipeline is working correctly
// Run this in the browser console on the Story Climb page

console.log('=== Event Data Pipeline Test ===');

// Test 1: Check if deployed event data is being loaded
const deployedEventNodes = window.deployedEventNodes || new Map();
console.log('1. Deployed Event Nodes Count:', deployedEventNodes.size);
console.log('   Available Keys:', Array.from(deployedEventNodes.keys()));

// Test 2: Check specific event node E1
const testKeys = ['E1', '1', 'event_1', 1];
console.log('\n2. Testing lookup for Event E1:');
for (const key of testKeys) {
  const data = deployedEventNodes.get(key);
  if (data) {
    console.log(`   ✓ Found with key "${key}":`, {
      name: data.name,
      image: data.image,
      goldReward: data.goldReward,
      xpReward: data.xpReward
    });
    break;
  } else {
    console.log(`   ✗ Not found with key "${key}"`);
  }
}

// Test 3: Check if getEventDataForNode function works
console.log('\n3. Testing getEventDataForNode function:');
const testNode = {
  id: 'ch1_node_1757450991650_3g9r9g8fh',
  label: 'E1',
  storyNodeType: 'event'
};

// This would need to be called from within the component context
console.log('   Test node:', testNode);
console.log('   Note: Run getEventDataForNode(testNode) from component context to test');

// Test 4: Check if images are being set correctly
console.log('\n4. Checking event image paths:');
const sampleEventData = deployedEventNodes.get('E1') || deployedEventNodes.get('1');
if (sampleEventData) {
  console.log('   Image path:', sampleEventData.image);
  console.log('   Image reference:', sampleEventData.imageReference);

  // Try to load the image
  const img = new Image();
  img.onload = () => console.log('   ✓ Image loads successfully');
  img.onerror = () => console.log('   ✗ Image failed to load');
  img.src = sampleEventData.image || sampleEventData.imageReference;
}

console.log('\n=== Test Complete ===');
console.log('To manually test in Story Climb:');
console.log('1. Deploy event data from admin panel');
console.log('2. Check browser console for loading logs');
console.log('3. Click on event node E1');
console.log('4. Verify name and image are displayed correctly');