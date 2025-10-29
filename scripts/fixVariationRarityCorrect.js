// CORRECT fix for completeVariationRarity.ts
// ONLY add H/B/T suffixes to the 10 repeating-digit Meks (000, 111, 222, etc.)
// All other sourceKeys are already unique and should NOT be modified
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
    sourceKey: match[7]
  });
}

console.log(`📊 Found ${variations.length} variations`);

// Step 1: Add H/B/T suffixes ONLY to repeating-digit sourceKeys
console.log('\n🔧 Step 1: Adding H/B/T suffixes to repeating-digit Meks only...');
const repeatingDigits = ['000', '111', '222', '333', '444', '555', '666', '777', '888', '999'];
let suffixCount = 0;

variations.forEach(v => {
  if (repeatingDigits.includes(v.sourceKey)) {
    const suffix = v.type === 'head' ? 'H' : v.type === 'body' ? 'B' : 'T';
    console.log(`  ✓ ${v.name} (${v.type}): ${v.sourceKey} → ${v.sourceKey}${suffix}`);
    v.sourceKey = `${v.sourceKey}${suffix}`;
    suffixCount++;
  }
});

console.log(`  ✅ Added suffixes to ${suffixCount} variations`);

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

missingVariations.forEach(mv => {
  const exists = variations.some(v => v.name === mv.name && v.type === mv.type);
  if (!exists) {
    console.log(`  ➕ Adding ${mv.name} (${mv.sourceKey})`);
    variations.push(mv);
  } else {
    console.log(`  ✓ ${mv.name} already exists`);
  }
});

console.log(`📊 Total variations: ${variations.length}`);

// Step 3: Assign proper ranks
console.log('\n🔧 Step 3: Assigning proper ranks...');

// Define top 30 ranks for the 10 repeating-digit Meks
const top30Ranks = {
  '000H': 1, '000B': 2, '000T': 3,
  '999H': 4, '999B': 5, '999T': 6,
  '888H': 7, '888B': 8, '888T': 9,
  '777H': 10, '777B': 11, '777T': 12,
  '666H': 13, '666B': 14, '666T': 15,
  '555H': 16, '555B': 17, '555T': 18,
  '444H': 19, '444B': 20, '444T': 21,
  '333H': 22, '333B': 23, '333T': 24,
  '222H': 25, '222B': 26, '222T': 27,
  '111H': 28, '111B': 29, '111T': 30
};

// Separate top 30 from other variations
const top30SourceKeys = new Set(Object.keys(top30Ranks));
const top30Variations = [];
const otherVariations = [];

variations.forEach(v => {
  if (top30SourceKeys.has(v.sourceKey)) {
    top30Variations.push(v);
  } else {
    otherVariations.push(v);
  }
});

console.log(`  📊 Top 30 variations: ${top30Variations.length}`);
console.log(`  📊 Other variations: ${otherVariations.length}`);

// Assign top 30 ranks
top30Variations.forEach(v => {
  v.rank = top30Ranks[v.sourceKey];
  console.log(`  ✓ ${v.name} (${v.sourceKey}): rank ${v.rank}`);
});

// Sort other variations by count (ascending = rarer first), then alphabetically
otherVariations.sort((a, b) => {
  if (a.count !== b.count) {
    return a.count - b.count;
  }
  return a.name.localeCompare(b.name);
});

// Assign ranks 31-291
let currentRank = 31;
otherVariations.forEach(v => {
  v.rank = currentRank++;
});

console.log(`  ✅ Assigned ranks 31-${currentRank - 1}`);

// Combine and sort by rank
const allVariations = [...top30Variations, ...otherVariations];
allVariations.sort((a, b) => a.rank - b.rank);

// Step 4: Write updated file
console.log('\n🔧 Step 4: Writing updated file...');

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

fs.writeFileSync(filePath, header + variationEntries + footer, 'utf8');

console.log('✅ File updated successfully!');
console.log(`\n📊 Summary:`);
console.log(`  - Total variations: ${allVariations.length}`);
console.log(`  - Top 30 (repeating digits): ${top30Variations.length}`);
console.log(`  - Other variations: ${otherVariations.length}`);
console.log(`  - Suffixes added: ${suffixCount} (only to repeating-digit Meks)`);

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
  console.log(`\n✅ No duplicate ranks!`);
}
