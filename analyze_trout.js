const fs = require('fs');
const lines = fs.readFileSync('trout_meks.json', 'utf8').split('\n').filter(x => x && !x.startsWith('Showing'));
const meks = lines.map(l => { try { return JSON.parse(l); } catch(e) { return null; } }).filter(x => x);

console.log('Total Trout meks:', meks.length);

// Check for duplicates by assetId
const assetIds = meks.map(m => m.assetId);
const uniqueIds = new Set(assetIds);
console.log('Unique assetIds:', uniqueIds.size);
console.log('Duplicates:', assetIds.length - uniqueIds.size);

// Find duplicates
const idCounts = {};
assetIds.forEach(id => { idCounts[id] = (idCounts[id] || 0) + 1; });
const dups = Object.entries(idCounts).filter(([id, count]) => count > 1);
if (dups.length > 0) {
  console.log('\nDuplicate assetIds found:', dups.length);
  dups.slice(0, 5).forEach(([id, count]) => {
    console.log('  ' + id.substring(0, 50) + '...: ' + count + 'x');
  });
}

// Check WrenCo meks
const wrenMeks = meks.filter(m => m.owner === 'stake1u8zevs34vf4wrsz6xs64zuztdk4agzvpg6c8zv4plesp9ughgq076');
console.log('\nWrenCo meks in Trout:', wrenMeks.length);

// Check what the extra 42 might be
if (uniqueIds.size > 4000) {
  console.log('\nMore than 4000 unique - checking for non-standard IDs...');
}
