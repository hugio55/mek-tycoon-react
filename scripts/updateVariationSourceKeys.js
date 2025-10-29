// Script to add H/B/T suffixes to repeating sourceKeys in completeVariationRarity.ts
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'lib', 'completeVariationRarity.ts');

console.log('📝 Reading completeVariationRarity.ts...');
let content = fs.readFileSync(filePath, 'utf8');

// Define the repeating digits that need suffixes
const repeatingDigits = ['000', '111', '222', '333', '444', '555', '666', '777', '888', '999'];

let updatedCount = 0;

// For each repeating digit, add type suffix
for (const digit of repeatingDigits) {
  // Match sourceKey: "XXX" patterns and add suffix based on type

  // Head variations: add H suffix
  const headPattern = new RegExp(
    `(type:\\s*"head"[^}]+sourceKey:\\s*)"${digit}"`,
    'g'
  );
  content = content.replace(headPattern, (match, prefix) => {
    updatedCount++;
    return `${prefix}"${digit}H"`;
  });

  // Body variations: add B suffix
  const bodyPattern = new RegExp(
    `(type:\\s*"body"[^}]+sourceKey:\\s*)"${digit}"`,
    'g'
  );
  content = content.replace(bodyPattern, (match, prefix) => {
    updatedCount++;
    return `${prefix}"${digit}B"`;
  });

  // Trait variations: add T suffix
  const traitPattern = new RegExp(
    `(type:\\s*"trait"[^}]+sourceKey:\\s*)"${digit}"`,
    'g'
  );
  content = content.replace(traitPattern, (match, prefix) => {
    updatedCount++;
    return `${prefix}"${digit}T"`;
  });
}

console.log(`✅ Updated ${updatedCount} sourceKeys with H/B/T suffixes`);

// Write back to file
fs.writeFileSync(filePath, content, 'utf8');
console.log('💾 Saved updated file');

// Verify the changes
console.log('\n🔍 Verification - checking for remaining unsuffixed repeating digits:');
for (const digit of repeatingDigits) {
  const unsuffixedPattern = new RegExp(`sourceKey:\\s*"${digit}"(?![HBT])`, 'g');
  const matches = content.match(unsuffixedPattern);
  if (matches) {
    console.log(`   ⚠️  Found ${matches.length} unsuffixed "${digit}" entries`);
  }
}

console.log('\n✨ Script complete!');
