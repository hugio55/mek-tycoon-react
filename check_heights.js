// Run this in browser console on landing-v2 page
const container = document.querySelector('.min-h-screen.bg-black.flex.flex-col');
const contentDiv = document.querySelector('[style*="flex: 1 1 0%"]');
const footer = document.querySelector('footer');

console.log('=== LANDING-V2 HEIGHT ANALYSIS ===');
console.log('Container height:', container?.scrollHeight, 'px');
console.log('Container client height:', container?.clientHeight, 'px');
console.log('Content div height:', contentDiv?.scrollHeight, 'px');
console.log('Footer height:', footer?.scrollHeight, 'px');
console.log('Window height:', window.innerHeight, 'px');
console.log('Document height:', document.documentElement.scrollHeight, 'px');
console.log('\nAll child elements of content div:');
Array.from(contentDiv?.children || []).forEach((child, i) => {
  console.log(`Child ${i}: ${child.tagName} - Height: ${child.scrollHeight}px`, child);
});
