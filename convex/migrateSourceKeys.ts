import { internalMutation, action } from "./_generated/server";
import { internal } from "./_generated/api";
import mekGoldRates from './mekGoldRates.json';

/**
 * PUBLIC ACTION: Trigger sourceKey population migration
 * Call this from admin interface to fix missing sourceKeys
 */
export const runSourceKeyMigration = action({
  args: {},
  handler: async (ctx) => {
    console.log('[Migration Action] Triggering sourceKey population...');
    const result = await ctx.runMutation(internal.migrateSourceKeys.populateSourceKeys);
    return result;
  }
});

/**
 * Parse Mek number from asset name
 * Examples: "Mek #2268", "Mekanism #795", "Mek2268" -> 2268
 */
function parseMekNumber(assetName: string): number | null {
  const patterns = [
    /Mekanism\s*#?\s*(\d+)/i,
    /Mek\s*#?\s*(\d+)/i,
    /^(\d+)$/
  ];

  for (const pattern of patterns) {
    const match = assetName.match(pattern);
    if (match) {
      const number = parseInt(match[1]);
      if (!isNaN(number) && number >= 1 && number <= 4000) {
        return number;
      }
    }
  }
  return null;
}

/**
 * MIGRATION: Populate missing sourceKey and sourceKeyBase fields in goldMining records
 *
 * This fixes records that were created before sourceKey fields were implemented.
 * Uses Mek number (from assetName) to look up the sourceKey from mekGoldRates.json
 */
export const populateSourceKeys = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log('[Migration] Starting sourceKey population...');

    // Build lookup map: mekNumber -> sourceKey
    const mekNumberToSourceKey = new Map<number, string>();

    mekGoldRates.forEach((mek: any) => {
      const mekNumber = parseInt(mek.asset_id);
      if (!isNaN(mekNumber) && mek.source_key) {
        mekNumberToSourceKey.set(mekNumber, mek.source_key);
      }
    });

    console.log(`[Migration] Built lookup map with ${mekNumberToSourceKey.size} entries`);

    // Get all goldMining records
    const allRecords = await ctx.db.query("goldMining").collect();
    console.log(`[Migration] Found ${allRecords.length} goldMining records`);

    let updatedRecords = 0;
    let updatedMeks = 0;

    for (const record of allRecords) {
      let needsUpdate = false;
      const updatedOwnedMeks = record.ownedMeks.map((mek, idx) => {
        // Skip if already has sourceKey
        if (mek.sourceKey) {
          return mek;
        }

        // Parse Mek number from asset name
        const mekNumber = parseMekNumber(mek.assetName);
        if (!mekNumber) {
          console.warn(`[Migration] Could not parse Mek number from: ${mek.assetName}`);
          return mek;
        }

        // Look up sourceKey by Mek number
        const sourceKey = mekNumberToSourceKey.get(mekNumber);
        if (sourceKey) {
          needsUpdate = true;
          updatedMeks++;

          // Generate sourceKeyBase (lowercase without suffix like -B, -C)
          const sourceKeyBase = sourceKey.replace(/-[A-Z]$/i, '').toLowerCase();

          console.log(`[Migration] ✓ ${mek.assetName} (#${mekNumber}): ${sourceKey} -> ${sourceKeyBase}`);

          return {
            ...mek,
            sourceKey,
            sourceKeyBase
          };
        } else {
          console.warn(`[Migration] ✗ No sourceKey found for ${mek.assetName} (#${mekNumber})`);
        }

        return mek;
      });

      // Update record if any Meks were modified
      if (needsUpdate) {
        await ctx.db.patch(record._id, {
          ownedMeks: updatedOwnedMeks,
          updatedAt: Date.now()
        });
        updatedRecords++;
      }
    }

    console.log('[Migration] Complete!');
    console.log(`[Migration] Updated ${updatedRecords} records`);
    console.log(`[Migration] Populated ${updatedMeks} Mek sourceKeys`);

    return {
      success: true,
      updatedRecords,
      updatedMeks,
      totalRecords: allRecords.length
    };
  }
});
