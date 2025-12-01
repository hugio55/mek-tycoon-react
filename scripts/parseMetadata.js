// Parse CardanoScan metadata to extract variation names and source keys
const fs = require('fs');
const path = require('path');

const metadataPath = 'C:/Users/Ben Meyers/Documents/TYCOON UNIVERSALS/randoms/metadata/mek-summary.json';
const data = require(metadataPath);

// Maps to store: variation name -> array of source keys found
const headVariations = new Map();
const bodyVariations = new Map();
const traitVariations = new Map();

console.log('Parsing metadata from', data.length, 'entries...\n');

// Process all Meks with metadata
let processed = 0;
data.forEach((entry) => {
  if (!entry.onchain_metadata) return;

  const meta = entry.onchain_metadata;
  const sourceKey = meta['source Key'];

  if (!sourceKey) return;

  // Parse source key: format is "XX#-YY#-ZZ#-B" where XX=body, YY=head, ZZ=trait
  const parts = sourceKey.split('-');
  if (parts.length < 3) return;

  const bodyCode = parts[0];
  const headCode = parts[1];
  const traitCode = parts[2];

  // Store body variation
  const bodyVar = meta['body Variation'];
  if (bodyVar) {
    if (!bodyVariations.has(bodyVar)) {
      bodyVariations.set(bodyVar, []);
    }
    if (!bodyVariations.get(bodyVar).includes(bodyCode)) {
      bodyVariations.get(bodyVar).push(bodyCode);
    }
  }

  // Store head variation
  const headVar = meta['head Variation'];
  if (headVar) {
    if (!headVariations.has(headVar)) {
      headVariations.set(headVar, []);
    }
    if (!headVariations.get(headVar).includes(headCode)) {
      headVariations.get(headVar).push(headCode);
    }
  }

  // Store trait/item variation
  const traitVar = meta['item Variation'];
  if (traitVar) {
    if (!traitVariations.has(traitVar)) {
      traitVariations.set(traitVar, []);
    }
    if (!traitVariations.get(traitVar).includes(traitCode)) {
      traitVariations.get(traitVar).push(traitCode);
    }
  }

  processed++;
});

console.log('Processed', processed, 'Meks with metadata\n');

// Report findings
console.log('=== HEADS ===');
console.log('Unique head variations found:', headVariations.size);
const headIssues = [];
headVariations.forEach((codes, name) => {
  if (codes.length > 1) {
    headIssues.push({ name, codes });
  }
});
if (headIssues.length > 0) {
  console.log('⚠️  Heads with multiple source keys:');
  headIssues.forEach(({ name, codes }) => {
    console.log(`   "${name}": ${codes.join(', ')}`);
  });
} else {
  console.log('✓ All heads have unique source keys');
}

console.log('\n=== BODIES ===');
console.log('Unique body variations found:', bodyVariations.size);
const bodyIssues = [];
bodyVariations.forEach((codes, name) => {
  if (codes.length > 1) {
    bodyIssues.push({ name, codes });
  }
});
if (bodyIssues.length > 0) {
  console.log('⚠️  Bodies with multiple source keys:');
  bodyIssues.forEach(({ name, codes }) => {
    console.log(`   "${name}": ${codes.join(', ')}`);
  });
} else {
  console.log('✓ All bodies have unique source keys');
}

console.log('\n=== TRAITS ===');
console.log('Unique trait variations found:', traitVariations.size);
const traitIssues = [];
traitVariations.forEach((codes, name) => {
  if (codes.length > 1) {
    traitIssues.push({ name, codes });
  }
});
if (traitIssues.length > 0) {
  console.log('⚠️  Traits with multiple source keys:');
  traitIssues.forEach(({ name, codes }) => {
    console.log(`   "${name}": ${codes.join(', ')}`);
  });
} else {
  console.log('✓ All traits have unique source keys');
}

console.log('\n=== TOTAL ===');
const totalVariations = headVariations.size + bodyVariations.size + traitVariations.size;
console.log('Total variations found:', totalVariations);
console.log('Expected: 291 (102 heads + 112 bodies + 77 traits)');

// Export to JSON for easier inspection
const output = {
  heads: Array.from(headVariations.entries()).map(([name, codes]) => ({
    name,
    sourceKey: codes[0], // Use first occurrence
    allCodes: codes
  })).sort((a, b) => a.name.localeCompare(b.name)),

  bodies: Array.from(bodyVariations.entries()).map(([name, codes]) => ({
    name,
    sourceKey: codes[0],
    allCodes: codes
  })).sort((a, b) => a.name.localeCompare(b.name)),

  traits: Array.from(traitVariations.entries()).map(([name, codes]) => ({
    name,
    sourceKey: codes[0],
    allCodes: codes
  })).sort((a, b) => a.name.localeCompare(b.name))
};

const outputPath = path.join(__dirname, 'extracted-variations.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
console.log('\n✓ Exported variations to:', outputPath);
