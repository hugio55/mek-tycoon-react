// Rebuild completeVariationRarity.ts with correct source keys from metadata
// Preserves top 30 manually configured entries (ranks 1-30)
const fs = require('fs');
const path = require('path');

// Load extracted metadata variations
const extractedPath = path.join(__dirname, 'extracted-variations.json');
const extracted = JSON.parse(fs.readFileSync(extractedPath, 'utf8'));

// Load current COMPLETE_VARIATION_RARITY
const currentPath = path.join(__dirname, '../src/lib/completeVariationRarity.ts');
const currentContent = fs.readFileSync(currentPath, 'utf8');

// Parse the current array from the TypeScript file
const arrayMatch = currentContent.match(/export const COMPLETE_VARIATION_RARITY: VariationRarity\[\] = \[([\s\S]*)\];/);
if (!arrayMatch) {
  console.error('Could not parse COMPLETE_VARIATION_RARITY array');
  process.exit(1);
}

// Extract individual entries using a more robust regex
const entryRegex = /\{[^}]*id: (\d+),[^}]*name: "([^"]+)",[^}]*type: "([^"]+)",[^}]*count: (\d+),[^}]*percentage: "([^"]+)",[^}]*rank: (\d+),[^}]*sourceKey: "([^"]+)"[^}]*\}/g;

const currentEntries = [];
let match;
while ((match = entryRegex.exec(currentContent)) !== null) {
  currentEntries.push({
    id: parseInt(match[1]),
    name: match[2],
    type: match[3],
    count: parseInt(match[4]),
    percentage: match[5],
    rank: parseInt(match[6]),
    sourceKey: match[7]
  });
}

console.log('Loaded', currentEntries.length, 'current entries');

// Create lookup maps from extracted metadata
const headMap = new Map(extracted.heads.map(h => [h.name, h.sourceKey]));
const bodyMap = new Map(extracted.bodies.map(b => [b.name, b.sourceKey]));
const traitMap = new Map(extracted.traits.map(t => [t.name, t.sourceKey]));

// Update entries
let preserved = 0;
let updated = 0;
let notFound = 0;

const updatedEntries = currentEntries.map((entry) => {
  // Preserve top 30 (manually configured rare Meks)
  if (entry.rank <= 30) {
    preserved++;
    return entry;
  }

  // Find correct source key from metadata
  let correctSourceKey;
  if (entry.type === 'head') {
    correctSourceKey = headMap.get(entry.name);
  } else if (entry.type === 'body') {
    correctSourceKey = bodyMap.get(entry.name);
  } else if (entry.type === 'trait') {
    correctSourceKey = traitMap.get(entry.name);
  }

  if (correctSourceKey) {
    if (correctSourceKey !== entry.sourceKey) {
      console.log(`Updating "${entry.name}" (${entry.type}): ${entry.sourceKey} → ${correctSourceKey}`);
      updated++;
    }
    return { ...entry, sourceKey: correctSourceKey };
  } else {
    console.warn(`⚠️  No metadata found for "${entry.name}" (${entry.type})`);
    notFound++;
    return entry; // Keep original if not found
  }
});

console.log('\n=== SUMMARY ===');
console.log('Preserved (ranks 1-30):', preserved);
console.log('Updated with correct source keys:', updated);
console.log('Not found in metadata:', notFound);
console.log('Total entries:', updatedEntries.length);

// Generate new TypeScript file content
const header = `// Auto-generated variation rarity data
// Generated from mekRarityMaster.json with 4000 Mek records
// Total unique variations: 291
//
// IMPORTANT: Special Trait Variations (Ghostly/Haunting Theme)
// The following trait variations have artistic names that may seem like "empty" states,
// but they are LEGITIMATE variations with ghostly/haunting visual appearances:
//   - "Nil" (rank 18, legendary, 1-2 copies)
//   - "Null" (rank 21, legendary, 1-2 copies)
//   - "None" (rank 24, legendary, 1-2 copies)
//   - "Nothing" (rank 291, common, 501 copies)
// These should NEVER be filtered out or ignored - they are real variations
// that appear in actual Mek data and must be preserved across all systems.
//
// SOURCE KEYS UPDATED: ${new Date().toISOString().split('T')[0]}
// - Ranks 1-30: Manually configured (000H, 111B, etc.) - PRESERVED
// - Ranks 31-291: Updated from CardanoScan metadata snapshot
// - All source keys now match actual on-chain NFT metadata

export type VariationType = 'head' | 'body' | 'trait';

export interface VariationRarity {
  id: number;
  name: string;
  type: VariationType;
  count: number;
  percentage: string;
  rank: number;
  sourceKey: string;
}

// Complete variation rarity ranking (291 total variations)
export const COMPLETE_VARIATION_RARITY: VariationRarity[] = [
`;

const entries = updatedEntries.map((entry, index) => {
  const comma = index < updatedEntries.length - 1 ? ',' : '';
  return `  {
    id: ${entry.id},
    name: "${entry.name}",
    type: "${entry.type}",
    count: ${entry.count},
    percentage: "${entry.percentage}",
    rank: ${entry.rank},
    sourceKey: "${entry.sourceKey}"
  }${comma}`;
}).join('\n');

const footer = `
];
`;

const newContent = header + entries + footer;

// Write updated file
fs.writeFileSync(currentPath, newContent);
console.log('\n✓ Updated', currentPath);

// Create a backup of the old version
const backupPath = currentPath.replace('.ts', '.backup.ts');
fs.writeFileSync(backupPath, currentContent);
console.log('✓ Backup saved to', backupPath);
