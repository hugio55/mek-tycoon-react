const fs = require('fs');

// Read the rarity data (source of truth)
const rarityContent = fs.readFileSync('src/lib/completeVariationRarity.ts', 'utf8');

// Parse all variations with count
const rarityMatches = rarityContent.matchAll(/{\s*name: "([^"]+)",\s*type: "([^"]+)",\s*count: (\d+),/g);

const heads = [];
const bodies = [];
const traits = [];

for (const match of rarityMatches) {
  const name = match[1];
  const type = match[2];
  const count = parseInt(match[3]);

  // Calculate XP based on count (rarer = more XP)
  // Using similar formula to existing data
  let xp;
  if (count === 1) xp = 53628;
  else if (count <= 2) xp = 52812;
  else if (count <= 3) xp = 52003;
  else if (count <= 4) xp = 51200;
  else if (count <= 5) xp = 50403;
  else if (count <= 6) xp = 49612;
  else if (count <= 7) xp = 48828;
  else if (count <= 8) xp = 48050;
  else if (count <= 9) xp = 47278;
  else if (count <= 10) xp = 46512;
  else if (count <= 11) xp = 45753;
  else if (count <= 12) xp = 45000;
  else if (count <= 13) xp = 44253;
  else if (count <= 14) xp = 43512;
  else if (count <= 15) xp = 42778;
  else if (count <= 16) xp = 42050;
  else if (count <= 17) xp = 41328;
  else if (count <= 18) xp = 40612;
  else if (count <= 19) xp = 39903;
  else if (count <= 20) xp = 39200;
  else if (count <= 21) xp = 38503;
  else if (count <= 22) xp = 37812;
  else if (count <= 23) xp = 37128;
  else if (count <= 24) xp = 36450;
  else if (count <= 25) xp = 35778;
  else if (count <= 26) xp = 35112;
  else if (count <= 27) xp = 34453;
  else if (count <= 28) xp = 33800;
  else if (count <= 30) xp = 32512;
  else if (count <= 31) xp = 31878;
  else if (count <= 32) xp = 31250;
  else if (count <= 33) xp = 30628;
  else if (count <= 34) xp = 30012;
  else if (count <= 35) xp = 29403;
  else if (count <= 36) xp = 28800;
  else if (count <= 37) xp = 28203;
  else if (count <= 38) xp = 27612;
  else if (count <= 39) xp = 27028;
  else if (count <= 41) xp = 25878;
  else if (count <= 42) xp = 25312;
  else if (count <= 43) xp = 24753;
  else if (count <= 44) xp = 24200;
  else if (count <= 45) xp = 23653;
  else if (count <= 46) xp = 23112;
  else if (count <= 49) xp = 21528;
  else if (count <= 50) xp = 21012;
  else if (count <= 51) xp = 20503;
  else if (count <= 52) xp = 20000;
  else if (count <= 53) xp = 19503;
  else if (count <= 54) xp = 19012;
  else if (count <= 55) xp = 18528;
  else if (count <= 56) xp = 18050;
  else if (count <= 57) xp = 17578;
  else if (count <= 58) xp = 17112;
  else if (count <= 59) xp = 16653;
  else if (count <= 60) xp = 16200;
  else if (count <= 63) xp = 14878;
  else if (count <= 64) xp = 14450;
  else if (count <= 65) xp = 14028;
  else if (count <= 67) xp = 13203;
  else if (count <= 68) xp = 12800;
  else if (count <= 69) xp = 12403;
  else if (count <= 70) xp = 12012;
  else if (count <= 72) xp = 11250;
  else if (count <= 73) xp = 10878;
  else if (count <= 74) xp = 10512;
  else if (count <= 75) xp = 10153;
  else if (count <= 76) xp = 9800;
  else if (count <= 77) xp = 9453;
  else if (count <= 78) xp = 9112;
  else if (count <= 79) xp = 8778;
  else if (count <= 80) xp = 8450;
  else if (count <= 81) xp = 8128;
  else if (count <= 83) xp = 7503;
  else if (count <= 85) xp = 6903;
  else if (count <= 86) xp = 6612;
  else if (count <= 89) xp = 5778;
  else if (count <= 90) xp = 5512;
  else if (count <= 91) xp = 5253;
  else if (count <= 92) xp = 5000;
  else if (count <= 93) xp = 4753;
  else if (count <= 94) xp = 4512;
  else if (count <= 96) xp = 4050;
  else if (count <= 97) xp = 3828;
  else if (count <= 98) xp = 3612;
  else if (count <= 99) xp = 3403;
  else if (count <= 101) xp = 3003;
  else if (count <= 104) xp = 2450;
  else if (count <= 106) xp = 2112;
  else if (count <= 109) xp = 1653;
  else if (count <= 111) xp = 1378;
  else if (count <= 117) xp = 703;
  else if (count <= 118) xp = 612;
  else if (count <= 121) xp = 378;
  else if (count <= 125) xp = 153;
  else if (count <= 126) xp = 112;
  else if (count <= 127) xp = 78;
  else if (count <= 129) xp = 28;
  else if (count <= 130) xp = 12;
  else xp = 109; // Nothing trait

  if (type === 'head') {
    heads.push({ name, xp, copies: count });
  } else if (type === 'body') {
    bodies.push({ name, xp, copies: count });
  } else if (type === 'trait') {
    traits.push({ name, xp, copies: count });
  }
}

// Sort by copies descending, then name
const sortFn = (a, b) => b.copies === a.copies ? a.name.localeCompare(b.name) : b.copies - a.copies;
heads.sort(sortFn);
bodies.sort(sortFn);
traits.sort(sortFn);

// Generate file
let output = `// Complete variations data with XP costs from VARIATION_XP_TALENT_TREE.md\n`;
output += `// Generated from completeVariationRarity.ts (288 total variations)\n`;
output += `export const variationsData = {\n`;
output += `  heads: [\n`;
heads.forEach((h, i) => {
  output += `    { name: "${h.name}", xp: ${h.xp}, copies: ${h.copies} }${i < heads.length - 1 ? ',' : ''}\n`;
});
output += `  ],\n`;
output += `  bodies: [\n`;
bodies.forEach((b, i) => {
  output += `    { name: "${b.name}", xp: ${b.xp}, copies: ${b.copies} }${i < bodies.length - 1 ? ',' : ''}\n`;
});
output += `  ],\n`;
output += `  traits: [\n`;
traits.forEach((t, i) => {
  output += `    { name: "${t.name}", xp: ${t.xp}, copies: ${t.copies} }${i < traits.length - 1 ? ',' : ''}\n`;
});
output += `  ]\n`;
output += `};\n\n`;
output += `export const getAllVariations = () => {\n`;
output += `  const all = [\n`;
output += `    ...variationsData.heads.map(v => ({ ...v, type: 'head' })),\n`;
output += `    ...variationsData.bodies.map(v => ({ ...v, type: 'body' })),\n`;
output += `    ...variationsData.traits.map(v => ({ ...v, type: 'trait' }))\n`;
output += `  ];\n`;
output += `  return all.sort((a, b) => a.name.localeCompare(b.name));\n`;
output += `};\n`;

fs.writeFileSync('src/lib/variationsData.ts', output);

console.log('✓ Generated variationsData.ts');
console.log('  Heads:', heads.length);
console.log('  Bodies:', bodies.length);
console.log('  Traits:', traits.length);
console.log('  Total:', heads.length + bodies.length + traits.length);
