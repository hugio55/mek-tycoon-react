// Script to restore missing meks to production
// Usage: node scripts/restore-missing-meks.js [--dry-run | --execute]

const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, '../backups/meks-repair-2025-12-12/trout_missing_45_meks.json');
const argsFile = path.join(__dirname, '../backups/meks-repair-2025-12-12/restore_args_temp.json');

// Read the exported meks
const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
console.log(`Loaded ${data.found} meks from backup`);

// Determine mode
const isExecute = process.argv.includes('--execute');
const isDryRun = !isExecute;

// Build the args
const args = {
  meks: data.meks,
  dryRun: isDryRun,
};

if (isExecute) {
  args.unlockCode = 'I_UNDERSTAND_THIS_WILL_MODIFY_4000_NFTS';
}

// Write args to file
fs.writeFileSync(argsFile, JSON.stringify(args));

console.log(`\nMode: ${isDryRun ? 'DRY RUN (use --execute to apply)' : 'EXECUTE MODE'}`);
console.log(`Meks to restore: ${data.meks.length}`);
console.log(`\nArgs written to: ${argsFile}`);
console.log(`\nNow run:`);
console.log(`  cd "${path.dirname(__dirname)}"`);
console.log(`  npx convex run deduplicateMeks:restoreMissingMeks --prod < "${argsFile}"`);
console.log(`\nOr copy the JSON args directly.`);
