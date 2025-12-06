import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getSnapshotHistory = query({
  args: {
    walletAddress: v.optional(v.string()),
    companyName: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    let query = ctx.db.query("mekOwnershipHistory");

    if (args.walletAddress) {
      query = query.withIndex("", (q: any) =>
        q.eq("walletAddress", args.walletAddress)
      );
    }

    const snapshots = await query
      .order("desc")
      .take(limit);

    // Get company names for all wallets and filter by company name if provided
    const snapshotsWithCompany = await Promise.all(
      snapshots.map(async (snapshot) => {
        const miner = await ctx.db
          .query("goldMining")
          .withIndex("", (q: any) => q.eq("walletAddress", snapshot.walletAddress))
          .first();

        return {
          _id: snapshot._id,
          walletAddress: snapshot.walletAddress,
          companyName: miner?.companyName || null,
          snapshotTime: snapshot.snapshotTime,
          totalMekCount: snapshot.totalMekCount,
          totalGoldPerHour: snapshot.totalGoldPerHour,
          meks: snapshot.meks,
          spendableGold: snapshot.spendableGold,
          cumulativeGoldEarned: snapshot.cumulativeGoldEarned,
          verificationStatus: snapshot.verificationStatus,
          _creationTime: snapshot._creationTime,
          // Additional fields stored in snapshot
          accumulatedGold: snapshot.accumulatedGold,
          totalCumulativeGold: snapshot.totalCumulativeGold,
          totalGoldSpentOnUpgrades: snapshot.totalGoldSpentOnUpgrades,
          lastActiveTime: snapshot.lastActiveTime,
          lastSnapshotTime: snapshot.lastSnapshotTime,
        };
      })
    );

    // Filter by company name if provided
    if (args.companyName) {
      const searchTerm = args.companyName.toLowerCase();
      return snapshotsWithCompany.filter(snapshot =>
        snapshot.companyName?.toLowerCase().includes(searchTerm)
      );
    }

    return snapshotsWithCompany;
  },
});

export const getSnapshotLogs = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    console.log('[getSnapshotLogs] 🔍 Query executing, fetching up to', limit, 'logs');

    const logs = await ctx.db
      .query("goldMiningSnapshotLogs")
      .order("desc")
      .take(limit);

    console.log('[getSnapshotLogs] 📊 Found', logs.length, 'logs, latest:', logs[0]?.timestamp ? new Date(logs[0].timestamp).toISOString() : 'none');

    return logs;
  },
});

export const getWalletSnapshotTimeline = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const snapshots = await ctx.db
      .query("mekOwnershipHistory")
      .withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress))
      .order("desc")
      .collect();

    return snapshots.map(snapshot => ({
      timestamp: snapshot.snapshotTime,
      mekCount: snapshot.totalMekCount,
      goldPerHour: snapshot.totalGoldPerHour,
      spendableGold: snapshot.spendableGold,
      cumulativeGoldEarned: snapshot.cumulativeGoldEarned,
      meks: snapshot.meks.map(mek => ({
        assetId: mek.assetId,
        assetName: mek.assetName,
        goldPerHour: mek.goldPerHour,
        rarityRank: mek.rarityRank,
      })),
    }));
  },
});

// Delete a single snapshot
export const deleteSnapshot = mutation({
  args: {
    snapshotId: v.id("mekOwnershipHistory"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.snapshotId);
    return { success: true, message: "Snapshot deleted successfully" };
  },
});

// Delete ALL snapshots
export const deleteAllSnapshots = mutation({
  args: {},
  handler: async (ctx) => {
    const allSnapshots = await ctx.db.query("mekOwnershipHistory").collect();

    let deletedCount = 0;
    for (const snapshot of allSnapshots) {
      await ctx.db.delete(snapshot._id);
      deletedCount++;
    }

    return {
      success: true,
      message: `Deleted ${deletedCount} snapshot${deletedCount === 1 ? '' : 's'}`,
      deletedCount
    };
  },
});

// Restore a wallet's data from a specific snapshot
export const restoreFromSnapshot = mutation({
  args: {
    snapshotId: v.id("mekOwnershipHistory"),
  },
  handler: async (ctx, args) => {
    // Get the snapshot
    const snapshot = await ctx.db.get(args.snapshotId);
    if (!snapshot) {
      throw new Error("Snapshot not found");
    }

    // Get the wallet's goldMining record
    const miner = await ctx.db
      .query("goldMining")
      .withIndex("", (q: any) => q.eq("walletAddress", snapshot.walletAddress))
      .first();

    if (!miner) {
      throw new Error(`No goldMining record found for wallet ${snapshot.walletAddress}`);
    }

    // Create a map of existing meks to preserve required fields
    const existingMeksMap = new Map(
      miner.ownedMeks.map(mek => [mek.assetId, mek])
    );

    // Restore the miner's COMPLETE game state from snapshot
    await ctx.db.patch(miner._id, {
      totalGoldPerHour: snapshot.totalGoldPerHour,
      ownedMeks: snapshot.meks.map(mek => {
        const existingMek = existingMeksMap.get(mek.assetId);
        return {
          assetId: mek.assetId,
          policyId: existingMek?.policyId || "", // Preserve existing policyId
          assetName: mek.assetName,
          imageUrl: existingMek?.imageUrl, // Preserve existing image
          goldPerHour: mek.goldPerHour,
          rarityRank: mek.rarityRank,
          headVariation: existingMek?.headVariation,
          bodyVariation: existingMek?.bodyVariation,
          itemVariation: existingMek?.itemVariation,
          baseGoldPerHour: mek.baseGoldPerHour || mek.goldPerHour,
          currentLevel: mek.currentLevel || 1,
          levelBoostPercent: mek.levelBoostPercent || 0,
          levelBoostAmount: mek.levelBoostAmount || 0,
          effectiveGoldPerHour: (mek.baseGoldPerHour || mek.goldPerHour) + (mek.levelBoostAmount || 0),
        };
      }),

      // Restore complete game state
      accumulatedGold: snapshot.accumulatedGold || 0,
      totalCumulativeGold: snapshot.totalCumulativeGold || 0,
      totalGoldSpentOnUpgrades: snapshot.totalGoldSpentOnUpgrades || 0,
      lastActiveTime: snapshot.lastActiveTime || snapshot.snapshotTime,
      lastSnapshotTime: snapshot.lastSnapshotTime || snapshot.snapshotTime,

      updatedAt: Date.now(),
    });

    // Restore Mek levels table to match snapshot state
    // Step 1: Get all existing mekLevels for this wallet
    const existingLevels = await ctx.db
      .query("mekLevels")
      .withIndex("", (q: any) => q.eq("walletAddress", snapshot.walletAddress))
      .collect();

    // Step 2: Create a Set of assetIds in the snapshot
    const snapshotAssetIds = new Set(snapshot.meks.map(m => m.assetId));

    // Step 3: Delete mekLevels records for Meks NOT in the snapshot (sold/transferred)
    for (const level of existingLevels) {
      if (!snapshotAssetIds.has(level.assetId)) {
        await ctx.db.delete(level._id);
      }
    }

    // Step 4: Update or create mekLevels for ALL Meks in snapshot
    const now = Date.now();
    for (const mek of snapshot.meks) {
      const existingLevel = existingLevels.find(l => l.assetId === mek.assetId);
      const mekLevel = mek.currentLevel || 1;
      const mekNumber = parseInt(mek.assetName.replace(/\D/g, '')) || 0;

      if (existingLevel) {
        // Update existing record
        await ctx.db.patch(existingLevel._id, {
          currentLevel: mekLevel,
          currentBoostPercent: mek.levelBoostPercent || 0,
          currentBoostAmount: mek.levelBoostAmount || 0,
          baseGoldPerHour: mek.baseGoldPerHour || mek.goldPerHour,
          mekNumber,
          lastVerifiedAt: now,
          ownershipStatus: "verified",
          updatedAt: now,
        });
      } else {
        // Create new record
        await ctx.db.insert("mekLevels", {
          walletAddress: snapshot.walletAddress,
          assetId: mek.assetId,
          mekNumber,
          currentLevel: mekLevel,
          totalGoldSpent: 0, // Unknown from snapshot - will be 0 for restored levels
          baseGoldPerHour: mek.baseGoldPerHour || mek.goldPerHour,
          currentBoostPercent: mek.levelBoostPercent || 0,
          currentBoostAmount: mek.levelBoostAmount || 0,
          levelAcquiredAt: snapshot.snapshotTime,
          lastVerifiedAt: now,
          ownershipStatus: "verified",
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return {
      success: true,
      message: `Restored ${snapshot.walletAddress.substring(0, 12)}... to snapshot from ${new Date(snapshot.snapshotTime).toLocaleString()}`,
      restoredMekCount: snapshot.meks.length,
      restoredGoldPerHour: snapshot.totalGoldPerHour,
      restoredGold: snapshot.accumulatedGold || 0,
      restoredCumulativeGold: snapshot.totalCumulativeGold || 0,
      restoredSpendableGold: snapshot.spendableGold || 0,
      restoredCumulativeGoldEarned: snapshot.cumulativeGoldEarned || 0,
    };
  },
});