// Test script to verify event deployment and display
// Run this in the browser console on the Story Climb page

console.log('🔍 Event Deployment Test Starting...\n');

// Check if there's an active deployment
const checkDeployment = () => {
  const deploymentMessages = Array.from(document.querySelectorAll('*'))
    .filter(el => el.textContent?.includes('NO ACTIVE DEPLOYMENT'))
    .length > 0;

  if (deploymentMessages) {
    console.log('❌ No active deployment found!');
    console.log('📝 To fix: Go to Admin Master Data > Story Climb Mechanics > Deploy to Story Climb');
    return false;
  }

  console.log('✅ Active deployment detected');
  return true;
};

// Check console for event loading messages
const checkEventLoading = () => {
  console.log('\n📸 Checking event image loading...');
  console.log('Look for these patterns in console:');
  console.log('- "Loading image for event node" messages');
  console.log('- "Event data found" with hasImage: true');
  console.log('- "Image loaded successfully" confirmations');
  console.log('\n🔍 Also check for:');
  console.log('- Event node IDs (should be like "ch1_node_event_1" or similar)');
  console.log('- Available keys in deployedEventNodes map');
  console.log('- Whether node labels match deployed data keys');
};

// Visual check
const visualCheck = () => {
  console.log('\n👁️ Visual inspection:');
  console.log('1. Event nodes should show as circles (not squares)');
  console.log('2. They should be purple when available, dark purple when not');
  console.log('3. Images should load inside the circles');
  console.log('4. Event names should appear when hovering');
};

// Run tests
const hasDeployment = checkDeployment();
if (hasDeployment) {
  checkEventLoading();
}
visualCheck();

console.log('\n📊 Test complete! Check the console output above for details.');
console.log('If images still aren\'t showing:');
console.log('1. Check browser Network tab for 404 errors on image loads');
console.log('2. Verify the event-images folder exists in public directory');
console.log('3. Ensure image paths match actual file names');