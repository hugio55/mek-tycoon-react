// Diagnostic script to check landing-debug settings state
// Run in browser console on localhost:3200/landing-debug

console.log('=== LANDING DEBUG SETTINGS DIAGNOSTIC ===\n');

// Check migration flag
const migrationFlag = localStorage.getItem('mek-landing-debug-migrated');
console.log('Migration Flag:', migrationFlag);

// Check localStorage data
const localData = localStorage.getItem('mek-landing-debug-config');
if (localData) {
  console.log('\n📦 localStorage data found:');
  const parsed = JSON.parse(localData);
  console.log('- logoSize:', parsed.logoSize);
  console.log('- starScale:', parsed.starScale);
  console.log('- bgStarCount:', parsed.bgStarCount);
  console.log('- selectedFont:', parsed.selectedFont);
  console.log('- Total keys:', Object.keys(parsed).length);
} else {
  console.log('\n❌ No localStorage data found');
}

console.log('\n💡 To force re-migration:');
console.log('localStorage.removeItem("mek-landing-debug-migrated");');
console.log('Then refresh the page.');
