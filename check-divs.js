const fs = require('fs');
const content = fs.readFileSync('src/app/essence-market/page.tsx', 'utf8');
const lines = content.split('\n');
let divDepth = 0;
for (let i = 2925; i < 6452; i++) {
  const line = lines[i];
  const openDivs = (line.match(/<div\s/g) || []).length - (line.match(/<div[^>]*\/>/g) || []).length;
  const closeDivs = (line.match(/<\/div>/g) || []).length;
  divDepth += openDivs - closeDivs;
  if (divDepth < 0 || divDepth > 40 && openDivs > 0) {
    console.log('Line ' + (i+1) + ': depth=' + divDepth + ', open=' + openDivs + ', close=' + closeDivs);
  }
}
console.log('Final divDepth: ' + divDepth);
