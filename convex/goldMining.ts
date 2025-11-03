import { v } from "convex/values";
import { mutation, query, action, internalMutation, internalAction } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { api, internal } from "./_generated/api";
import { calculateCurrentGold, GOLD_CAP, calculateGoldIncrease, validateGoldInvariant } from "./lib/goldCalculations";
import { devLog } from "./lib/devLog";

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
      sourceKey: v.optional(v.string()),
      sourceKeyBase: v.optional(v.string()),
      // Level boost fields (optional to preserve backward compatibility)
      baseGoldPerHour: v.optional(v.number()),
      currentLevel: v.optional(v.number()),
      levelBoostPercent: v.optional(v.number()),
      levelBoostAmount: v.optional(v.number()),
      effectiveGoldPerHour: v.optional(v.number()),
      // Custom name field (optional, must be unique within wallet)
      customName: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // CRITICAL: Only accept stake addresses to prevent duplicates
    if (!args.walletAddress.startsWith('stake1')) {
      devLog.errorAlways(`[GoldMining] REJECTED non-stake address: ${args.walletAddress}`);

      // LOG: Non-stake address rejection (security event)
      await ctx.scheduler.runAfter(0, internal.monitoring.logEvent, {
        eventType: "warning",
        category: "gold",
        message: "Non-stake address rejected during initialization",
        severity: "high",
        functionName: "initializeGoldMining",
        walletAddress: args.walletAddress,
        details: { reason: "Only stake addresses are accepted" },
      });

      return {
        success: false,
        error: "Only stake addresses are accepted. Please use stake address format."
      };
    }

    // Check for ALL records with this wallet (to handle duplicates)
    const allExisting = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .collect();

    // ALSO check for hex/payment address duplicates
    const stakeSuffix = args.walletAddress.slice(-8);
    const allWallets = await ctx.db.query("goldMining").collect();
    const potentialDuplicates = allWallets.filter(w =>
      w.walletAddress !== args.walletAddress &&
      (w.walletAddress.includes(stakeSuffix) ||
       w.walletAddress.includes('fe6012f1') || // Common hex suffix
       w.walletAddress.startsWith('01d9d9cf8225') || // Hex prefix
       w.walletAddress.startsWith('addr1')) // Payment address
    );

    // Merge any found duplicates
    if (potentialDuplicates.length > 0) {
      devLog.log(`[GoldMining] Found ${potentialDuplicates.length} potential duplicates to merge`);
      for (const dup of potentialDuplicates) {
        devLog.log(`[GoldMining] Deleting duplicate: ${dup.walletAddress.substring(0, 20)}...`);
        await ctx.db.delete(dup._id);
      }
    }

    // Calculate separate base and boost rates for accurate tracking
    const baseGoldPerHour = args.ownedMeks.reduce(
      (sum, mek) => sum + (mek.baseGoldPerHour || mek.goldPerHour || 0),
      0
    );
    const boostGoldPerHour = args.ownedMeks.reduce(
      (sum, mek) => sum + (mek.levelBoostAmount || 0),
      0
    );
    const totalGoldPerHour = baseGoldPerHour + boostGoldPerHour;

    devLog.log('[INIT MUTATION] ================================');
    devLog.log('[INIT MUTATION] initializeGoldMining called:', {
      timestamp: new Date().toISOString(),
      wallet: args.walletAddress.substring(0, 20) + '...',
      mekCount: args.ownedMeks.length,
      baseGoldPerHour: baseGoldPerHour.toFixed(2),
      boostGoldPerHour: boostGoldPerHour.toFixed(2),
      totalGoldPerHour: totalGoldPerHour.toFixed(2)
    });

    // Check if level boost data is being passed
    const meksWithBoosts = args.ownedMeks.filter(mek => mek.levelBoostAmount && mek.levelBoostAmount > 0);
    devLog.log('[INIT MUTATION] Meks with level boosts:', {
      count: meksWithBoosts.length,
      totalBoost: meksWithBoosts.reduce((sum, mek) => sum + (mek.levelBoostAmount || 0), 0).toFixed(2)
    });

    // If we have duplicates, merge them NOW
    if (allExisting.length > 1) {
      devLog.log(`[GoldMining] Found ${allExisting.length} duplicates for ${args.walletAddress.substring(0, 20)}... - merging`);

      // Keep the oldest record, sum accumulated gold, delete others
      const sorted = allExisting.sort((a, b) => a.createdAt - b.createdAt);
      const primary = sorted[0];
      const duplicates = sorted.slice(1);

      // Sum all accumulated gold from duplicates
      const totalAccumulatedGold = allExisting.reduce((sum, record) => {
        const currentGold = calculateCurrentGold({
          accumulatedGold: record.accumulatedGold || 0,
          goldPerHour: record.totalGoldPerHour,
          lastSnapshotTime: record.lastSnapshotTime || record.updatedAt || record.createdAt,
          isVerified: true,
          consecutiveSnapshotFailures: record.consecutiveSnapshotFailures || 0
        });
        return sum + currentGold;
      }, 0);

      // Update primary with merged data - NO CAP
      await ctx.db.patch(primary._id, {
        walletType: args.walletType,
        paymentAddresses: args.paymentAddresses,
        ownedMeks: args.ownedMeks,
        baseGoldPerHour,
        boostGoldPerHour,
        totalGoldPerHour,
        accumulatedGold: totalAccumulatedGold, // CRITICAL FIX: NO CAP
        lastSnapshotTime: now,
        lastActiveTime: now,
        updatedAt: now,
      });

      // Delete all duplicates
      for (const dup of duplicates) {
        await ctx.db.delete(dup._id);
      }

      devLog.log(`[GoldMining] Merged ${duplicates.length} duplicates, total gold: ${totalAccumulatedGold.toFixed(2)}`);

      // LOG: Duplicate wallet merge (data integrity event)
      await ctx.scheduler.runAfter(0, internal.monitoring.logEvent, {
        eventType: "warning",
        category: "gold",
        message: `Merged ${duplicates.length} duplicate wallet records`,
        severity: "medium",
        functionName: "initializeGoldMining",
        walletAddress: args.walletAddress,
        details: {
          duplicateCount: duplicates.length,
          totalGoldMerged: totalAccumulatedGold,
          primaryRecordId: primary._id,
        },
      });

      return {
        currentGold: totalAccumulatedGold, // CRITICAL FIX: NO CAP
        totalGoldPerHour
      };
    }

    const existing = allExisting[0];

    if (existing) {
      // Calculate current gold for display (but don't save it)
      const currentGold = calculateCurrentGold({
        accumulatedGold: existing.accumulatedGold || 0,
        goldPerHour: existing.totalGoldPerHour,
        lastSnapshotTime: existing.lastSnapshotTime || existing.createdAt,
        isVerified: true,
        consecutiveSnapshotFailures: existing.consecutiveSnapshotFailures || 0
      });

      // Update the wallet info AND the gold rate when meks change
      devLog.log('[INIT MUTATION] Updating existing record:', {
        existingRate: existing.totalGoldPerHour,
        newRate: totalGoldPerHour,
        existingMekCount: existing.ownedMeks.length,
        newMekCount: args.ownedMeks.length
      });

      await ctx.db.patch(existing._id, {
        walletType: args.walletType,
        paymentAddresses: args.paymentAddresses,
        ownedMeks: args.ownedMeks,
        baseGoldPerHour, // UPDATE base rate
        boostGoldPerHour, // UPDATE boost rate
        totalGoldPerHour, // UPDATE the total rate with new meks!
        lastActiveTime: now,
        updatedAt: now,
      });

      devLog.log('[INIT MUTATION] Record updated successfully');
      devLog.log('[INIT MUTATION] ================================');

      // REMOVED: Automatic blockchain sync on every login
      // Snapshots should ONLY be created by the 6-hour cron job
      // This was causing snapshots on every page refresh

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
        baseGoldPerHour,
        boostGoldPerHour,
        totalGoldPerHour,
        accumulatedGold: 0,
        totalCumulativeGold: 0, // Initialize cumulative gold for new wallets
        isBlockchainVerified: false, // NEW: Starts unverified, must verify to earn gold
        lastSnapshotTime: now,
        lastActiveTime: now,
        createdAt: now,
        updatedAt: now,
        version: 0, // Initialize version for concurrency control
      });

      // REMOVED: Automatic blockchain sync on every login
      // Snapshots should ONLY be created by the 6-hour cron job
      // This was causing snapshots on every page refresh

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

    devLog.log('[QUERY] ===================================');
    devLog.log('[QUERY] getGoldMiningData called:', {
      timestamp: new Date().toISOString(),
      wallet: args.walletAddress.substring(0, 20) + '...',
      storedTotalRate: data.totalGoldPerHour,
      storedBaseRate: data.baseGoldPerHour,
      storedBoostRate: data.boostGoldPerHour,
      mekCount: data.ownedMeks.length
    });

    // Use stored rates (updated by mutations) - no need to recalculate on every query
    // Mutations keep these synchronized, so reading them is fast and accurate
    const baseRate = data.baseGoldPerHour || 0;
    const boostRate = data.boostGoldPerHour || 0;
    const totalRate = data.totalGoldPerHour || 0;

    devLog.log('[QUERY] Using stored rates (fast read):', {
      baseRate: baseRate.toFixed(2),
      boostRate: boostRate.toFixed(2),
      totalRate: totalRate.toFixed(2)
    });

    // Log each Mek's contribution
    devLog.log('[QUERY] Individual Mek rates:');
    data.ownedMeks.forEach((mek, idx) => {
      devLog.log(`  [${idx + 1}] ${mek.assetName}:`, {
        goldPerHour: mek.goldPerHour,
        baseGoldPerHour: mek.baseGoldPerHour,
        currentLevel: mek.currentLevel,
        levelBoostPercent: mek.levelBoostPercent,
        levelBoostAmount: mek.levelBoostAmount,
        effectiveGoldPerHour: mek.effectiveGoldPerHour
      });
    });

    // Check if level boost data is missing
    const meksWithBoosts = data.ownedMeks.filter(mek => mek.levelBoostAmount && mek.levelBoostAmount > 0);
    const meksWithLevelField = data.ownedMeks.filter(mek => mek.currentLevel && mek.currentLevel > 1);

    devLog.log('[QUERY] Level boost analysis:', {
      totalMeks: data.ownedMeks.length,
      meksWithBoostAmount: meksWithBoosts.length,
      meksWithLevelField: meksWithLevelField.length,
      meksWithBaseRate: data.ownedMeks.filter(mek => mek.baseGoldPerHour).length
    });

    if (meksWithBoosts.length === 0 && meksWithLevelField.length > 0) {
      devLog.warn('[QUERY] ⚠️ WARNING: Meks have currentLevel > 1 but NO levelBoostAmount! This means level data is not being synced!');
    }

    // VERIFICATION CHECK: Only accumulate gold if wallet is verified
    const currentGold = calculateCurrentGold({
      accumulatedGold: data.accumulatedGold || 0,
      goldPerHour: totalRate,
      lastSnapshotTime: data.lastSnapshotTime || data.updatedAt || data.createdAt,
      isVerified: data.isBlockchainVerified === true,
      consecutiveSnapshotFailures: data.consecutiveSnapshotFailures || 0
    });

    const result = {
      ...data,
      currentGold,
      // Use stored rates (already accurate from mutations)
      baseGoldPerHour: baseRate,
      boostGoldPerHour: boostRate,
      totalGoldPerHour: totalRate,
      isVerified: data.isBlockchainVerified === true, // Add verification status to response
    };

    devLog.log('[QUERY] Returning to frontend:', {
      baseGoldPerHour: result.baseGoldPerHour.toFixed(2),
      boostGoldPerHour: result.boostGoldPerHour.toFixed(2),
      totalGoldPerHour: result.totalGoldPerHour.toFixed(2),
      currentGold: result.currentGold.toFixed(2),
      mekCount: result.ownedMeks.length
    });
    devLog.log('[QUERY] ===================================');

    return result;
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
    let newTotalCumulativeGold = existing.totalCumulativeGold || 0;
    let goldEarnedThisUpdate = 0;

    if (existing.isBlockchainVerified === true) {
      // Calculate accumulated gold up to this point
      const cappedGold = calculateCurrentGold({
        accumulatedGold: existing.accumulatedGold || 0,
        goldPerHour: existing.totalGoldPerHour,
        lastSnapshotTime: existing.lastSnapshotTime || existing.updatedAt || existing.createdAt,
        isVerified: true,
        consecutiveSnapshotFailures: existing.consecutiveSnapshotFailures || 0
      });
      goldEarnedThisUpdate = cappedGold - (existing.accumulatedGold || 0);

      // Use the centralized gold increase function to ensure invariants
      const goldUpdate = calculateGoldIncrease(existing, goldEarnedThisUpdate);
      newAccumulatedGold = goldUpdate.newAccumulatedGold;
      newTotalCumulativeGold = goldUpdate.newTotalCumulativeGold;

      devLog.log('[UPDATE GOLD CHECKPOINT] Gold increase:', {
        goldEarnedThisUpdate,
        oldAccumulated: existing.accumulatedGold || 0,
        newAccumulatedGold,
        oldCumulative: existing.totalCumulativeGold || 0,
        newTotalCumulativeGold
      });

      // LOG: Significant gold accumulation (only if > 10 gold to reduce noise)
      if (goldEarnedThisUpdate > 10) {
        await ctx.scheduler.runAfter(0, internal.monitoring.logEvent, {
          eventType: "info",
          category: "gold",
          message: `Gold accumulated: +${goldEarnedThisUpdate.toFixed(2)} gold`,
          severity: "low",
          functionName: "updateGoldCheckpoint",
          walletAddress: args.walletAddress,
          details: {
            goldEarned: goldEarnedThisUpdate,
            newTotal: newAccumulatedGold,
            rate: existing.totalGoldPerHour,
          },
        });
      }
    } else {
      // If not verified, keep existing values (no new accumulation)
      newAccumulatedGold = existing.accumulatedGold || 0;
      newTotalCumulativeGold = existing.totalCumulativeGold || (existing.accumulatedGold || 0) + (existing.totalGoldSpentOnUpgrades || 0);
    }

    // CRITICAL: Check version for race condition protection (optimistic concurrency control)
    // Re-fetch the latest data to check if version changed during this mutation
    const latestGoldMiningData = await ctx.db.get(existing._id);
    if (!latestGoldMiningData) {
      throw new Error("Gold mining data was deleted during checkpoint update");
    }
    const currentVersion = existing.version || 0;
    const latestVersion = latestGoldMiningData.version || 0;
    if (currentVersion !== latestVersion) {
      // LOG: Concurrent modification detected (race condition)
      await ctx.scheduler.runAfter(0, internal.monitoring.logEvent, {
        eventType: "warning",
        category: "gold",
        message: "Concurrent modification detected during gold checkpoint update",
        severity: "medium",
        functionName: "updateGoldCheckpoint",
        walletAddress: args.walletAddress,
        details: {
          expectedVersion: currentVersion,
          actualVersion: latestVersion,
        },
      });

      throw new Error("Concurrent modification detected. Please refresh and try again.");
    }

    // Save the snapshot with version increment
    await ctx.db.patch(existing._id, {
      accumulatedGold: newAccumulatedGold,
      totalCumulativeGold: newTotalCumulativeGold,
      lastSnapshotTime: now,
      lastActiveTime: now,
      updatedAt: now,
      version: currentVersion + 1, // Increment version to detect concurrent modifications
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
      devLog.log(`Wallet ${args.walletAddress} not found in database, skipping update`);
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
      const currentGold = calculateCurrentGold({
        accumulatedGold: miner.accumulatedGold || 0,
        goldPerHour: miner.totalGoldPerHour,
        lastSnapshotTime: miner.lastSnapshotTime || miner.updatedAt || miner.createdAt,
        isVerified: miner.isBlockchainVerified === true,
        consecutiveSnapshotFailures: miner.consecutiveSnapshotFailures || 0
      });

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
        companyName: miner.companyName || null,
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
      devLog.log(`[GoldMining] Fetching NFTs from Blockfrost for ${args.stakeAddress}`);

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

      devLog.log(`[GoldMining] Found ${nftResult.meks.length} Meks on-chain`);

      // Import getMekDataByNumber function
      const { getMekDataByNumber, getMekImageUrl } = await import("../src/lib/mekNumberToVariation");

      // Map Blockfrost Meks to our format with gold rates
      const meksWithRates = [];
      for (const mek of nftResult.meks) {
        // Get proper Mek data with variation-based gold rates
        const mekData = getMekDataByNumber(mek.mekNumber);

        if (!mekData) {
          devLog.warn(`[GoldMining] No data found for Mek #${mek.mekNumber}, skipping`);
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

      // Get level data for these Meks to include boosts
      const mekLevels = await ctx.runQuery(api.mekLeveling.getMekLevels, {
        walletAddress: args.stakeAddress
      });

      // Create a map for quick level lookup
      const levelMap = new Map(mekLevels.map(level => [level.assetId, level]));

      // Apply level boosts to Mek rates
      const meksWithLevelBoosts = meksWithRates.map(m => {
        const levelData = levelMap.get(m.assetId);
        const currentLevel = levelData?.currentLevel || 1;
        const boostPercent = levelData?.currentBoostPercent || 0;
        const boostAmount = levelData?.currentBoostAmount || 0;

        // Calculate effective rate (base + boost)
        const effectiveRate = m.goldPerHour + boostAmount;

        return {
          ...m,
          baseGoldPerHour: m.goldPerHour, // Store the base rate
          currentLevel: currentLevel,
          levelBoostPercent: boostPercent,
          levelBoostAmount: boostAmount,
          effectiveGoldPerHour: effectiveRate,
          goldPerHour: effectiveRate // Use effective rate as the main rate
        };
      });

      // Initialize or update gold mining record
      // Include level boost fields to preserve upgrade data
      const meksForMutation = meksWithLevelBoosts.map(m => ({
        assetId: m.assetId,
        policyId: m.policyId,
        assetName: m.assetName,
        imageUrl: m.imageUrl,
        goldPerHour: m.goldPerHour, // This is now the effective rate with boost
        rarityRank: m.rarityRank,
        headVariation: m.headVariation,
        bodyVariation: m.bodyVariation,
        itemVariation: m.itemVariation,
        sourceKey: m.sourceKey,
        sourceKeyBase: m.sourceKey ? m.sourceKey.replace(/-[A-Z]$/, '').toLowerCase() : undefined,
        // CRITICAL: Include level boost fields to preserve upgrade data
        baseGoldPerHour: m.baseGoldPerHour,
        currentLevel: m.currentLevel,
        levelBoostPercent: m.levelBoostPercent,
        levelBoostAmount: m.levelBoostAmount,
        effectiveGoldPerHour: m.effectiveGoldPerHour
      }));

      // CRITICAL FIX: Get existing gold mining data and MERGE with new Blockfrost data
      // This prevents overwriting Meks that aren't on the blockchain (from local testing)
      const existingData = await ctx.runQuery(api.goldMining.getGoldMiningData, {
        walletAddress: args.stakeAddress
      });

      let finalMeksList = meksForMutation;

      if (existingData && existingData.ownedMeks.length > meksForMutation.length) {
        devLog.log(`[GoldMining] Merging existing ${existingData.ownedMeks.length} Meks with ${meksForMutation.length} on-chain Meks`);

        // Create a map of on-chain Meks by assetId
        const onChainMekMap = new Map(meksForMutation.map(m => [m.assetId, m]));

        // Start with existing Meks and update with on-chain data where available
        finalMeksList = existingData.ownedMeks.map(existingMek => {
          const onChainMek = onChainMekMap.get(existingMek.assetId);
          if (onChainMek) {
            // Mek is on-chain - use the on-chain data (which includes level boosts)
            return onChainMek;
          } else {
            // Mek not on-chain - keep existing data (preserve level boosts)
            return {
              assetId: existingMek.assetId,
              policyId: existingMek.policyId,
              assetName: existingMek.assetName,
              imageUrl: existingMek.imageUrl,
              goldPerHour: existingMek.goldPerHour,
              rarityRank: existingMek.rarityRank,
              headVariation: existingMek.headVariation,
              bodyVariation: existingMek.bodyVariation,
              itemVariation: existingMek.itemVariation,
              baseGoldPerHour: existingMek.baseGoldPerHour,
              currentLevel: existingMek.currentLevel,
              levelBoostPercent: existingMek.levelBoostPercent,
              levelBoostAmount: existingMek.levelBoostAmount,
              effectiveGoldPerHour: existingMek.effectiveGoldPerHour
            };
          }
        });

        devLog.log(`[GoldMining] Final merged list: ${finalMeksList.length} Meks`);
      }

      // CRITICAL FIX: Always use stake address for database records
      // This prevents duplicate wallets with payment addresses
      await ctx.runMutation(api.goldMining.initializeGoldMining, {
        walletAddress: args.stakeAddress, // ALWAYS use stake address, never payment
        walletType: args.walletType,
        paymentAddresses: args.paymentAddresses,
        ownedMeks: finalMeksList
      });

      return {
        success: true,
        meks: meksWithLevelBoosts, // Return the level-boosted data
        mekCount: meksWithLevelBoosts.length,
        totalGoldPerHour: meksWithLevelBoosts.reduce((sum, m) => sum + m.goldPerHour, 0) // This now includes boosts
      };

    } catch (error: any) {
      devLog.errorAlways("[GoldMining] Blockfrost initialization error:", error);
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

// Get all Meks from all wallets in the corporation (wallet group)
export const getGroupMeks = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the wallet group for this wallet
    const membership = await ctx.db
      .query("walletGroupMemberships")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    let walletsToQuery = [args.walletAddress]; // Default to just this wallet

    if (membership) {
      // Get all wallets in the group
      const allMemberships = await ctx.db
        .query("walletGroupMemberships")
        .withIndex("by_group", (q) => q.eq("groupId", membership.groupId))
        .collect();

      walletsToQuery = allMemberships.map(m => m.walletAddress);
    }

    // Get gold mining data for all wallets
    const allMeks = [];
    for (const wallet of walletsToQuery) {
      const goldMining = await ctx.db
        .query("goldMining")
        .withIndex("by_wallet", (q) => q.eq("walletAddress", wallet))
        .first();

      if (goldMining && goldMining.ownedMeks) {
        // Add wallet source to each Mek
        const meksWithSource = goldMining.ownedMeks.map(mek => ({
          ...mek,
          sourceWallet: wallet
        }));
        allMeks.push(...meksWithSource);
      }
    }

    return {
      meks: allMeks,
      wallets: walletsToQuery
    };
  }
});

// Get aggregated corporation stats (cumulative gold, total gold per hour, etc.)
export const getCorporationStats = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Find the wallet group for this wallet
    const membership = await ctx.db
      .query("walletGroupMemberships")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    let walletsToQuery = [args.walletAddress]; // Default to just this wallet

    if (membership) {
      // Get all wallets in the group
      const allMemberships = await ctx.db
        .query("walletGroupMemberships")
        .withIndex("by_group", (q) => q.eq("groupId", membership.groupId))
        .collect();

      walletsToQuery = allMemberships.map(m => m.walletAddress);
    }

    // Aggregate stats from all wallets
    let totalCumulativeGold = 0;
    let totalCurrentGold = 0;
    let totalGoldPerHour = 0;
    let totalMeks = 0;
    let allVerified = true;

    for (const wallet of walletsToQuery) {
      const goldMining = await ctx.db
        .query("goldMining")
        .withIndex("by_wallet", (q) => q.eq("walletAddress", wallet))
        .first();

      if (goldMining) {
        // Calculate current gold for this wallet
        const currentGold = calculateCurrentGold({
          accumulatedGold: goldMining.accumulatedGold || 0,
          goldPerHour: goldMining.totalGoldPerHour,
          lastSnapshotTime: goldMining.lastSnapshotTime || goldMining.updatedAt || goldMining.createdAt,
          isVerified: goldMining.isBlockchainVerified === true,
          consecutiveSnapshotFailures: goldMining.consecutiveSnapshotFailures || 0
        });

        // Calculate cumulative gold for this wallet
        const goldSinceLastUpdate = currentGold - (goldMining.accumulatedGold || 0);
        let baseCumulativeGold = goldMining.totalCumulativeGold || 0;
        if (!goldMining.totalCumulativeGold || baseCumulativeGold === 0) {
          baseCumulativeGold = (goldMining.accumulatedGold || 0) + (goldMining.totalGoldSpentOnUpgrades || 0);
        }
        const walletCumulativeGold = baseCumulativeGold + goldSinceLastUpdate;

        totalCumulativeGold += walletCumulativeGold;
        totalCurrentGold += currentGold;
        totalGoldPerHour += goldMining.totalGoldPerHour || 0;
        totalMeks += goldMining.ownedMeks?.length || 0;

        if (goldMining.isBlockchainVerified !== true) {
          allVerified = false;
        }
      }
    }

    return {
      totalCumulativeGold,
      totalCurrentGold,
      totalGoldPerHour,
      totalMeks,
      walletCount: walletsToQuery.length,
      allVerified,
    };
  }
});

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

    // 10. Clear mekLevels (Mek level progression data)
    const mekLevels = await ctx.db.query("mekLevels").collect();
    for (const level of mekLevels) {
      await ctx.db.delete(level._id);
      totalDeleted++;
    }
    breakdown.mekLevels = mekLevels.length;

    // 11. Clear levelUpgrades (upgrade transaction logs)
    const levelUpgrades = await ctx.db.query("levelUpgrades").collect();
    for (const upgrade of levelUpgrades) {
      await ctx.db.delete(upgrade._id);
      totalDeleted++;
    }
    breakdown.levelUpgrades = levelUpgrades.length;

    // 12. Clear mekTransferEvents (NFT transfer tracking)
    const transferEvents = await ctx.db.query("mekTransferEvents").collect();
    for (const event of transferEvents) {
      await ctx.db.delete(event._id);
      totalDeleted++;
    }
    breakdown.mekTransferEvents = transferEvents.length;

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
      const currentGold = calculateCurrentGold({
        accumulatedGold: miner.accumulatedGold || 0,
        goldPerHour: miner.totalGoldPerHour,
        lastSnapshotTime: miner.lastSnapshotTime || miner.updatedAt || miner.createdAt,
        isVerified: miner.isBlockchainVerified === true,
        consecutiveSnapshotFailures: miner.consecutiveSnapshotFailures || 0
      });

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

// Company name validation helper
function validateCompanyName(name: string): { valid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: "Company name is required" };
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return { valid: false, error: "Company name must be at least 2 characters" };
  }

  if (trimmed.length > 30) {
    return { valid: false, error: "Company name must be 30 characters or less" };
  }

  // Only allow letters, numbers, and spaces
  const alphanumericRegex = /^[a-zA-Z0-9\s]+$/;
  if (!alphanumericRegex.test(trimmed)) {
    return { valid: false, error: "Company name can only contain letters, numbers, and spaces" };
  }

  // Basic profanity filter (add more terms as needed)
  const profanityWords = ['fuck', 'shit', 'damn', 'hell', 'ass', 'bitch', 'crap', 'piss'];
  const lowerName = trimmed.toLowerCase();
  const hasProfanity = profanityWords.some(word => lowerName.includes(word));

  if (hasProfanity) {
    return { valid: false, error: "Company name contains inappropriate language" };
  }

  return { valid: true };
}

// Set company name for a wallet
export const setCompanyName = mutation({
  args: {
    walletAddress: v.string(),
    companyName: v.string(),
  },
  handler: async (ctx, args) => {
    console.log('[setCompanyName] Mutation called with:', {
      walletAddress: args.walletAddress?.slice(0, 20) + '...',
      companyName: args.companyName
    });

    // Validate company name
    const validation = validateCompanyName(args.companyName);
    if (!validation.valid) {
      console.log('[setCompanyName] Validation failed:', validation.error);
      return {
        success: false,
        error: validation.error
      };
    }

    const trimmedName = args.companyName.trim();

    // Check if company name is already taken (case-insensitive)
    console.log('[setCompanyName] Checking if name is taken...');
    const existingCompany = await ctx.db
      .query("goldMining")
      .filter((q) =>
        q.and(
          q.neq(q.field("walletAddress"), args.walletAddress),
          q.eq(q.field("companyName"), trimmedName)
        )
      )
      .first();

    if (existingCompany) {
      console.log('[setCompanyName] Name already taken by:', existingCompany.walletAddress?.slice(0, 20) + '...');
      return {
        success: false,
        error: "Company name is already taken"
      };
    }

    // Find the user's gold mining record
    console.log('[setCompanyName] Finding user record...');
    const existing = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!existing) {
      console.log('[setCompanyName] User record not found for wallet:', args.walletAddress?.slice(0, 20) + '...');
      return {
        success: false,
        error: "Wallet not found. Please connect your wallet first."
      };
    }

    // Update with the new company name in goldMining table
    console.log('[setCompanyName] Updating company name in goldMining...');
    await ctx.db.patch(existing._id, {
      companyName: trimmedName,
      updatedAt: Date.now(),
    });

    // ALSO update the users table so marketplace can access it
    console.log('[setCompanyName] Syncing company name to users table...');
    const userRecord = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (userRecord) {
      await ctx.db.patch(userRecord._id, {
        companyName: trimmedName,
      });
      console.log('[setCompanyName] Users table updated successfully');
    } else {
      console.log('[setCompanyName] WARNING: User record not found, company name only in goldMining table');
    }

    console.log('[setCompanyName] Success! Company name set to:', trimmedName);
    return {
      success: true,
      companyName: trimmedName
    };
  },
});

// Get company name for a wallet
export const getCompanyName = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const data = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    return {
      companyName: data?.companyName || null,
      hasCompanyName: !!data?.companyName
    };
  },
});

// Check if company name is available
export const checkCompanyNameAvailability = query({
  args: {
    companyName: v.string(),
    currentWalletAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const validation = validateCompanyName(args.companyName);
    if (!validation.valid) {
      return {
        available: false,
        error: validation.error
      };
    }

    const trimmedName = args.companyName.trim();

    // Check if name is taken by someone else
    const existingCompany = await ctx.db
      .query("goldMining")
      .filter((q) =>
        args.currentWalletAddress
          ? q.and(
              q.neq(q.field("walletAddress"), args.currentWalletAddress),
              q.eq(q.field("companyName"), trimmedName)
            )
          : q.eq(q.field("companyName"), trimmedName)
      )
      .first();

    return {
      available: !existingCompany,
      error: existingCompany ? "Company name is already taken" : undefined
    };
  },
});

// Update walletType field (admin utility)
export const updateWalletType = mutation({
  args: {
    walletAddress: v.string(),
    newWalletType: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!existing) {
      throw new Error(`Wallet not found: ${args.walletAddress}`);
    }

    await ctx.db.patch(existing._id, {
      walletType: args.newWalletType,
    });

    return {
      success: true,
      message: `Updated walletType to ${args.newWalletType}`,
    };
  },
});

// Public action to sync a single wallet's NFT data from blockchain
// Can be called manually or automatically when incomplete data is detected
export const syncWalletFromBlockchain = action({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    console.log(`[Auto-Sync] Starting blockchain sync for wallet: ${args.walletAddress}`);

    try {
      // Skip obviously fake test addresses
      if (args.walletAddress.startsWith('stake1u') && args.walletAddress.length < 50) {
        console.log(`[Auto-Sync] Skipping fake test address: ${args.walletAddress}`);
        return { success: false, error: "Test address" };
      }

      // Fetch NFTs from blockchain using Blockfrost
      const walletData = await ctx.runAction(api.blockfrostNftFetcher.fetchNFTsByStakeAddress, {
        stakeAddress: args.walletAddress,
        useCache: false, // Always fetch fresh data
      });

      if (!walletData.success || !walletData.meks) {
        console.error(`[Auto-Sync] Failed to fetch wallet data: ${walletData.error}`);
        return { success: false, error: walletData.error };
      }

      console.log(`[Auto-Sync] Found ${walletData.meks.length} MEKs for ${args.walletAddress}`);

      // Get MEK levels from database
      const allMekLevels = await ctx.runQuery(internal.goldMiningSnapshot.getMekLevelsForWallet, {
        walletAddress: args.walletAddress
      });

      const mekLevelsMap = new Map(
        allMekLevels.map(level => [level.assetId, level])
      );

      // Get existing MEKs for metadata
      const miner = await ctx.runQuery(internal.goldMiningSnapshot.getAllMinersForSnapshot);
      const minerData = miner.find(m => m.walletAddress === args.walletAddress);
      const existingMeksMap = new Map(
        minerData?.ownedMeks?.map(mek => [mek.assetId, mek]) || []
      );

      // Build complete MEK details
      const mekDetails = [];
      let totalGoldPerHour = 0;

      for (const blockchainMek of walletData.meks) {
        const mekLevel = mekLevelsMap.get(blockchainMek.assetId);
        const existingMek = existingMeksMap.get(blockchainMek.assetId);

        if (mekLevel) {
          // Use level data (source of truth)
          const baseGoldPerHour = mekLevel.baseGoldPerHour || 0;
          const levelBoostAmount = mekLevel.currentBoostAmount || 0;
          const effectiveGoldPerHour = baseGoldPerHour + levelBoostAmount;

          mekDetails.push({
            assetId: blockchainMek.assetId,
            assetName: blockchainMek.assetName,
            goldPerHour: effectiveGoldPerHour,
            rarityRank: existingMek?.rarityRank,
            baseGoldPerHour: baseGoldPerHour,
            currentLevel: mekLevel.currentLevel,
            levelBoostPercent: mekLevel.currentBoostPercent || 0,
            levelBoostAmount: levelBoostAmount,
          });

          totalGoldPerHour += effectiveGoldPerHour;
        } else if (existingMek) {
          // Fallback to existing MEK data
          mekDetails.push({
            assetId: blockchainMek.assetId,
            assetName: blockchainMek.assetName,
            goldPerHour: existingMek.goldPerHour,
            rarityRank: existingMek.rarityRank,
            baseGoldPerHour: existingMek.baseGoldPerHour,
            currentLevel: existingMek.currentLevel || 1,
            levelBoostPercent: existingMek.levelBoostPercent || 0,
            levelBoostAmount: existingMek.levelBoostAmount || 0,
          });

          totalGoldPerHour += existingMek.goldPerHour;
        } else {
          // New MEK - fetch variation data
          const { getMekDataByNumber } = await import("../src/lib/mekNumberToVariation");
          const mekData = getMekDataByNumber(blockchainMek.mekNumber);

          if (mekData) {
            const goldPerHour = Math.round(mekData.goldPerHour * 100) / 100;
            mekDetails.push({
              assetId: blockchainMek.assetId,
              assetName: blockchainMek.assetName,
              goldPerHour: goldPerHour,
              rarityRank: mekData.finalRank,
              baseGoldPerHour: goldPerHour,
              currentLevel: 1,
              levelBoostPercent: 0,
              levelBoostAmount: 0,
            });
            totalGoldPerHour += goldPerHour;
          }
        }
      }

      // Update the miner's record
      const mekNumbers = walletData.meks.map((m: any) => m.mekNumber);
      await ctx.runMutation(internal.goldMiningSnapshot.updateMinerAfterSnapshot, {
        walletAddress: args.walletAddress,
        mekCount: walletData.meks.length,
        totalGoldPerHour: totalGoldPerHour,
        mekNumbers: mekNumbers,
        mekDetails: mekDetails,
        snapshotSuccess: true,
      });

      console.log(`[Auto-Sync] Successfully synced ${walletData.meks.length} MEKs, ${totalGoldPerHour.toFixed(2)} gold/hr`);

      return {
        success: true,
        mekCount: walletData.meks.length,
        totalGoldPerHour: totalGoldPerHour
      };
    } catch (error) {
      console.error(`[Auto-Sync] Error syncing wallet ${args.walletAddress}:`, error);
      return { success: false, error: String(error) };
    }
  },
});

// Mek name validation helper
function validateMekName(name: string): { valid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: "Mek name is required" };
  }

  const trimmed = name.trim();

  if (trimmed.length < 1) {
    return { valid: false, error: "Mek name cannot be empty" };
  }

  if (trimmed.length > 20) {
    return { valid: false, error: "Mek name must be 20 characters or less" };
  }

  // Allow letters, numbers, spaces, and basic punctuation (-, ', .)
  const allowedCharsRegex = /^[a-zA-Z0-9\s\-'.]+$/;
  if (!allowedCharsRegex.test(trimmed)) {
    return { valid: false, error: "Mek name can only contain letters, numbers, spaces, hyphens, apostrophes, and periods" };
  }

  return { valid: true };
}

// Set custom name for a Mek
export const setMekName = mutation({
  args: {
    walletAddress: v.string(),
    mekAssetId: v.string(),
    newName: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate the name
    const validation = validateMekName(args.newName);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }

    const trimmedName = args.newName.trim();

    // Find the user's gold mining record
    const existing = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!existing) {
      return {
        success: false,
        error: "Wallet not found. Please connect your wallet first."
      };
    }

    // Check if name is unique within this wallet's owned Meks
    const nameExists = existing.ownedMeks.some(
      mek => mek.customName?.toLowerCase() === trimmedName.toLowerCase() && mek.assetId !== args.mekAssetId
    );

    if (nameExists) {
      return {
        success: false,
        error: "You already have a Mek with this name. Please choose a unique name."
      };
    }

    // Find the Mek in the ownedMeks array and update its name
    const updatedMeks = existing.ownedMeks.map(mek => {
      if (mek.assetId === args.mekAssetId) {
        return {
          ...mek,
          customName: trimmedName
        };
      }
      return mek;
    });

    // Check if we actually found and updated the Mek
    const mekFound = updatedMeks.some(mek => mek.assetId === args.mekAssetId);
    if (!mekFound) {
      return {
        success: false,
        error: "Mek not found in your collection"
      };
    }

    // Update the database
    await ctx.db.patch(existing._id, {
      ownedMeks: updatedMeks,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      customName: trimmedName
    };
  },
});

// Get custom name for a Mek
export const getMekName = query({
  args: {
    walletAddress: v.string(),
    mekAssetId: v.string(),
  },
  handler: async (ctx, args) => {
    const data = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!data) {
      return {
        customName: null,
        hasName: false
      };
    }

    // Find the Mek in the ownedMeks array
    const mek = data.ownedMeks.find(m => m.assetId === args.mekAssetId);

    return {
      customName: mek?.customName || null,
      hasName: !!mek?.customName
    };
  },
});