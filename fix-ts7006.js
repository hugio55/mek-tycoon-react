const fs = require('fs');
const path = require('path');

const baseDir = 'C:\\Users\\Ben Meyers\\Documents\\Mek Tycoon\\TYCOON REACT 8-27\\mek-tycoon-react-staging';

const filesToFix = [
  'convex/mekLeveling.ts',
  'convex/goldBackupScheduler.ts',
  'convex/goldLeaderboard.ts',
  'src/components/MekProfileLightbox.tsx',
  'convex/COMPONENT_LIBRARY_EXAMPLES.ts',
  'convex/nmkrApi.ts',
  'convex/walletAuthentication.ts',
  'src/app/_landing-debug/page.tsx',
  'src/app/admin-investigate-claim/page.tsx',
  'src/components/admin/campaign/CampaignManager.tsx',
  'src/components/GoldBackupAdmin.tsx',
  'src/components/MekRateExperiment.tsx',
  'src/components/MekTalentTreeConfig.tsx',
  'src/components/OverlayEditor.tsx',
  'src/components/PlanetMiningPanel.tsx',
  'src/components/TradeAbuseAdmin.tsx',
  'convex/diagnosticSourceKeys.ts',
  'convex/essence.ts',
  'convex/goldCheckpointingActions.ts',
  'convex/migrateSourceKeys.ts',
  // Additional convex files from earlier list
  'convex/goldMining.ts',
  'convex/goldMiningSnapshot.ts',
  'convex/duplicateWalletDetection.ts',
  'convex/publicCorporation.ts',
];

let fixedCount = 0;

filesToFix.forEach(file => {
  const fullPath = path.join(baseDir, file);

  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping (not found): ${file}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const original = content;

  // Fix common callback patterns that cause TS7006

  // .find(x => ...) to .find((x: any) => ...)
  content = content.replace(/\.find\(([a-z_][a-z_0-9]*)\s*=>/gi, '.find(($1: any) =>');

  // .findIndex(x => ...) to .findIndex((x: any) => ...)
  content = content.replace(/\.findIndex\(([a-z_][a-z_0-9]*)\s*=>/gi, '.findIndex(($1: any) =>');

  // .some(x => ...) to .some((x: any) => ...)
  content = content.replace(/\.some\(([a-z_][a-z_0-9]*)\s*=>/gi, '.some(($1: any) =>');

  // .every(x => ...) to .every((x: any) => ...)
  content = content.replace(/\.every\(([a-z_][a-z_0-9]*)\s*=>/gi, '.every(($1: any) =>');

  // .forEach(x => ...) to .forEach((x: any) => ...)
  content = content.replace(/\.forEach\(([a-z_][a-z_0-9]*)\s*=>/gi, '.forEach(($1: any) =>');

  // .map(x => ...) to .map((x: any) => ...) - already applied but ensure coverage
  content = content.replace(/\.map\(([a-z_][a-z_0-9]*)\s*=>/gi, '.map(($1: any) =>');

  // .map((x, i) => ...) to .map((x: any, i: number) => ...)
  content = content.replace(/\.map\(\(([a-z_][a-z_0-9]*),\s*([a-z_][a-z_0-9]*)\)\s*=>/gi, '.map(($1: any, $2: number) =>');

  // .filter(x => ...) to .filter((x: any) => ...)
  content = content.replace(/\.filter\(([a-z_][a-z_0-9]*)\s*=>/gi, '.filter(($1: any) =>');

  // .reduce((acc, cur) => ...) to .reduce((acc: any, cur: any) => ...)
  content = content.replace(/\.reduce\(\(([a-z_][a-z_0-9]*),\s*([a-z_][a-z_0-9]*)\)\s*=>/gi, '.reduce(($1: any, $2: any) =>');

  // .sort((a, b) => ...) to .sort((a: any, b: any) => ...)
  content = content.replace(/\.sort\(\(([a-z_][a-z_0-9]*),\s*([a-z_][a-z_0-9]*)\)\s*=>/gi, '.sort(($1: any, $2: any) =>');

  // .flatMap(x => ...) to .flatMap((x: any) => ...)
  content = content.replace(/\.flatMap\(([a-z_][a-z_0-9]*)\s*=>/gi, '.flatMap(($1: any) =>');

  // Object.entries(...).map(([k, v]) => ...) to Object.entries(...).map(([k, v]: [any, any]) => ...)
  content = content.replace(/\.map\(\[([a-z_][a-z_0-9]*),\s*([a-z_][a-z_0-9]*)\]\s*=>/gi, '.map(([$1, $2]: [any, any]) =>');

  // Object.entries(...).forEach(([k, v]) => ...)
  content = content.replace(/\.forEach\(\[([a-z_][a-z_0-9]*),\s*([a-z_][a-z_0-9]*)\]\s*=>/gi, '.forEach(([$1, $2]: [any, any]) =>');

  // Fix: already fixed patterns with double types
  content = content.replace(/: any: any/g, ': any');
  content = content.replace(/: number: number/g, ': number');

  if (content !== original) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Fixed: ${file}`);
    fixedCount++;
  } else {
    console.log(`No changes needed: ${file}`);
  }
});

console.log(`\nDone! Fixed ${fixedCount} files.`);
