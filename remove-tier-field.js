const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'lib', 'completeVariationRarity.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Remove all lines with tier field (handles multiple spacing patterns)
content = content.replace(/^[ \t]*tier:[ \t]*"[^"]+",?[\r\n]+/gm, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully removed tier fields from completeVariationRarity.ts');
