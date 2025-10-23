const fs = require('fs');
const content = fs.readFileSync('src/components/EssenceDistributionLightbox.tsx', 'utf8');
const lines = content.split('\n');

let depth = 0;
let inFunction = false;
const unclosed = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const lineNum = i + 1;

  if (line.includes('export default function EssenceDistributionLightbox')) {
    inFunction = true;
  }

  if (!inFunction) continue;

  // Count opening divs (excluding self-closing)
  const openMatches = line.match(/<div[^>]*(?<!\/)>/g);
  if (openMatches) {
    openMatches.forEach(() => {
      depth++;
      unclosed.push({ line: lineNum, depth, text: line.trim().substring(0, 80) });
    });
  }

  // Count closing divs
  const closeMatches = line.match(/<\/div>/g);
  if (closeMatches) {
    closeMatches.forEach(() => {
      if (unclosed.length > 0) {
        unclosed.pop();
      }
      depth--;
    });
  }

  // Stop at function end
  if (line.trim() === '}' && depth === 0 && inFunction) {
    break;
  }
}

console.log('Unclosed divs:');
unclosed.forEach((item, idx) => {
  console.log(`${idx + 1}. Line ${item.line} (depth ${item.depth}): ${item.text}`);
});
console.log(`\nTotal unclosed: ${unclosed.length}`);
