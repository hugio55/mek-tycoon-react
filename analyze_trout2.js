const fs = require('fs');
const lines = fs.readFileSync('trout_meks.json', 'utf8').split('\n').filter(x => x && !x.startsWith('Showing'));
const meks = lines.map(l => { try { return JSON.parse(l); } catch(e) { return null; } }).filter(x => x);

// Extract mek numbers from assetId or assetName
const mekNumbers = meks.map(m => {
  // Try assetName first (e.g., "Mek #2191" or "Mekanism #2191")
  const nameMatch = m.assetName && m.assetName.match(/#(\d+)/);
  if (nameMatch) return parseInt(nameMatch[1]);

  // Try assetId for hex-encoded "Mekanism" followed by number
  const hexMatch = m.assetId && m.assetId.match(/4d656b616e69736d(\d+)/);
  if (hexMatch) return parseInt(hexMatch[1]);

  // Try assetId for "Mekanism" directly
  const directMatch = m.assetId && m.assetId.match(/Mekanism(\d+)/i);
  if (directMatch) return parseInt(directMatch[1]);

  return null;
});

const validNumbers = mekNumbers.filter(n => n !== null);
console.log('Meks with extractable numbers:', validNumbers.length);

const uniqueNumbers = new Set(validNumbers);
console.log('Unique mek numbers:', uniqueNumbers.size);
console.log('Duplicate numbers:', validNumbers.length - uniqueNumbers.size);

// Find which numbers appear multiple times
const numCounts = {};
validNumbers.forEach(n => { numCounts[n] = (numCounts[n] || 0) + 1; });
const dupNums = Object.entries(numCounts).filter(([n, count]) => count > 1);
if (dupNums.length > 0) {
  console.log('\nMek numbers appearing multiple times:');
  dupNums.forEach(([n, count]) => console.log('  Mek #' + n + ': ' + count + 'x'));
}

// Check range
const min = Math.min(...validNumbers);
const max = Math.max(...validNumbers);
console.log('\nRange: #' + min + ' to #' + max);

// Find missing numbers 1-4000
const missing = [];
for (let i = 1; i <= 4000; i++) {
  if (!uniqueNumbers.has(i)) missing.push(i);
}
console.log('Missing from 1-4000:', missing.length);
if (missing.length > 0 && missing.length < 20) {
  console.log('Missing IDs:', missing.join(', '));
}

// Find numbers outside 1-4000
const outside = validNumbers.filter(n => n < 1 || n > 4000);
if (outside.length > 0) {
  console.log('\nNumbers outside 1-4000:', outside);
}
