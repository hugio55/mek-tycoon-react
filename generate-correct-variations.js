const fs = require('fs');

// Read the rarity data (the source of truth)
const rarityData = fs.readFileSync('src/lib/completeVariationRarity.ts', 'utf8');

// Parse all variations
const rarityMatches = rarityData.matchAll(/{\s*name: "([^"]+)",\s*type: "([^"]+)",\s*count: (\d+),/g);
const heads = [];
const bodies = [];
const items = [];

let headId = 1;
let bodyId = 1;
let itemId = 1;

for (const match of rarityMatches) {
  const name = match[1];
  const type = match[2];
  const count = parseInt(match[3]);

  if (type === 'head') {
    heads.push({ id: headId++, name, type: 'head', count });
  } else if (type === 'body') {
    bodies.push({ id: bodyId++, name, type: 'body', count });
  } else if (type === 'trait') {
    items.push({ id: itemId++, name, type: 'item', count });
  }
}

// Sort each category by count (rarest first) then alphabetically
heads.sort((a, b) => a.count === b.count ? a.name.localeCompare(b.name) : a.count - b.count);
bodies.sort((a, b) => a.count === b.count ? a.name.localeCompare(b.name) : a.count - b.count);
items.sort((a, b) => a.count === b.count ? a.name.localeCompare(b.name) : a.count - b.count);

// Reassign IDs after sorting
heads.forEach((h, i) => h.id = i + 1);
const bodyStartId = heads.length + 1;
bodies.forEach((b, i) => b.id = bodyStartId + i);
const itemStartId = bodyStartId + bodies.length;
items.forEach((item, i) => item.id = itemStartId + i);

// Generate the file content
let output = `// Complete list of all variations with unique IDs
// This file contains only ACTUAL variations that appear in minted Meks (288 total)
// Generated from completeVariationRarity.ts (the source of truth)
export const ALL_VARIATIONS = {
  // HEAD VARIATIONS (1-${heads.length})
  heads: [\n`;

heads.forEach((h, i) => {
  output += `    { id: ${h.id}, name: "${h.name}", type: "head" }${i < heads.length - 1 ? ',' : ''}\n`;
});

output += `  ],\n\n`;
output += `  // BODY VARIATIONS (${bodyStartId}-${bodyStartId + bodies.length - 1})\n`;
output += `  bodies: [\n`;

bodies.forEach((b, i) => {
  output += `    { id: ${b.id}, name: "${b.name}", type: "body" }${i < bodies.length - 1 ? ',' : ''}\n`;
});

output += `  ],\n\n`;
output += `  // ITEM VARIATIONS (${itemStartId}-${itemStartId + items.length - 1})\n`;
output += `  items: [\n`;

items.forEach((item, i) => {
  output += `    { id: ${item.id}, name: "${item.name}", type: "item" }${i < items.length - 1 ? ',' : ''}\n`;
});

output += `  ],\n};\n\n`;
output += `// Summary counts\n`;
output += `export const VARIATION_COUNTS = {\n`;
output += `  heads: ${heads.length},\n`;
output += `  bodies: ${bodies.length},\n`;
output += `  items: ${items.length},\n`;
output += `  total: ${heads.length + bodies.length + items.length}\n`;
output += `};\n`;

// Write the new file
fs.writeFileSync('src/lib/variationsReferenceData.ts', output);

console.log('✓ Generated correct variationsReferenceData.ts');
console.log('  Heads:', heads.length);
console.log('  Bodies:', bodies.length);
console.log('  Items/Traits:', items.length);
console.log('  Total:', heads.length + bodies.length + items.length);
console.log('');
console.log('Note: 2 names appear in multiple types:');
console.log('  - Rust (head and body)');
console.log('  - Aztec (head and body)');
