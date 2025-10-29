// Renumber all variation ranks to fix conflicts after top 30 update
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'lib', 'completeVariationRarity.ts');

console.log('📝 Reading completeVariationRarity.ts...');
let content = fs.readFileSync(filePath, 'utf8');

// The top 30 ranks are reserved for repeating-digit variations:
// Ranks 1-3: 000H, 000B, 000T
// Ranks 4-6: 999H, 999B, 999T
// Ranks 7-9: 888H, 888B, 888T
// Ranks 10-12: 777H, 777B, 777T
// Ranks 13-15: 666H, 666B, 666T
// Ranks 16-18: 555H, 555B, (555T doesn't exist)
// Ranks 19-21: 444H, 444B, (444T doesn't exist)
// Ranks 22-24: 333H, 333B, (333T doesn't exist)
// Ranks 25-27: 222H, 222B, 222T
// Ranks 28-30: 111H, 111B, 111T

const reservedSourceKeys = [
  '000H', '000B', '000T',
  '999H', '999B', '999T',
  '888H', '888B', '888T',
  '777H', '777B', '777T',
  '666H', '666B', '666T',
  '555H', '555B', '555T',
  '444H', '444B', '444T',
  '333H', '333B', '333T',
  '222H', '222B', '222T',
  '111H', '111B', '111T'
];

// Parse all variations from the file to understand current state
const variationPattern = /{\s*name:\s*"([^"]+)",\s*type:\s*"(head|body|trait)",\s*count:\s*(\d+),\s*percentage:\s*"([^"]+)",\s*tier:\s*"([^"]+)",\s*rank:\s*(\d+),\s*sourceKey:\s*"([^"]+)"\s*}/g;

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

// Separate repeating-digit variations from others
const repeatingDigitVariations = variations.filter(v => reservedSourceKeys.includes(v.sourceKey));
const otherVariations = variations.filter(v => !reservedSourceKeys.includes(v.sourceKey));

console.log(`📊 Repeating-digit variations: ${repeatingDigitVariations.length}`);
console.log(`📊 Other variations: ${otherVariations.length}`);

// Sort other variations by their count (ascending = rarer first), then by name for consistency
otherVariations.sort((a, b) => {
  if (a.count !== b.count) {
    return a.count - b.count; // Fewer copies = rarer = lower rank number
  }
  return a.name.localeCompare(b.name); // Alphabetical for same count
});

// Assign new ranks starting at 31
let currentRank = 31;
const rankUpdates = {};

otherVariations.forEach((variation, index) => {
  const oldRank = variation.rank;
  const newRank = currentRank++;
  rankUpdates[variation.sourceKey] = { oldRank, newRank };
  console.log(`✏️  ${variation.name} (${variation.sourceKey}): rank ${oldRank} → ${newRank}`);
});

console.log(`\n📝 Applying ${Object.keys(rankUpdates).length} rank updates...`);

// Update ranks in the file for non-repeating variations only
let updatedCount = 0;
for (const [sourceKey, { oldRank, newRank }] of Object.entries(rankUpdates)) {
  // Match pattern: rank: number, followed by sourceKey: "XXX"
  const pattern = new RegExp(
    `(rank:\\s*)\\d+(,\\s*sourceKey:\\s*"${sourceKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}")`,
    'g'
  );

  const newContent = content.replace(pattern, (match, prefix, suffix) => {
    updatedCount++;
    return `${prefix}${newRank}${suffix}`;
  });

  content = newContent;
}

console.log(`✅ Updated ${updatedCount} ranks`);

// Write back to file
fs.writeFileSync(filePath, content, 'utf8');
console.log('💾 Saved updated file');

console.log('\n🎉 Renumbering complete!');
console.log(`   - Ranks 1-30: Reserved for top 10 Meks (repeating digits)`);
console.log(`   - Ranks 31-${30 + otherVariations.length}: All other variations by rarity`);
