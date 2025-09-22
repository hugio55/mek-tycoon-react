const fs = require('fs');
const path = require('path');

const variationsDir = path.join(__dirname, 'public', 'variation-images');
const files = fs.readdirSync(variationsDir).filter(file => file.endsWith('.png'));

const mappings = {};

files.forEach(file => {
  // Create multiple variations of the key for flexible matching
  const baseName = file.replace('.png', '');

  // Original filename (lowercase)
  mappings[baseName.toUpperCase()] = file;

  // Replace underscores with spaces for better matching
  const withSpaces = baseName.replace(/_/g, ' ').toUpperCase();
  if (withSpaces !== baseName.toUpperCase()) {
    mappings[withSpaces] = file;
  }

  // Also add version without spaces
  const withoutSpaces = baseName.replace(/_/g, '').toUpperCase();
  if (withoutSpaces !== baseName.toUpperCase()) {
    mappings[withoutSpaces] = file;
  }
});

// Generate the TypeScript code
let output = `/**
 * Maps variation names to their image filenames
 * Auto-generated from files in public/variation-images
 */
export const VARIATION_IMAGE_MAP: Record<string, string> = {
`;

Object.entries(mappings).sort().forEach(([key, value]) => {
  output += `  '${key}': '${value}',\n`;
});

output += `  // Default fallback
  'DEFAULT': 'default.png'
};`;

console.log(`Found ${files.length} variation images`);
console.log(`Generated ${Object.keys(mappings).length} mappings`);

// Save to file
fs.writeFileSync('variation-mappings-generated.ts', output);
console.log('Saved to variation-mappings-generated.ts');