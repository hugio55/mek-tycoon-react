const fs = require('fs');
const path = require('path');

// Load mekRarityMaster.json
const data = require('../convex/mekRarityMaster.json');

const headMap = new Map();
const bodyMap = new Map();
const traitMap = new Map();

// Track conflicts
let conflicts = 0;

data.forEach(m => {
  if (m.sourceKey && m.head && m.body && m.trait) {
    const parts = m.sourceKey.split('-');
    if (parts.length >= 3) {
      const headKey = parts[0].toUpperCase();
      const bodyKey = parts[1].toUpperCase();
      const traitKey = parts.slice(2).join('-').replace(/-B$/i, '').toUpperCase();

      // Head
      if (!headMap.has(headKey)) {
        headMap.set(headKey, m.head);
      } else if (headMap.get(headKey) !== m.head) {
        console.log(`CONFLICT Head: ${headKey} has both "${headMap.get(headKey)}" and "${m.head}"`);
        conflicts++;
      }

      // Body
      if (!bodyMap.has(bodyKey)) {
        bodyMap.set(bodyKey, m.body);
      } else if (bodyMap.get(bodyKey) !== m.body) {
        console.log(`CONFLICT Body: ${bodyKey} has both "${bodyMap.get(bodyKey)}" and "${m.body}"`);
        conflicts++;
      }

      // Trait
      if (!traitMap.has(traitKey)) {
        traitMap.set(traitKey, m.trait);
      } else if (traitMap.get(traitKey) !== m.trait) {
        console.log(`CONFLICT Trait: ${traitKey} has both "${traitMap.get(traitKey)}" and "${m.trait}"`);
        conflicts++;
      }
    }
  }
});

console.log('\n=== STATS ===');
console.log('Total unique head keys:', headMap.size);
console.log('Total unique body keys:', bodyMap.size);
console.log('Total unique trait keys:', traitMap.size);
console.log('Total conflicts:', conflicts);

// Build output
const output = {
  heads: Object.fromEntries(headMap),
  bodies: Object.fromEntries(bodyMap),
  traits: Object.fromEntries(traitMap)
};

// Write to file
const outputPath = path.join(__dirname, '../src/lib/variationNameMap.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
console.log('\nWritten to:', outputPath);