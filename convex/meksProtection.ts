/**
 * MEKS TABLE PROTECTION LAYER
 * ============================
 *
 * The `meks` table contains exactly 4000 NFTs that exist on the Cardano blockchain.
 * This number is FIXED and IMMUTABLE:
 * - No new Mekanisms can be minted (collection is closed)
 * - Deleting meks from the database doesn't delete them from the blockchain
 * - The only valid operations are READS and PATCHES (updating ownership, stats, etc.)
 *
 * FORBIDDEN OPERATIONS:
 * - INSERT: Never add new meks (there are only 4000, period)
 * - DELETE: Never remove meks (they still exist on-chain)
 *
 * ALLOWED OPERATIONS:
 * - QUERY: Read mek data
 * - PATCH: Update ownership, tenure, talent trees, slots, etc.
 *
 * INCIDENT HISTORY:
 * - Dec 2025: Accidentally deleted 4000 meks using deleteInvalidMeks function
 *   Had to restore from backup. Never again.
 *
 * If you need to modify this protection, you MUST:
 * 1. Get explicit user approval
 * 2. Create a backup first
 * 3. Document WHY the change is necessary
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Global lock for meks table modifications
 * When true (default), inserts and deletes are BLOCKED
 */
const MEKS_TABLE_LOCKED = true;

/**
 * Emergency unlock code - must be provided to bypass protection
 * This is intentionally NOT a secret - it's a safety check, not security
 */
const EMERGENCY_UNLOCK_CODE = "I_UNDERSTAND_THIS_WILL_MODIFY_4000_NFTS";

/**
 * Check if meks table is locked
 * Use this at the start of any mutation that modifies meks
 */
export function checkMeksTableLock(operation: "insert" | "delete", unlockCode?: string): void {
  if (!MEKS_TABLE_LOCKED) return;

  if (unlockCode === EMERGENCY_UNLOCK_CODE) {
    console.log(`[MEKS-PROTECTION] Emergency unlock accepted for ${operation} operation`);
    return;
  }

  throw new Error(
    `[MEKS-PROTECTION] BLOCKED: Cannot ${operation} from meks table. ` +
    `The meks table contains 4000 immutable NFTs. ` +
    `If this is intentional, provide unlockCode: "${EMERGENCY_UNLOCK_CODE}"`
  );
}

/**
 * Query to verify meks table integrity
 * Returns count and warns if not exactly 4000
 */
export const verifyMeksIntegrity = query({
  args: {},
  handler: async (ctx) => {
    const allMeks = await ctx.db.query("meks").collect();
    const count = allMeks.length;

    const isValid = count === 4000;

    if (!isValid) {
      console.error(`[MEKS-PROTECTION] WARNING: meks table has ${count} entries (expected 4000)`);
    }

    return {
      count,
      expected: 4000,
      isValid,
      status: isValid ? "OK" : "CORRUPTED",
      message: isValid
        ? "Meks table integrity verified: exactly 4000 NFTs"
        : `INTEGRITY ERROR: ${count} meks found (expected 4000). Database may be corrupted.`
    };
  },
});

/**
 * SAFE mek update - only allows patching, never insert/delete
 * Use this instead of direct ctx.db.patch for meks
 */
export const safePatchMek = mutation({
  args: {
    assetId: v.string(),
    updates: v.object({
      owner: v.optional(v.string()),
      ownerStakeAddress: v.optional(v.string()),
      tenurePoints: v.optional(v.number()),
      lastTenureUpdate: v.optional(v.number()),
      isSlotted: v.optional(v.boolean()),
      slotNumber: v.optional(v.number()),
      customName: v.optional(v.string()),
      // Add other patchable fields as needed
    }),
  },
  handler: async (ctx, args) => {
    const mek = await ctx.db
      .query("meks")
      .withIndex("by_asset_id", (q: any) => q.eq("assetId", args.assetId))
      .first();

    if (!mek) {
      throw new Error(`[MEKS-PROTECTION] Mek not found: ${args.assetId}`);
    }

    // Safe to patch - this doesn't add or remove meks
    await ctx.db.patch(mek._id, args.updates as any);

    return { success: true, assetId: args.assetId };
  },
});

/**
 * Get protection status
 */
export const getProtectionStatus = query({
  args: {},
  handler: async (ctx) => {
    const mekCount = (await ctx.db.query("meks").collect()).length;

    return {
      locked: MEKS_TABLE_LOCKED,
      mekCount,
      expectedCount: 4000,
      integrityOk: mekCount === 4000,
      message: MEKS_TABLE_LOCKED
        ? "Meks table is LOCKED. Inserts and deletes are blocked."
        : "WARNING: Meks table is UNLOCKED. Use extreme caution.",
    };
  },
});
