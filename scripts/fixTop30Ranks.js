// Fix rank ordering for top 30 variations (repeating sourceKeys)
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'lib', 'completeVariationRarity.ts');

console.log('📝 Reading completeVariationRarity.ts...');
let content = fs.readFileSync(filePath, 'utf8');

// Define the correct rank mapping for the top 30 variations
// Ranks 1-3: 000H, 000B, 000T
// Ranks 4-6: 999H, 999B, 999T
// Ranks 7-9: 888H, 888B, 888T
// Ranks 10-12: 777H, 777B, 777T
// Ranks 13-15: 666H, 666B, 666T
// Ranks 16-18: 555H, 555B, 555T
// Ranks 19-21: 444H, 444B, 444T
// Ranks 22-24: 333H, 333B, 333T
// Ranks 25-27: 222H, 222B, 222T
// Ranks 28-30: 111H, 111B, 111T

const rankMapping = {
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

let updatedCount = 0;

// For each sourceKey, find and update the rank
for (const [sourceKey, correctRank] of Object.entries(rankMapping)) {
  // Match pattern: rank: number, followed by sourceKey: "XXX"
  // We need to match the rank value that comes BEFORE the sourceKey
  const pattern = new RegExp(
    `(rank:\\s*)\\d+(,\\s*sourceKey:\\s*"${sourceKey}")`,
    'g'
  );

  const newContent = content.replace(pattern, (match, prefix, suffix) => {
    updatedCount++;
    console.log(`✅ Updated ${sourceKey}: rank → ${correctRank}`);
    return `${prefix}${correctRank}${suffix}`;
  });

  content = newContent;
}

console.log(`\n✨ Updated ${updatedCount} ranks`);

// Write back to file
fs.writeFileSync(filePath, content, 'utf8');
console.log('💾 Saved updated file');

console.log('\n🔍 Verification - checking updated ranks:');
// Verify the changes
for (const [sourceKey, expectedRank] of Object.entries(rankMapping)) {
  const verifyPattern = new RegExp(`rank:\\s*(\\d+),\\s*sourceKey:\\s*"${sourceKey}"`, 'g');
  const match = verifyPattern.exec(content);
  if (match) {
    const actualRank = parseInt(match[1]);
    if (actualRank === expectedRank) {
      console.log(`   ✅ ${sourceKey}: rank ${actualRank} (correct)`);
    } else {
      console.log(`   ❌ ${sourceKey}: rank ${actualRank} (expected ${expectedRank})`);
    }
  } else {
    console.log(`   ⚠️  ${sourceKey}: not found`);
  }
}

console.log('\n✨ Script complete!');
