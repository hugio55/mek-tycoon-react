const fs = require('fs');

// Read the allMeksData.json file
const data = JSON.parse(fs.readFileSync('convex/allMeksData.json', 'utf8'));

// Count occurrences of each variation
const headCounts = {};
const bodyCounts = {};
const itemCounts = {};

// Track which Mek rank each 1-of-1 belongs to
const oneOfOneRanks = {
  heads: {},
  bodies: {},
  items: {}
};

data.forEach(mek => {
  // Count heads
  if (mek.headVariation) {
    headCounts[mek.headVariation] = (headCounts[mek.headVariation] || 0) + 1;
    // If it's the first (only) occurrence, save the rank
    if (headCounts[mek.headVariation] === 1) {
      oneOfOneRanks.heads[mek.headVariation] = mek.rarityRank || 999;
    }
  }

  // Count bodies
  if (mek.bodyVariation) {
    bodyCounts[mek.bodyVariation] = (bodyCounts[mek.bodyVariation] || 0) + 1;
    if (bodyCounts[mek.bodyVariation] === 1) {
      oneOfOneRanks.bodies[mek.bodyVariation] = mek.rarityRank || 999;
    }
  }

  // Count items
  if (mek.itemVariation) {
    itemCounts[mek.itemVariation] = (itemCounts[mek.itemVariation] || 0) + 1;
    if (itemCounts[mek.itemVariation] === 1) {
      oneOfOneRanks.items[mek.itemVariation] = mek.rarityRank || 999;
    }
  }
});

// Find all 1-of-1 heads with their Mek ranks
console.log('1-of-1 Head Variations with their Mek Ranks:');
console.log('============================================');
Object.entries(headCounts)
  .filter(([name, count]) => count === 1)
  .sort((a, b) => oneOfOneRanks.heads[a[0]] - oneOfOneRanks.heads[b[0]])
  .forEach(([name, count]) => {
    console.log(`Mek Rank #${oneOfOneRanks.heads[name]}: ${name}`);
  });

console.log('\nAll variations sorted by count:');
console.log('================================');
const allVariations = [
  ...Object.entries(headCounts).map(([name, count]) => ({ name, count, type: 'head', mekRank: count === 1 ? oneOfOneRanks.heads[name] : null })),
  ...Object.entries(bodyCounts).map(([name, count]) => ({ name, count, type: 'body', mekRank: count === 1 ? oneOfOneRanks.bodies[name] : null })),
  ...Object.entries(itemCounts).map(([name, count]) => ({ name, count, type: 'item', mekRank: count === 1 ? oneOfOneRanks.items[name] : null }))
];

allVariations.sort((a, b) => {
  // Sort by count first
  if (a.count !== b.count) return a.count - b.count;
  // For same count (especially 1-of-1s), sort by mek rank
  if (a.mekRank && b.mekRank) return a.mekRank - b.mekRank;
  return 0;
});

// Show first 20 rarest
console.log('\nFirst 20 Rarest:');
allVariations.slice(0, 20).forEach((v, i) => {
  const rankDisplay = v.mekRank ? `Mek #${v.mekRank}` : `Count: ${v.count}`;
  console.log(`${i+1}. ${v.name} (${v.type}) - ${rankDisplay}`);
});