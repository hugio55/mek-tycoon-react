#!/usr/bin/env node

/**
 * Script to repair payment URLs in the database
 * Strips dashes from NFT UIDs to match NMKR's expected format
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error('❌ Error: NEXT_PUBLIC_CONVEX_URL not found in environment');
  process.exit(1);
}

console.log('[🔧REPAIR] Connecting to Convex:', CONVEX_URL);
const client = new ConvexHttpClient(CONVEX_URL);

try {
  console.log('[🔧REPAIR] Running repairPaymentUrls mutation...');

  const result = await client.mutation(api.commemorativeNFTInventorySetup.repairPaymentUrls, {});

  console.log('[🔧REPAIR] === Results ===');
  console.log('[🔧REPAIR] Total items:', result.totalItems);
  console.log('[🔧REPAIR] Repaired:', result.repairedCount);
  console.log('[🔧REPAIR] Already correct:', result.skippedCount);
  console.log('[🔧REPAIR] Errors:', result.errorCount);

  if (result.repairedCount > 0) {
    console.log('[🔧REPAIR] ✅ Successfully repaired', result.repairedCount, 'payment URLs!');
  } else {
    console.log('[🔧REPAIR] ℹ️ No URLs needed repair');
  }

  process.exit(0);
} catch (error) {
  console.error('[🔧REPAIR] ❌ Error running repair:', error);
  process.exit(1);
}
