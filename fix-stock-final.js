const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'essence-market', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Find and replace the Stock section
const stockPattern = /(\{\/\* Stock \*\/\}\s+)<div className="text-center">\s+STOCK\s+<\/div>/;
const stockReplacement = `$1<div className="text-center h-[60px] flex flex-col justify-between">
                  <div className="text-xs text-cyan-300/60 uppercase tracking-wider font-bold">
                    STOCK
                  </div>`;

content = content.replace(stockPattern, stockReplacement);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully fixed Stock section!');
