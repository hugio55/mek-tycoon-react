const fs = require('fs');

// Read CNFT complete metadata
const cnftData = JSON.parse(fs.readFileSync('../../cnft/all_4000_meks_complete.json', 'utf8'));
const meks = cnftData.stats;

// Read rarity data for copy counts
const rarityContent = fs.readFileSync('src/lib/completeVariationRarity.ts', 'utf8');
const rarityMatches = rarityContent.matchAll(/{\s*name: "([^"]+)",\s*type: "([^"]+)",\s*count: (\d+),[\s\S]*?rank: (\d+)/g);

const rarityMap = new Map();
for (const match of rarityMatches) {
  const key = match[1] + '|' + match[2]; // "variation|type"
  rarityMap.set(key, {
    count: parseInt(match[3]),
    rank: parseInt(match[4])
  });
}

// Build complete hierarchy with all variations
const variations = [];

// Track unique variations to avoid duplicates
const seen = new Set();

meks.forEach(mek => {
  // Process head
  const headKey = mek.headVariation + '|head';
  if (!seen.has(headKey)) {
    seen.add(headKey);
    const rarity = rarityMap.get(headKey) || { count: 0, rank: 999 };
    variations.push({
      name: mek.headVariation,
      style: mek.headStyle,
      group: mek.headGroup,
      type: 'head',
      copies: rarity.count,
      rank: rarity.rank
    });
  }

  // Process body
  const bodyKey = mek.bodyVariation + '|body';
  if (!seen.has(bodyKey)) {
    seen.add(bodyKey);
    const rarity = rarityMap.get(bodyKey) || { count: 0, rank: 999 };
    variations.push({
      name: mek.bodyVariation,
      style: mek.bodyStyle,
      group: mek.bodyGroup,
      type: 'body',
      copies: rarity.count,
      rank: rarity.rank
    });
  }

  // Process item/trait
  const itemKey = mek.itemVariation + '|trait';
  if (!seen.has(itemKey)) {
    seen.add(itemKey);
    const rarity = rarityMap.get(itemKey) || { count: 0, rank: 999 };
    variations.push({
      name: mek.itemVariation,
      style: mek.itemStyle,
      group: mek.itemGroup,
      type: 'trait',
      copies: rarity.count,
      rank: rarity.rank
    });
  }
});

// Filter out variations without rarity data (rank: 999 means not minted)
const mintedVariations = variations.filter(v => v.rank !== 999);

// Sort by rank (rarest first)
mintedVariations.sort((a, b) => a.rank - b.rank);

console.log('Total unique variations extracted:', mintedVariations.length);
console.log('Variations without rarity data (not minted):', variations.length - mintedVariations.length);
console.log('');
console.log('Sample variations:');
mintedVariations.slice(0, 10).forEach(v => {
  console.log(`${v.name} (${v.type}) - Group: "${v.group}", Style: "${v.style}", Rank: ${v.rank}, Copies: ${v.copies}`);
});

// Write to TypeScript file
let output = `// Complete variation hierarchy with Group → Style → Variation\n`;
output += `// Extracted from CNFT metadata and merged with rarity data\n`;
output += `// Total: ${mintedVariations.length} variations (only minted variations)\n\n`;
output += `export interface VariationHierarchy {\n`;
output += `  name: string;\n`;
output += `  style: string;\n`;
output += `  group: string;\n`;
output += `  type: 'head' | 'body' | 'trait';\n`;
output += `  copies: number;\n`;
output += `  rank: number;\n`;
output += `}\n\n`;
output += `export const VARIATION_HIERARCHY: VariationHierarchy[] = `;
output += JSON.stringify(mintedVariations, null, 2);
output += `;\n\n`;
output += `export function searchVariations(query: string): VariationHierarchy[] {\n`;
output += `  const q = query.toLowerCase();\n`;
output += `  return VARIATION_HIERARCHY.filter(v =>\n`;
output += `    v.name.toLowerCase().includes(q) ||\n`;
output += `    v.style.toLowerCase().includes(q) ||\n`;
output += `    v.group.toLowerCase().includes(q)\n`;
output += `  );\n`;
output += `}\n\n`;
output += `export function filterByGroup(group: string): VariationHierarchy[] {\n`;
output += `  return VARIATION_HIERARCHY.filter(v => v.group === group);\n`;
output += `}\n\n`;
output += `export function filterByStyle(style: string): VariationHierarchy[] {\n`;
output += `  return VARIATION_HIERARCHY.filter(v => v.style === style);\n`;
output += `}\n`;

fs.writeFileSync('src/lib/variationHierarchy.ts', output);

console.log('');
console.log('✓ Created src/lib/variationHierarchy.ts with', mintedVariations.length, 'variations');
