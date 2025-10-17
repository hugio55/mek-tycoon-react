const fs = require('fs');
const refData = fs.readFileSync('src/lib/variationsReferenceData.ts', 'utf8');

// Parse heads
const headsMatch = refData.match(/heads: \[([\s\S]*?)\],\s*\/\/ BODY/);
const headsSection = headsMatch[1];
const headMatches = headsSection.matchAll(/name: "([^"]+)"/g);
const heads = Array.from(headMatches, m => m[1]);

// Parse bodies
const bodiesMatch = refData.match(/bodies: \[([\s\S]*?)\],\s*\/\/ ITEM/);
const bodiesSection = bodiesMatch[1];
const bodyMatches = bodiesSection.matchAll(/name: "([^"]+)"/g);
const bodies = Array.from(bodyMatches, m => m[1]);

// Parse items
const itemsMatch = refData.match(/items: \[([\s\S]*?)\],\s*\};/);
const itemsSection = itemsMatch[1];
const itemMatches = itemsSection.matchAll(/name: "([^"]+)"/g);
const items = Array.from(itemMatches, m => m[1]);

console.log('Reference Data Counts:');
console.log('  Heads:', heads.length);
console.log('  Bodies:', bodies.length);
console.log('  Items/Traits:', items.length);
console.log('  Total:', heads.length + bodies.length + items.length);
console.log('');

// Parse rarity data
const rarityData = fs.readFileSync('src/lib/completeVariationRarity.ts', 'utf8');
const rarityMatches = rarityData.matchAll(/name: "([^"]+)",\s*type: "([^"]+)"/g);
const rarityVariations = new Map();
for (const match of rarityMatches) {
  const name = match[1];
  const type = match[2];
  const key = name + '|' + type;
  rarityVariations.set(key, true);
}

console.log('Rarity Data Count:', rarityVariations.size);
console.log('');

// Find missing
const missing = [];

for (const head of heads) {
  if (!rarityVariations.has(head + '|head')) {
    missing.push({ name: head, type: 'head' });
  }
}

for (const body of bodies) {
  if (!rarityVariations.has(body + '|body')) {
    missing.push({ name: body, type: 'body' });
  }
}

for (const item of items) {
  if (!rarityVariations.has(item + '|trait')) {
    missing.push({ name: item, type: 'trait' });
  }
}

console.log('===== GHOST VARIATIONS (Defined but Never Minted) =====');
console.log('Total Missing:', missing.length);
console.log('');

const missingHeads = missing.filter(m => m.type === 'head');
const missingBodies = missing.filter(m => m.type === 'body');
const missingTraits = missing.filter(m => m.type === 'trait');

console.log('MISSING HEADS (' + missingHeads.length + '):');
missingHeads.forEach((h, i) => console.log('  ' + (i+1) + '. ' + h.name));
console.log('');

console.log('MISSING BODIES (' + missingBodies.length + '):');
missingBodies.forEach((b, i) => console.log('  ' + (i+1) + '. ' + b.name));
console.log('');

console.log('MISSING TRAITS (' + missingTraits.length + '):');
missingTraits.forEach((t, i) => console.log('  ' + (i+1) + '. ' + t.name));
console.log('');

// Check for duplicates in reference data
console.log('===== CHECKING FOR ISSUES =====');
console.log('');
console.log('Names that appear as BOTH head AND body in reference data:');
const duplicates = heads.filter(h => bodies.includes(h));
duplicates.forEach(d => {
  const hasHead = rarityVariations.has(d + '|head');
  const hasBody = rarityVariations.has(d + '|body');
  console.log('  - ' + d + ' (head: ' + (hasHead ? 'EXISTS' : 'MISSING') + ', body: ' + (hasBody ? 'EXISTS' : 'MISSING') + ')');
});
