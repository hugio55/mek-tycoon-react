const fs = require('fs');
const lines = fs.readFileSync('trout_meks.json', 'utf8').split('\n').filter(x => x && !x.startsWith('Showing'));
const meks = lines.map(l => { try { return JSON.parse(l); } catch(e) { return null; } }).filter(x => x);

const WRENCO = 'stake1u8zevs34vf4wrsz6xs64zuztdk4agzvpg6c8zv4plesp9ughgq076';

// Get mek numbers
function getMekNumber(m) {
  const nameMatch = m.assetName && m.assetName.match(/#(\d+)/);
  if (nameMatch) return parseInt(nameMatch[1]);
  const hexMatch = m.assetId && m.assetId.match(/4d656b616e69736d(\d+)/);
  if (hexMatch) return parseInt(hexMatch[1]);
  return null;
}

// Find the 42 duplicate mek numbers
const dupMekNumbers = [14,176,179,304,338,406,795,860,995,1052,1059,1252,1286,1337,1436,1568,1785,1817,2024,2051,2147,2191,2268,2557,2561,2683,2685,2722,2829,2871,2922,3040,3177,3185,3262,3386,3520,3575,3605,3678,3910,3972];

console.log('Analyzing the 42 duplicate mek numbers...\n');

let wrencoInDups = 0;
let bothSameOwner = 0;
let differentOwners = 0;

dupMekNumbers.forEach(mekNum => {
  const dupes = meks.filter(m => getMekNumber(m) === mekNum);
  if (dupes.length === 2) {
    const owners = dupes.map(d => d.owner);
    const hasWrenco = owners.some(o => o === WRENCO);
    if (hasWrenco) wrencoInDups++;

    if (owners[0] === owners[1]) {
      bothSameOwner++;
    } else {
      differentOwners++;
      console.log(`Mek #${mekNum}: Different owners`);
      console.log(`  Owner 1: ${owners[0].substring(0, 30)}...`);
      console.log(`  Owner 2: ${owners[1].substring(0, 30)}...`);
    }
  }
});

console.log('\nSummary:');
console.log('Duplicates involving WrenCo:', wrencoInDups);
console.log('Same owner for both copies:', bothSameOwner);
console.log('Different owners:', differentOwners);

// Check if WrenCo's 87 meks includes duplicates
const wrencoMeks = meks.filter(m => m.owner === WRENCO);
const wrencoMekNums = wrencoMeks.map(m => getMekNumber(m));
const uniqueWrencoNums = new Set(wrencoMekNums);
console.log('\nWrenCo analysis:');
console.log('Total WrenCo records:', wrencoMeks.length);
console.log('Unique WrenCo mek numbers:', uniqueWrencoNums.size);
console.log('WrenCo duplicate records:', wrencoMeks.length - uniqueWrencoNums.size);
