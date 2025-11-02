const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'lib', 'completeVariationRarity.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Fix lines where percentage and rank are on same line
// Pattern: percentage: "0.03",    rank: 1,
// Should be: percentage: "0.03",\n    rank: 1,
content = content.replace(/percentage: "([^"]+)",(\s+)rank: (\d+),/g, 'percentage: "$1",\n    rank: $3,');

fs.writeFileSync(filePath, content, 'utf8');
console.log('✓ Fixed formatting for all variation objects');
