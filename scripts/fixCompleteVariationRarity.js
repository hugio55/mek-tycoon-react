// Comprehensive fix for completeVariationRarity.ts
// 1. Add H/B/T suffixes to ALL sourceKeys that need them
// 2. Add 3 missing variations (Nil, Null, None)
// 3. Properly assign ranks 1-291 based on rarity
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'lib', 'completeVariationRarity.ts');

console.log('📝 Reading completeVariationRarity.ts...');
let content = fs.readFileSync(filePath, 'utf8');

// Parse all variations
const variationPattern = /{[\s\S]*?name:\s*"([^"]+)",[\s\S]*?type:\s*"(head|body|trait)",[\s\S]*?count:\s*(\d+),[\s\S]*?percentage:\s*"([^"]+)",[\s\S]*?tier:\s*"([^"]+)",[\s\S]*?rank:\s*(\d+),[\s\S]*?sourceKey:\s*"([^"]+)"[\s\S]*?}/g;

const variations = [];
let match;
while ((match = variationPattern.exec(content)) !== null) {
  variations.push({
    name: match[1],
    type: match[2],
    count: parseInt(match[3]),
    percentage: match[4],
    tier: match[5],
    rank: parseInt(match[6]),
    sourceKey: match[7],
    fullMatch: match[0]
  });
}

console.log(`📊 Found ${variations.length} variations`);

// Step 1: Add H/B/T suffixes to sourceKeys
console.log('\n🔧 Step 1: Adding H/B/T suffixes to sourceKeys...');
variations.forEach(v => {
  const suffix = v.type === 'head' ? 'H' : v.type === 'body' ? 'B' : 'T';
  // Only add suffix if not already present and sourceKey is 3 characters
  if (v.sourceKey.length === 3 && !v.sourceKey.endsWith('H') && !v.sourceKey.endsWith('B') && !v.sourceKey.endsWith('T')) {
    v.sourceKey = `${v.sourceKey}${suffix}`;
  }
});

// Step 2: Add 3 missing variations
console.log('\n🔧 Step 2: Adding missing variations...');
const missingVariations = [
  {
    name: "Nil",
    type: "trait",
    count: 1,
    percentage: "0.03",
    tier: "legendary",
    rank: 0, // Will be assigned later
    sourceKey: "555T"
  },
  {
    name: "Null",
    type: "trait",
    count: 1,
    percentage: "0.03",
    tier: "legendary",
    rank: 0,
    sourceKey: "444T"
  },
  {
    name: "None",
    type: "trait",
    count: 1,
    percentage: "0.03",
    tier: "legendary",
    rank: 0,
    sourceKey: "333T"
  }
];

// Check which ones are actually missing
missingVariations.forEach(mv => {
  const exists = variations.some(v => v.name === mv.name && v.type === mv.type);
  if (!exists) {
    console.log(`  ➕ Adding ${mv.name} (${mv.sourceKey})`);
    variations.push(mv);
  } else {
    console.log(`  ✓ ${mv.name} already exists`);
  }
});

console.log(`📊 Total variations after adding missing: ${variations.length}`);

// Step 3: Assign proper ranks
console.log('\n🔧 Step 3: Assigning proper ranks...');

// Define top 10 Meks in correct order (ranks 1-30)
const top10Meks = [
  { sourceKey: '000H', rank: 1 },
  { sourceKey: '000B', rank: 2 },
  { sourceKey: '000T', rank: 3 },
  { sourceKey: '999H', rank: 4 },
  { sourceKey: '999B', rank: 5 },
  { sourceKey: '999T', rank: 6 },
  { sourceKey: '888H', rank: 7 },
  { sourceKey: '888B', rank: 8 },
  { sourceKey: '888T', rank: 9 },
  { sourceKey: '777H', rank: 10 },
  { sourceKey: '777B', rank: 11 },
  { sourceKey: '777T', rank: 12 },
  { sourceKey: '666H', rank: 13 },
  { sourceKey: '666B', rank: 14 },
  { sourceKey: '666T', rank: 15 },
  { sourceKey: '555H', rank: 16 },
  { sourceKey: '555B', rank: 17 },
  { sourceKey: '555T', rank: 18 },
  { sourceKey: '444H', rank: 19 },
  { sourceKey: '444B', rank: 20 },
  { sourceKey: '444T', rank: 21 },
  { sourceKey: '333H', rank: 22 },
  { sourceKey: '333B', rank: 23 },
  { sourceKey: '333T', rank: 24 },
  { sourceKey: '222H', rank: 25 },
  { sourceKey: '222B', rank: 26 },
  { sourceKey: '222T', rank: 27 },
  { sourceKey: '111H', rank: 28 },
  { sourceKey: '111B', rank: 29 },
  { sourceKey: '111T', rank: 30 }
];

// Assign ranks to top 10 Meks
const top10SourceKeys = new Set(top10Meks.map(m => m.sourceKey));
const top30Variations = [];
const otherVariations = [];

variations.forEach(v => {
  if (top10SourceKeys.has(v.sourceKey)) {
    top30Variations.push(v);
  } else {
    otherVariations.push(v);
  }
});

console.log(`  📊 Top 30 variations: ${top30Variations.length}`);
console.log(`  📊 Other variations: ${otherVariations.length}`);

// Assign top 30 ranks
top30Variations.forEach(v => {
  const mekData = top10Meks.find(m => m.sourceKey === v.sourceKey);
  if (mekData) {
    v.rank = mekData.rank;
    console.log(`  ✓ ${v.name} (${v.sourceKey}): rank ${v.rank}`);
  }
});

// Sort other variations by count (ascending = rarer first)
otherVariations.sort((a, b) => {
  if (a.count !== b.count) {
    return a.count - b.count; // Fewer copies = rarer = lower rank
  }
  return a.name.localeCompare(b.name); // Alphabetical for same count
});

// Assign ranks 31-291 to other variations
let currentRank = 31;
otherVariations.forEach(v => {
  v.rank = currentRank++;
});

console.log(`  ✓ Assigned ranks 31-${currentRank - 1} to other variations`);

// Combine all variations
const allVariations = [...top30Variations, ...otherVariations];

// Sort by rank for final output
allVariations.sort((a, b) => a.rank - b.rank);

console.log('\n🔧 Step 4: Writing updated file...');

// Build new file content
const header = `// Auto-generated variation rarity data
// Generated from mekRarityMaster.json with 4000 Mek records
// Total unique variations: 291

export type VariationType = 'head' | 'body' | 'trait';

export type RarityTier = 'legendary' | 'ultra-rare' | 'very-rare' | 'rare' | 'uncommon' | 'common';

export interface VariationRarity {
  name: string;
  type: VariationType;
  count: number;
  percentage: string;
  tier: RarityTier;
  rank: number; // 1 = rarest
  sourceKey: string; // 3-character code used for image file naming
}

// Complete variation rarity ranking (291 total variations)
export const COMPLETE_VARIATION_RARITY: VariationRarity[] = [\n`;

const variationEntries = allVariations.map(v => `  {
    name: "${v.name}",
    type: "${v.type}",
    count: ${v.count},
    percentage: "${v.percentage}",
    tier: "${v.tier}",
    rank: ${v.rank},
    sourceKey: "${v.sourceKey}"
  }`).join(',\n');

const footer = '\n];\n';

const newContent = header + variationEntries + footer;

fs.writeFileSync(filePath, newContent, 'utf8');

console.log('✅ File updated successfully!');
console.log(`\n📊 Summary:`);
console.log(`  - Total variations: ${allVariations.length}`);
console.log(`  - Top 30 (ranks 1-30): ${top30Variations.length}`);
console.log(`  - Other (ranks 31-${allVariations.length}): ${otherVariations.length}`);

// Verify no duplicate ranks
const rankCounts = {};
allVariations.forEach(v => {
  rankCounts[v.rank] = (rankCounts[v.rank] || 0) + 1;
});
const duplicateRanks = Object.entries(rankCounts).filter(([rank, count]) => count > 1);
if (duplicateRanks.length > 0) {
  console.log(`\n⚠️  WARNING: Found duplicate ranks:`);
  duplicateRanks.forEach(([rank, count]) => {
    console.log(`  - Rank ${rank}: ${count} variations`);
  });
} else {
  console.log(`\n✅ No duplicate ranks found!`);
}

// Verify no duplicate sourceKeys (except for special cases)
const sourceKeyCounts = {};
allVariations.forEach(v => {
  sourceKeyCounts[v.sourceKey] = (sourceKeyCounts[v.sourceKey] || 0) + 1;
});
const duplicateSourceKeys = Object.entries(sourceKeyCounts).filter(([key, count]) => count > 1);
if (duplicateSourceKeys.length > 0) {
  console.log(`\n⚠️  WARNING: Found duplicate sourceKeys:`);
  duplicateSourceKeys.forEach(([key, count]) => {
    console.log(`  - ${key}: ${count} variations`);
    allVariations.filter(v => v.sourceKey === key).forEach(v => {
      console.log(`    • ${v.name} (${v.type})`);
    });
  });
} else {
  console.log(`✅ No duplicate sourceKeys found!`);
}
