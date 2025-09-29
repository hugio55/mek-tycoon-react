import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { api } from "./_generated/api";

// MEK NFT Policy ID
const MEK_POLICY_ID = "ffa56051fda3d106a96f09c3d209d4bf24a117406fb813fb8b4548e3";

// Initialize or update gold mining for a wallet
export const initializeGoldMining = mutation({
  args: {
    walletAddress: v.string(),
    walletType: v.optional(v.string()),
    paymentAddresses: v.optional(v.array(v.string())), // Payment addresses for Blockfrost fallback
    ownedMeks: v.array(v.object({
      assetId: v.string(),
      policyId: v.string(),
      assetName: v.string(),
      imageUrl: v.optional(v.string()),
      goldPerHour: v.number(),
      rarityRank: v.optional(v.number()),
      headVariation: v.optional(v.string()),
      bodyVariation: v.optional(v.string()),
      itemVariation: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check for ALL records with this wallet (to handle duplicates)
    const allExisting = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .collect();

    const totalGoldPerHour = args.ownedMeks.reduce((sum, mek) => sum + mek.goldPerHour, 0);

    // If we have duplicates, merge them NOW
    if (allExisting.length > 1) {
      console.log(`[GoldMining] Found ${allExisting.length} duplicates for ${args.walletAddress.substring(0, 20)}... - merging`);

      // Keep the oldest record, sum accumulated gold, delete others
      const sorted = allExisting.sort((a, b) => a.createdAt - b.createdAt);
      const primary = sorted[0];
      const duplicates = sorted.slice(1);

      // Sum all accumulated gold from duplicates
      const totalAccumulatedGold = allExisting.reduce((sum, record) => {
        const lastUpdateTime = record.lastSnapshotTime || record.updatedAt || record.createdAt;
        const hoursSinceLastUpdate = (now - lastUpdateTime) / (1000 * 60 * 60);
        const goldSinceLastUpdate = record.totalGoldPerHour * hoursSinceLastUpdate;
        return sum + Math.min(50000, (record.accumulatedGold || 0) + goldSinceLastUpdate);
      }, 0);

      // Update primary with merged data
      await ctx.db.patch(primary._id, {
        walletType: args.walletType,
        paymentAddresses: args.paymentAddresses,
        ownedMeks: args.ownedMeks,
        totalGoldPerHour: totalGoldPerHour,
        accumulatedGold: Math.min(50000, totalAccumulatedGold),
        lastSnapshotTime: now,
        lastActiveTime: now,
        updatedAt: now,
      });

      // Delete all duplicates
      for (const dup of duplicates) {
        await ctx.db.delete(dup._id);
      }

      console.log(`[GoldMining] Merged ${duplicates.length} duplicates, total gold: ${totalAccumulatedGold.toFixed(2)}`);

      return {
        currentGold: Math.min(50000, totalAccumulatedGold),
        totalGoldPerHour
      };
    }

    const existing = allExisting[0];

    if (existing) {
      // Calculate current gold for display (but don't save it)
      const lastUpdateTime = existing.lastSnapshotTime || existing.createdAt;
      const hoursSinceLastUpdate = (now - lastUpdateTime) / (1000 * 60 * 60);
      const goldSinceLastUpdate = existing.totalGoldPerHour * hoursSinceLastUpdate;
      const currentGold = Math.min(50000, (existing.accumulatedGold || 0) + goldSinceLastUpdate);

      // Update the wallet info AND the gold rate when meks change
      await ctx.db.patch(existing._id, {
        walletType: args.walletType,
        paymentAddresses: args.paymentAddresses,
        ownedMeks: args.ownedMeks,
        totalGoldPerHour: totalGoldPerHour, // UPDATE the rate with new meks!
        lastActiveTime: now,
        updatedAt: now,
      });

      return {
        currentGold,
        totalGoldPerHour // Return the new calculated rate
      };
    } else {
      // Create new record - starts UNVERIFIED
      const newRecord = await ctx.db.insert("goldMining", {
        walletAddress: args.walletAddress,
        walletType: args.walletType,
        paymentAddresses: args.paymentAddresses,
        ownedMeks: args.ownedMeks,
        totalGoldPerHour,
        accumulatedGold: 0,
        isBlockchainVerified: false, // NEW: Starts unverified, must verify to earn gold
        lastSnapshotTime: now,
        lastActiveTime: now,
        createdAt: now,
        updatedAt: now,
      });

      return {
        currentGold: 0,
        totalGoldPerHour
      };
    }
  },
});

// Get gold mining data for a wallet
export const getGoldMiningData = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const data = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!data) {
      return null;
    }

    // VERIFICATION CHECK: Only accumulate gold if wallet is verified
    let currentGold = data.accumulatedGold || 0;

    if (data.isBlockchainVerified === true) {
      // Calculate: accumulated gold + (time since last update × current rate)
      const lastUpdateTime = data.lastSnapshotTime || data.updatedAt || data.createdAt;
      const hoursSinceLastUpdate = (now - lastUpdateTime) / (1000 * 60 * 60);
      const goldSinceLastUpdate = data.totalGoldPerHour * hoursSinceLastUpdate;
      currentGold = Math.min(50000, (data.accumulatedGold || 0) + goldSinceLastUpdate);
    }
    // If not verified, currentGold stays at accumulatedGold (no new accumulation)

    return {
      ...data,
      currentGold,
      isVerified: data.isBlockchainVerified === true, // Add verification status to response
    };
  },
});

// Update last active time (simplified checkpoint)
export const updateGoldCheckpoint = mutation({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const existing = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!existing) {
      throw new Error("Gold mining data not found for wallet");
    }

    // VERIFICATION CHECK: Only accumulate gold if verified
    let newAccumulatedGold = existing.accumulatedGold || 0;

    if (existing.isBlockchainVerified === true) {
      // Calculate accumulated gold up to this point
      const lastUpdateTime = existing.lastSnapshotTime || existing.updatedAt || existing.createdAt;
      const hoursSinceLastUpdate = (now - lastUpdateTime) / (1000 * 60 * 60);
      const goldSinceLastUpdate = existing.totalGoldPerHour * hoursSinceLastUpdate;
      newAccumulatedGold = Math.min(50000, (existing.accumulatedGold || 0) + goldSinceLastUpdate);
    }
    // If not verified, newAccumulatedGold stays at current level (no new accumulation)

    // Save the snapshot
    await ctx.db.patch(existing._id, {
      accumulatedGold: newAccumulatedGold,
      lastSnapshotTime: now,
      lastActiveTime: now,
      updatedAt: now,
    });

    return {
      success: true,
      accumulatedGold: newAccumulatedGold
    };
  },
});

// Clear only obviously fake test data (admin only)
export const clearAllFakeData = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all gold mining records
    const allMiners = await ctx.db.query("goldMining").collect();

    let deletedCount = 0;
    for (const miner of allMiners) {
      // Only delete if it looks like fake test data:
      // - Starts with "stake1u1" or "stake1u2" etc (common test patterns)
      // - Has exactly 56 hex characters (not a real address format)
      // - Don't delete if it's a hex stake address (like yours) which has 56-58 hex chars
      const addr = miner.walletAddress;
      const isFakeTestData =
        (addr.startsWith("stake1u1") || addr.startsWith("stake1u2") || addr.startsWith("stake1uo")) ||
        (addr.length !== 56 && addr.length !== 58 && !addr.startsWith("stake1"));

      if (isFakeTestData) {
        await ctx.db.delete(miner._id);
        deletedCount++;
      }
    }

    return {
      success: true,
      deletedCount,
      message: `Deleted ${deletedCount} fake test records`
    };
  },
});

// Update last active time (called when user leaves page)
export const updateLastActive = mutation({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const existing = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!existing) {
      // Silently return success if wallet not found (user may have disconnected)
      console.log(`Wallet ${args.walletAddress} not found in database, skipping update`);
      return { success: false, message: "Wallet not found" };
    }

    // Just update last active time - gold is always calculated from creation time
    await ctx.db.patch(existing._id, {
      lastActiveTime: now,
      updatedAt: now,
    });

    return { success: true };
  },
});

// Get gold rates for Meks based on rarity ranking
export const calculateGoldRates = query({
  args: {
    meks: v.array(v.object({
      assetId: v.string(),
      rarityRank: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    // Get the current gold rate configuration
    const goldRateConfig = await ctx.db
      .query("mekGoldRateSaves")
      .withIndex("by_current", (q) => q.eq("isCurrentConfig", true))
      .first();

    if (!goldRateConfig) {
      // Use default linear rates if no config exists
      return args.meks.map(mek => {
        const rank = mek.rarityRank || 2000; // Default to mid-rank if unknown
        // Linear scale from 100 gold/hr (rank 1) to 10 gold/hr (rank 4000)
        const goldPerHour = Math.max(10, 100 - (rank - 1) * 0.0225);
        return {
          assetId: mek.assetId,
          goldPerHour: Math.round(goldPerHour * 100) / 100, // Round to 2 decimals
        };
      });
    }

    // Calculate rates based on the configured curve
    const { curveType, minGold, maxGold, steepness, midPoint, totalMeks } = goldRateConfig;

    return args.meks.map(mek => {
      const rank = mek.rarityRank || totalMeks / 2; // Default to mid-rank if unknown
      const normalizedRank = (rank - 1) / (totalMeks - 1); // Normalize to 0-1

      let goldPerHour: number;

      switch (curveType) {
        case 'exponential':
          goldPerHour = maxGold * Math.exp(-steepness * normalizedRank);
          break;

        case 'logarithmic':
          goldPerHour = maxGold - (maxGold - minGold) * Math.log(1 + steepness * normalizedRank) / Math.log(1 + steepness);
          break;

        case 'sigmoid':
          const sigmoidX = (rank - midPoint) / (totalMeks / 10); // Scale factor for sigmoid
          const sigmoidValue = 1 / (1 + Math.exp(steepness * sigmoidX));
          goldPerHour = minGold + (maxGold - minGold) * sigmoidValue;
          break;

        case 'linear':
        default:
          goldPerHour = maxGold - (maxGold - minGold) * normalizedRank;
          break;
      }

      // Apply rounding based on config
      switch (goldRateConfig.rounding) {
        case 'whole':
          goldPerHour = Math.round(goldPerHour);
          break;
        case '1decimal':
          goldPerHour = Math.round(goldPerHour * 10) / 10;
          break;
        case '2decimal':
          goldPerHour = Math.round(goldPerHour * 100) / 100;
          break;
      }

      return {
        assetId: mek.assetId,
        goldPerHour: Math.max(minGold, Math.min(maxGold, goldPerHour)), // Ensure within bounds
      };
    });
  },
});

// Get all gold mining users (for leaderboard)
export const getTopMiners = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    const miners = await ctx.db
      .query("goldMining")
      .withIndex("by_total_rate")
      .order("desc")
      .take(limit);

    return miners.map(miner => ({
      walletAddress: miner.walletAddress,
      totalGoldPerHour: miner.totalGoldPerHour,
      currentGold: miner.currentGold,
      mekCount: miner.ownedMeks.length,
    }));
  },
});

// Get all gold mining data for admin dashboard
export const getAllGoldMiningData = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const allMiners = await ctx.db.query("goldMining").collect();

    return allMiners.map(miner => {
      // Calculate: accumulated gold + (time since last update × current rate)
      // VERIFICATION CHECK: Only accumulate if verified
      let currentGold = miner.accumulatedGold || 0;

      if (miner.isBlockchainVerified === true) {
        const lastUpdateTime = miner.lastSnapshotTime || miner.updatedAt || miner.createdAt;
        const hoursSinceLastUpdate = (now - lastUpdateTime) / (1000 * 60 * 60);
        const goldSinceLastUpdate = miner.totalGoldPerHour * hoursSinceLastUpdate;
        currentGold = Math.min(50000, (miner.accumulatedGold || 0) + goldSinceLastUpdate);
      }

      // Calculate time since last active
      const minutesSinceActive = Math.floor((now - miner.lastActiveTime) / (1000 * 60));
      const hoursSinceActive = Math.floor(minutesSinceActive / 60);
      const daysSinceActive = Math.floor(hoursSinceActive / 24);

      let lastActiveDisplay = "Just now";
      if (daysSinceActive > 0) {
        lastActiveDisplay = `${daysSinceActive}d ago`;
      } else if (hoursSinceActive > 0) {
        lastActiveDisplay = `${hoursSinceActive}h ago`;
      } else if (minutesSinceActive > 0) {
        lastActiveDisplay = `${minutesSinceActive}m ago`;
      }

      // Get highest gold rate Mek
      const highestRateMek = miner.ownedMeks.reduce((best, mek) =>
        mek.goldPerHour > (best?.goldPerHour || 0) ? mek : best,
        miner.ownedMeks[0]
      );

      return {
        _id: miner._id,
        walletAddress: miner.walletAddress,
        walletType: miner.walletType || "Unknown",
        mekCount: miner.ownedMeks.length,
        totalGoldPerHour: miner.totalGoldPerHour,
        currentGold: Math.max(0, Math.floor(currentGold * 100) / 100), // Ensure no negative values
        lastActiveTime: miner.lastActiveTime,
        lastActiveDisplay,
        createdAt: miner.createdAt,
        isVerified: miner.isBlockchainVerified === true, // Add verification status
        lastVerificationTime: miner.lastVerificationTime || null,
        highestRateMek: highestRateMek ? {
          name: highestRateMek.assetName,
          rate: highestRateMek.goldPerHour,
          rank: highestRateMek.rarityRank
        } : null,
        ownedMeks: miner.ownedMeks,
      };
    });
  },
});

// Server-side NFT verification and initialization with Blockfrost
export const initializeWithBlockfrost = action({
  args: {
    walletAddress: v.string(),
    stakeAddress: v.string(),
    walletType: v.string(),
    paymentAddresses: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    try {
      console.log(`[GoldMining] Fetching NFTs from Blockfrost for ${args.stakeAddress}`);

      // Verify wallet authentication first
      const authCheck = await ctx.runQuery(api.walletAuthentication.checkAuthentication, {
        stakeAddress: args.stakeAddress
      });

      if (!authCheck.authenticated) {
        throw new Error("Wallet not authenticated. Please sign the verification message.");
      }

      // Fetch NFTs from Blockfrost
      const nftResult = await ctx.runAction(api.blockfrostNftFetcher.fetchNFTsByStakeAddress, {
        stakeAddress: args.stakeAddress,
        useCache: true
      });

      if (!nftResult.success) {
        throw new Error(nftResult.error || "Failed to fetch NFTs from blockchain");
      }

      console.log(`[GoldMining] Found ${nftResult.meks.length} Meks on-chain`);

      // Import getMekDataByNumber function
      const { getMekDataByNumber, getMekImageUrl } = await import("../src/lib/mekNumberToVariation");

      // Map Blockfrost Meks to our format with gold rates
      const meksWithRates = [];
      for (const mek of nftResult.meks) {
        // Get proper Mek data with variation-based gold rates
        const mekData = getMekDataByNumber(mek.mekNumber);

        if (!mekData) {
          console.warn(`[GoldMining] No data found for Mek #${mek.mekNumber}, skipping`);
          continue;
        }

        const imageUrl = getMekImageUrl(mek.mekNumber);

        meksWithRates.push({
          assetId: mek.assetId,
          policyId: mek.policyId,
          assetName: mek.assetName,
          mekNumber: mek.mekNumber,
          imageUrl: imageUrl,
          goldPerHour: Math.round(mekData.goldPerHour * 100) / 100,
          rarityRank: mekData.finalRank,
          headVariation: mekData.headGroup,
          bodyVariation: mekData.bodyGroup,
          itemVariation: mekData.itemGroup,
          sourceKey: mekData.sourceKey
        });
      }

      // Initialize or update gold mining record
      // Strip fields not in the mutation validator (mekNumber, sourceKey)
      const meksForMutation = meksWithRates.map(m => ({
        assetId: m.assetId,
        policyId: m.policyId,
        assetName: m.assetName,
        imageUrl: m.imageUrl,
        goldPerHour: m.goldPerHour,
        rarityRank: m.rarityRank,
        headVariation: m.headVariation,
        bodyVariation: m.bodyVariation,
        itemVariation: m.itemVariation
      }));

      await ctx.runMutation(api.goldMining.initializeGoldMining, {
        walletAddress: args.walletAddress,
        walletType: args.walletType,
        paymentAddresses: args.paymentAddresses,
        ownedMeks: meksForMutation
      });

      return {
        success: true,
        meks: meksWithRates,
        mekCount: meksWithRates.length,
        totalGoldPerHour: meksWithRates.reduce((sum, m) => sum + m.goldPerHour, 0)
      };

    } catch (error: any) {
      console.error("[GoldMining] Blockfrost initialization error:", error);
      return {
        success: false,
        error: error.message || "Failed to initialize with Blockfrost",
        mekCount: 0,
        totalGoldPerHour: 0
      };
    }
  }
});

// Helper function to calculate gold rate based on Mek number
function calculateGoldRateForMek(mekNumber: number): number {
  // Linear scale from 100 gold/hr (Mek #1) to 10 gold/hr (Mek #4000)
  const maxRate = 100;
  const minRate = 10;
  const maxMekNumber = 4000;

  const rate = maxRate - ((mekNumber - 1) / (maxMekNumber - 1)) * (maxRate - minRate);
  return Math.round(rate * 100) / 100; // Round to 2 decimals
}

// Check if wallet is verified (for UI prompts)
export const isWalletVerified = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const data = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!data) {
      return {
        exists: false,
        isVerified: false,
        lastVerificationTime: null
      };
    }

    return {
      exists: true,
      isVerified: data.isBlockchainVerified === true,
      lastVerificationTime: data.lastVerificationTime || null
    };
  },
});

// NUCLEAR OPTION: Complete factory reset for production launch (ADMIN ONLY)
export const factoryResetForProduction = mutation({
  args: {
    confirmationCode: v.string(),
  },
  handler: async (ctx, args) => {
    // Security check - must provide correct confirmation code
    const expectedCode = "FACTORY_RESET_CONFIRMED";
    if (args.confirmationCode !== expectedCode) {
      throw new Error("Invalid confirmation code. Operation cancelled for safety.");
    }

    let totalDeleted = 0;
    const breakdown: Record<string, number> = {};

    // 1. Clear goldMining (ALL wallet connections and current states)
    const goldMining = await ctx.db.query("goldMining").collect();
    for (const record of goldMining) {
      await ctx.db.delete(record._id);
      totalDeleted++;
    }
    breakdown.goldMining = goldMining.length;

    // 2. Clear goldSnapshots (hourly snapshots)
    const goldSnapshots = await ctx.db.query("goldSnapshots").collect();
    for (const snapshot of goldSnapshots) {
      await ctx.db.delete(snapshot._id);
      totalDeleted++;
    }
    breakdown.goldSnapshots = goldSnapshots.length;

    // 3. Clear mekOwnershipHistory (6-hour blockchain snapshots)
    const ownershipHistory = await ctx.db.query("mekOwnershipHistory").collect();
    for (const history of ownershipHistory) {
      await ctx.db.delete(history._id);
      totalDeleted++;
    }
    breakdown.ownershipHistory = ownershipHistory.length;

    // 4. Clear goldMiningSnapshotLogs (snapshot execution logs)
    const snapshotLogs = await ctx.db.query("goldMiningSnapshotLogs").collect();
    for (const log of snapshotLogs) {
      await ctx.db.delete(log._id);
      totalDeleted++;
    }
    breakdown.snapshotLogs = snapshotLogs.length;

    // 5. Clear goldCheckpoints (manual checkpoints)
    const checkpoints = await ctx.db.query("goldCheckpoints").collect();
    for (const checkpoint of checkpoints) {
      await ctx.db.delete(checkpoint._id);
      totalDeleted++;
    }
    breakdown.checkpoints = checkpoints.length;

    // 6. Clear goldBackups (disaster recovery backups)
    const goldBackups = await ctx.db.query("goldBackups").collect();
    for (const backup of goldBackups) {
      await ctx.db.delete(backup._id);
      totalDeleted++;
    }
    breakdown.goldBackups = goldBackups.length;

    // 7. Clear goldBackupUserData (backup records)
    const backupUserData = await ctx.db.query("goldBackupUserData").collect();
    for (const data of backupUserData) {
      await ctx.db.delete(data._id);
      totalDeleted++;
    }
    breakdown.goldBackupUserData = backupUserData.length;

    // 8. Clear walletSignatures (authentication data)
    const walletSignatures = await ctx.db.query("walletSignatures").collect();
    for (const sig of walletSignatures) {
      await ctx.db.delete(sig._id);
      totalDeleted++;
    }
    breakdown.walletSignatures = walletSignatures.length;

    // 9. Clear auditLogs (verification logs)
    const auditLogs = await ctx.db.query("auditLogs").collect();
    for (const log of auditLogs) {
      await ctx.db.delete(log._id);
      totalDeleted++;
    }
    breakdown.auditLogs = auditLogs.length;

    return {
      success: true,
      message: "🚀 FACTORY RESET COMPLETE - System is now in pristine state for production launch",
      totalRecordsDeleted: totalDeleted,
      deletedBreakdown: breakdown
    };
  },
});

// Get gold mining statistics
export const getGoldMiningStats = query({
  args: {},
  handler: async (ctx) => {
    const allMiners = await ctx.db.query("goldMining").collect();

    if (allMiners.length === 0) {
      return {
        totalUsers: 0,
        totalMeks: 0,
        totalGoldPerHour: 0,
        totalGoldAccumulated: 0,
        averageMeksPerUser: 0,
        averageGoldPerHour: 0,
        topWalletType: "None",
        activeUsersLast24h: 0,
      };
    }

    const now = Date.now();
    const last24h = now - (24 * 60 * 60 * 1000);

    // Calculate totals
    const totalMeks = allMiners.reduce((sum, miner) => sum + miner.ownedMeks.length, 0);
    const totalGoldPerHour = allMiners.reduce((sum, miner) => sum + miner.totalGoldPerHour, 0);

    // Calculate accumulated gold using update time method (only for VERIFIED wallets)
    const totalGoldAccumulated = allMiners.reduce((sum, miner) => {
      let currentGold = miner.accumulatedGold || 0;

      // Only accumulate if verified
      if (miner.isBlockchainVerified === true) {
        const lastUpdateTime = miner.lastSnapshotTime || miner.updatedAt || miner.createdAt;
        const hoursSinceLastUpdate = (now - lastUpdateTime) / (1000 * 60 * 60);
        const goldSinceLastUpdate = miner.totalGoldPerHour * hoursSinceLastUpdate;
        currentGold = Math.min(50000, (miner.accumulatedGold || 0) + goldSinceLastUpdate);
      }

      return sum + Math.max(0, currentGold); // Ensure no negative values
    }, 0);

    // Count wallet types
    const walletTypes: Record<string, number> = {};
    allMiners.forEach(miner => {
      const type = miner.walletType || "unknown";
      walletTypes[type] = (walletTypes[type] || 0) + 1;
    });

    // Find most popular wallet type
    const topWalletType = Object.entries(walletTypes)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || "None";

    // Count active users in last 24h
    const activeUsersLast24h = allMiners.filter(
      miner => miner.lastActiveTime > last24h
    ).length;

    return {
      totalUsers: allMiners.length,
      totalMeks,
      totalGoldPerHour: Math.floor(totalGoldPerHour * 100) / 100,
      totalGoldAccumulated: Math.max(0, Math.floor(totalGoldAccumulated * 100) / 100), // Ensure no negative values
      averageMeksPerUser: Math.floor((totalMeks / allMiners.length) * 10) / 10,
      averageGoldPerHour: Math.floor((totalGoldPerHour / allMiners.length) * 100) / 100,
      topWalletType,
      activeUsersLast24h,
      walletTypeBreakdown: walletTypes,
    };
  },
});

// Reset all gold mining data (admin function)
export const resetAllGoldMiningData = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all gold mining records
    const allRecords = await ctx.db.query("goldMining").collect();

    // Delete each record
    for (const record of allRecords) {
      await ctx.db.delete(record._id);
    }

    return {
      success: true,
      deletedCount: allRecords.length
    };
  },
});