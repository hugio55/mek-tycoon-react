const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'essence-market', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Pattern for Stock section container
content = content.replace(
  /({\/\* Stock \*\/}\s+)<div className="text-center">/,
  '$1<div className="text-center h-[60px] flex flex-col justify-between">'
);

// Pattern for Stock number - add flex centering
content = content.replace(
  /className="font-semibold text-cyan-300 leading-none drop-shadow-\[0_0_12px_rgba\(0,255,255,0\.9\)\]"\s+style={{ fontSize: `\$\{stockNumberFontSize\}px` }}/,
  'className="font-semibold text-cyan-300 leading-none drop-shadow-[0_0_12px_rgba(0,255,255,0.9)] flex items-center justify-center"\n                    style={{ fontSize: `${stockNumberFontSize}px` }}'
);

// Pattern for Price section container
content = content.replace(
  /({\/\* Price - Extra responsive sizing for very large numbers \*\/}\s+)<div className="text-center">/,
  '$1<div className="text-center h-[60px] flex flex-col justify-between">'
);

// Remove min-h from price number
content = content.replace(
  /min-h-\[2\.25rem\] /g,
  ''
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated case 34!');
