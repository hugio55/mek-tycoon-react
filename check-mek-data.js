const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./convex/mekGoldRates.json', 'utf8'));

console.log('Total Meks in JSON:', data.length);

const nums = data.map(m => parseInt(m.asset_id)).sort((a,b) => a-b);
console.log('Min Mek #:', nums[0]);
console.log('Max Mek #:', nums[nums.length-1]);

// Find any gaps in the sequence
const missing = [];
for(let i = 1; i <= 4000; i++) {
  if (!nums.includes(i)) {
    missing.push(i);
  }
}

if (missing.length > 0) {
  console.log('\nMissing Mek numbers:', missing.length);
  console.log('First 20:', missing.slice(0, 20));
} else {
  console.log('\nNo missing Mek numbers - all 4000 present');
}

// Check for duplicates
const duplicates = nums.filter((num, idx) => nums.indexOf(num) !== idx);
if (duplicates.length > 0) {
  console.log('\nDuplicate Mek numbers found:', [...new Set(duplicates)]);
}
