import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

// =============================================================================
// PHASE II: Mek Syncing from Blockchain
// =============================================================================
// This file handles syncing meks from blockchain to database.
// NOTE: goldMiningState is OBSOLETE - jobs are now the income source, not meks.
// Gold accumulation functionality has been removed.
// =============================================================================

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Validates stake address format
 */
function isValidStakeAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  const mainnetRegex = /^stake1[a-z0-9]{53}$/;
  const testnetRegex = /^stake_test1[a-z0-9]{49}$/;
  return mainnetRegex.test(address) || testnetRegex.test(address);
}

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Get user's owned meks
 */
export const getUserMeks = query({
  args: {
    stakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    if (!isValidStakeAddress(args.stakeAddress)) {
      return [];
    }

    const meks = await ctx.db
      .query("meks")
      .withIndex("by_owner_stake", (q: any) => q.eq("ownerStakeAddress", args.stakeAddress))
      .collect();

    return meks;
  },
});

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Store meks for a user (called after Blockfrost verification)
 * Syncs mek ownership from blockchain to database
 */
export const storeMeksForUser = mutation({
  args: {
    stakeAddress: v.string(),
    meks: v.array(v.object({
      assetId: v.string(),
      policyId: v.string(),
      assetName: v.string(),
      imageUrl: v.optional(v.string()),
      goldPerHour: v.number(),
      rarityRank: v.optional(v.number()),
      headVariation: v.optional(v.string()),
      bodyVariation: v.optional(v.string()),
      itemVariation: v.optional(v.string()),
      sourceKey: v.optional(v.string()),
      sourceKeyBase: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    if (!isValidStakeAddress(args.stakeAddress)) {
      throw new Error("Invalid stake address");
    }

    const now = Date.now();
    let totalGoldPerHour = 0;

    // Process each mek
    for (const mekData of args.meks) {
      totalGoldPerHour += mekData.goldPerHour;

      // Check if mek already exists
      const existing = await ctx.db
        .query("meks")
        .withIndex("by_asset_id", (q: any) => q.eq("assetId", mekData.assetId))
        .first();

      if (existing) {
        // Update ownership
        await ctx.db.patch(existing._id, {
          ownerStakeAddress: args.stakeAddress,
          owner: args.stakeAddress, // LEGACY
          goldRate: mekData.goldPerHour,
          iconUrl: mekData.imageUrl,
          verified: true,
          lastUpdated: now,
        });
      } else {
        // Create new mek record
        await ctx.db.insert("meks", {
          assetId: mekData.assetId,
          assetName: mekData.assetName,
          owner: args.stakeAddress, // LEGACY
          ownerStakeAddress: args.stakeAddress,
          iconUrl: mekData.imageUrl,
          verified: true,
          sourceKey: mekData.sourceKey,
          sourceKeyBase: mekData.sourceKeyBase,
          headVariation: mekData.headVariation || '',
          bodyVariation: mekData.bodyVariation || '',
          itemVariation: mekData.itemVariation,
          rarityRank: mekData.rarityRank,
          goldRate: mekData.goldPerHour,
          lastUpdated: now,
        });
      }
    }

    // NOTE: goldMiningState update removed - Phase II uses job slots for income, not passive mining

    return {
      success: true,
      mekCount: args.meks.length,
      totalGoldPerHour, // Still returned for frontend display compatibility
    };
  },
});

// =============================================================================
// ACTIONS (for Blockfrost integration)
// =============================================================================

/**
 * Initialize user mining with Blockfrost verification
 * Syncs meks from blockchain to meks table
 */
export const initializeWithBlockfrost = action({
  args: {
    stakeAddress: v.string(),
    walletType: v.string(),
    walletAddress: v.optional(v.string()),
    paymentAddresses: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    try {
      console.log(`[UserMining] Fetching NFTs from Blockfrost for ${args.stakeAddress}`);

      // Fetch NFTs from Blockfrost
      const nftResult = await ctx.runAction(api.blockfrostNftFetcher.fetchNFTsByStakeAddress, {
        stakeAddress: args.stakeAddress,
        useCache: true
      });

      if (!nftResult.success) {
        throw new Error(nftResult.error || "Failed to fetch NFTs from blockchain");
      }

      console.log(`[UserMining] Found ${nftResult.meks.length} Meks on-chain`);

      // Import getMekDataByNumber function
      const { getMekDataByNumber, getMekImageUrl } = await import("../src/lib/mekNumberToVariation");

      // Map Blockfrost Meks to our format with gold rates
      const meksWithRates = [];
      for (const mek of nftResult.meks) {
        const mekData = getMekDataByNumber(mek.mekNumber);

        if (!mekData) {
          console.warn(`[UserMining] No data found for Mek #${mek.mekNumber}, skipping`);
          continue;
        }

        const imageUrl = getMekImageUrl(mek.mekNumber);

        meksWithRates.push({
          assetId: mek.assetId,
          policyId: mek.policyId,
          assetName: mek.assetName,
          imageUrl: imageUrl,
          goldPerHour: Math.round(mekData.goldPerHour * 100) / 100,
          rarityRank: mekData.finalRank,
          headVariation: mekData.headGroup,
          bodyVariation: mekData.bodyGroup,
          itemVariation: mekData.itemGroup,
          sourceKey: mekData.sourceKey,
          sourceKeyBase: mekData.sourceKey ? mekData.sourceKey.replace(/-[A-Z]$/, '').toLowerCase() : undefined,
        });
      }

      // Store meks using the mutation
      const storeResult = await ctx.runMutation(api.userMiningState.storeMeksForUser, {
        stakeAddress: args.stakeAddress,
        meks: meksWithRates,
      });

      return {
        success: true,
        mekCount: storeResult.mekCount,
        totalGoldPerHour: storeResult.totalGoldPerHour,
        meks: meksWithRates,
      };

    } catch (error: any) {
      console.error("[UserMining] initializeWithBlockfrost error:", error);
      return {
        success: false,
        error: error.message || "Failed to initialize mining",
        mekCount: 0,
        totalGoldPerHour: 0,
        meks: [],
      };
    }
  },
});
