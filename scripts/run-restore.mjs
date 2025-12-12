// Script to restore missing meks to production using Convex client
// Usage: node scripts/run-restore.mjs [--dry-run | --execute]

import { ConvexHttpClient } from "convex/browser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Production Convex URL
const PROD_URL = "https://fabulous-sturgeon-691.convex.cloud";

const dataFile = path.join(__dirname, "../backups/meks-repair-2025-12-12/trout_missing_45_meks.json");

// Read the exported meks
const data = JSON.parse(fs.readFileSync(dataFile, "utf8"));
console.log(`Loaded ${data.found} meks from backup\n`);

// Determine mode
const isExecute = process.argv.includes("--execute");
const isDryRun = !isExecute;

console.log(`Mode: ${isDryRun ? "DRY RUN" : "EXECUTE"}\n`);

// Build the args
const args = {
  meks: data.meks,
  dryRun: isDryRun,
};

if (isExecute) {
  args.unlockCode = "I_UNDERSTAND_THIS_WILL_MODIFY_4000_NFTS";
}

// Create client and call mutation
const client = new ConvexHttpClient(PROD_URL);

try {
  const result = await client.mutation("deduplicateMeks:restoreMissingMeks", args);
  console.log("Result:", JSON.stringify(result, null, 2));
} catch (error) {
  console.error("Error:", error.message);
}
