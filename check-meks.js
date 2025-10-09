const data = require('./convex/mekGoldRates.json');
const ids = data.map(m => parseInt(m.asset_id));
const missing = [];
for(let i=1; i<=4000; i++) {
  if(!ids.includes(i)) missing.push(i);
}
console.log('Total Meks in JSON:', data.length);
console.log('Missing Mek numbers:', missing.length);
if(missing.length > 0) {
  console.log('First 20 missing:', missing.slice(0, 20));
}
console.log('All Meks 1-4000 present:', missing.length === 0);
