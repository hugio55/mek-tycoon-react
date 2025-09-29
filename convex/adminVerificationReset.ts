import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Admin function to reset verification status (for testing)
export const resetVerificationStatus = mutation({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const goldMiningRecord = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (goldMiningRecord) {
      // Calculate current gold to "freeze" at this amount
      let pausedGold = goldMiningRecord.accumulatedGold || 0;

      if (goldMiningRecord.isBlockchainVerified === true) {
        const lastUpdateTime = goldMiningRecord.lastSnapshotTime || goldMiningRecord.updatedAt || goldMiningRecord.createdAt;
        const hoursSinceLastUpdate = (now - lastUpdateTime) / (1000 * 60 * 60);
        const goldSinceLastUpdate = goldMiningRecord.totalGoldPerHour * hoursSinceLastUpdate;
        pausedGold = Math.min(50000, (goldMiningRecord.accumulatedGold || 0) + goldSinceLastUpdate);
      }

      // Save the current gold and unverify
      await ctx.db.patch(goldMiningRecord._id, {
        isBlockchainVerified: false,
        lastVerificationTime: undefined,
        accumulatedGold: pausedGold,
        lastSnapshotTime: now,
        updatedAt: now
      });

      console.log(`[Admin] Reset verification for wallet ${args.walletAddress.substring(0, 20)}... (paused at ${pausedGold.toFixed(2)} gold)`);

      return {
        success: true,
        message: `Wallet ${args.walletAddress.substring(0, 20)}... is now UNVERIFIED (paused at ${pausedGold.toFixed(2)} gold). Reload the page to see the changes.`
      };
    } else {
      return {
        success: false,
        message: "Wallet not found in goldMining table"
      };
    }
  }
});

// Admin function to delete a wallet completely (NUCLEAR OPTION - testing only)
export const deleteWallet = mutation({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    let deletedItems = {
      goldMining: 0,
      ownershipHistory: 0,
      goldBackups: 0,
      discordConnections: 0,
    };

    // 1. Delete from goldMining table
    const goldMiningRecord = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (goldMiningRecord) {
      await ctx.db.delete(goldMiningRecord._id);
      deletedItems.goldMining = 1;
    }

    // 2. Delete ALL ownership history snapshots
    const ownershipHistory = await ctx.db
      .query("mekOwnershipHistory")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .collect();

    for (const snapshot of ownershipHistory) {
      await ctx.db.delete(snapshot._id);
      deletedItems.ownershipHistory++;
    }

    // 3. Delete from goldBackups (if exists)
    const backups = await ctx.db.query("goldBackups").collect();
    for (const backup of backups) {
      // Check if this wallet is in the backup
      if (backup.snapshots && Array.isArray(backup.snapshots)) {
        const hasWallet = backup.snapshots.some((s: any) => s.walletAddress === args.walletAddress);
        if (hasWallet) {
          // Remove this wallet from the backup snapshots
          const filteredSnapshots = backup.snapshots.filter((s: any) => s.walletAddress !== args.walletAddress);
          await ctx.db.patch(backup._id, { snapshots: filteredSnapshots });
          deletedItems.goldBackups++;
        }
      }
    }

    // 4. Delete Discord connections (if exists)
    try {
      const discordConnection = await ctx.db
        .query("discordConnections")
        .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
        .first();

      if (discordConnection) {
        await ctx.db.delete(discordConnection._id);
        deletedItems.discordConnections = 1;
      }
    } catch (error) {
      // Discord table might not exist or might not have the index
      console.log("[Admin] Discord connections table not found or no index");
    }

    console.log(`[Admin] NUCLEAR DELETE for wallet ${args.walletAddress.substring(0, 20)}...`);
    console.log(`[Admin] Deleted: ${JSON.stringify(deletedItems)}`);

    return {
      success: true,
      message: `NUCLEAR DELETE complete for ${args.walletAddress.substring(0, 20)}...`,
      details: deletedItems
    };
  }
});

// Admin function to merge duplicate wallets
export const mergeDuplicateWallets = mutation({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    // Find all records for this wallet address
    const allRecords = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .collect();

    if (allRecords.length <= 1) {
      return {
        success: false,
        message: "No duplicates found for this wallet"
      };
    }

    // Find the best record to keep (most recent, verified, or highest gold)
    const sortedRecords = allRecords.sort((a, b) => {
      // Prefer verified over unverified
      if (a.isBlockchainVerified && !b.isBlockchainVerified) return -1;
      if (!a.isBlockchainVerified && b.isBlockchainVerified) return 1;

      // Then prefer highest gold
      const aGold = a.accumulatedGold || 0;
      const bGold = b.accumulatedGold || 0;
      if (aGold !== bGold) return bGold - aGold;

      // Then prefer most recent
      return b.lastActiveTime - a.lastActiveTime;
    });

    const keepRecord = sortedRecords[0];
    const duplicates = sortedRecords.slice(1);

    // Delete the duplicates
    for (const dup of duplicates) {
      await ctx.db.delete(dup._id);
    }

    console.log(`[Admin] Merged ${duplicates.length} duplicate(s) for wallet ${args.walletAddress.substring(0, 20)}...`);
    console.log(`[Admin] Kept record with gold=${keepRecord.accumulatedGold}, verified=${keepRecord.isBlockchainVerified}`);

    return {
      success: true,
      message: `Merged ${duplicates.length} duplicate(s). Kept record with ${keepRecord.accumulatedGold || 0} gold.`,
      mergedCount: duplicates.length
    };
  }
});

// Auto-merge all duplicate wallets (runs via cron)
export const autoMergeDuplicates = mutation({
  args: {},
  handler: async (ctx) => {
    const allRecords = await ctx.db.query("goldMining").collect();

    // Group by wallet address AND by user fingerprint (mekCount + goldPerHour)
    const walletGroups = new Map<string, typeof allRecords>();
    const userFingerprints = new Map<string, typeof allRecords>();

    allRecords.forEach(record => {
      // Group by exact address
      const existing = walletGroups.get(record.walletAddress) || [];
      existing.push(record);
      walletGroups.set(record.walletAddress, existing);

      // Group by user fingerprint (same MEKs + same rate = same user)
      const fingerprint = `${record.ownedMeks.length}_${record.totalGoldPerHour}`;
      const fingerprintGroup = userFingerprints.get(fingerprint) || [];
      fingerprintGroup.push(record);
      userFingerprints.set(fingerprint, fingerprintGroup);
    });

    let mergedCount = 0;
    const results = [];

    // First: Process exact address duplicates
    for (const [walletAddress, records] of walletGroups.entries()) {
      if (records.length <= 1) continue; // No duplicates

      // Sort to find best record
      const sortedRecords = records.sort((a, b) => {
        if (a.isBlockchainVerified && !b.isBlockchainVerified) return -1;
        if (!a.isBlockchainVerified && b.isBlockchainVerified) return 1;
        const aGold = a.accumulatedGold || 0;
        const bGold = b.accumulatedGold || 0;
        if (aGold !== bGold) return bGold - aGold;
        return b.lastActiveTime - a.lastActiveTime;
      });

      const keepRecord = sortedRecords[0];
      const duplicates = sortedRecords.slice(1);

      // Delete duplicates
      for (const dup of duplicates) {
        await ctx.db.delete(dup._id);
      }

      mergedCount += duplicates.length;
      results.push({
        walletAddress: walletAddress.substring(0, 20) + "...",
        duplicatesRemoved: duplicates.length,
        keptGold: keepRecord.accumulatedGold || 0
      });

      console.log(`[AutoMerge] Merged ${duplicates.length} duplicate(s) for wallet ${walletAddress.substring(0, 20)}...`);
    }

    // Second: Process user fingerprint duplicates (same user, different addresses)
    const alreadyMerged = new Set<string>();
    for (const [fingerprint, records] of userFingerprints.entries()) {
      if (records.length <= 1) continue; // No duplicates

      // Filter out records that were already merged in the exact address pass
      const remainingRecords = records.filter(r => {
        try {
          // Check if record still exists
          return !alreadyMerged.has(r._id as string);
        } catch {
          return false;
        }
      });

      if (remainingRecords.length <= 1) continue;

      // Sort to find best record
      const sortedRecords = remainingRecords.sort((a, b) => {
        if (a.isBlockchainVerified && !b.isBlockchainVerified) return -1;
        if (!a.isBlockchainVerified && b.isBlockchainVerified) return 1;
        const aGold = a.accumulatedGold || 0;
        const bGold = b.accumulatedGold || 0;
        if (aGold !== bGold) return bGold - aGold;
        return b.lastActiveTime - a.lastActiveTime;
      });

      const keepRecord = sortedRecords[0];
      const duplicates = sortedRecords.slice(1);

      // Delete duplicates
      for (const dup of duplicates) {
        await ctx.db.delete(dup._id);
        alreadyMerged.add(dup._id as string);
      }

      mergedCount += duplicates.length;
      results.push({
        walletAddress: `FINGERPRINT: ${fingerprint} (${duplicates.length} addresses)`,
        duplicatesRemoved: duplicates.length,
        keptGold: keepRecord.accumulatedGold || 0
      });

      console.log(`[AutoMerge] Merged ${duplicates.length} duplicate address(es) for same user (fingerprint: ${fingerprint})`);
    }

    return {
      success: true,
      totalMerged: mergedCount,
      walletsProcessed: results.length,
      details: results
    };
  }
});

// Admin query to get all wallets with full details
export const getAllWallets = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const allMiners = await ctx.db.query("goldMining").collect();

    // Group by user fingerprint to deduplicate display
    const userGroups = new Map<string, typeof allMiners>();
    allMiners.forEach(miner => {
      const fingerprint = `${miner.ownedMeks.length}_${miner.totalGoldPerHour}`;
      const existing = userGroups.get(fingerprint) || [];
      existing.push(miner);
      userGroups.set(fingerprint, existing);
    });

    // For each user, pick the best record to display
    const dedupedMiners = [];
    for (const [fingerprint, miners] of userGroups.entries()) {
      // Sort to find best record (verified > highest gold > most recent)
      const sorted = miners.sort((a, b) => {
        if (a.isBlockchainVerified && !b.isBlockchainVerified) return -1;
        if (!a.isBlockchainVerified && b.isBlockchainVerified) return 1;
        const aGold = a.accumulatedGold || 0;
        const bGold = b.accumulatedGold || 0;
        if (aGold !== bGold) return bGold - aGold;
        return b.lastActiveTime - a.lastActiveTime;
      });
      dedupedMiners.push(sorted[0]); // Keep only the best one
    }

    return dedupedMiners.map(miner => {
      // Calculate current gold (respecting verification status)
      let currentGold = miner.accumulatedGold || 0;

      if (miner.isBlockchainVerified === true) {
        const lastUpdateTime = miner.lastSnapshotTime || miner.updatedAt || miner.createdAt;
        const hoursSinceLastUpdate = (now - lastUpdateTime) / (1000 * 60 * 60);
        const goldSinceLastUpdate = miner.totalGoldPerHour * hoursSinceLastUpdate;
        currentGold = Math.min(50000, (miner.accumulatedGold || 0) + goldSinceLastUpdate);
      }

      // Time since last active
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

      return {
        _id: miner._id,
        walletAddress: miner.walletAddress,
        walletType: miner.walletType || "Unknown",
        mekCount: miner.ownedMeks.length,
        totalGoldPerHour: miner.totalGoldPerHour,
        currentGold: Math.floor(currentGold * 100) / 100,
        isVerified: miner.isBlockchainVerified === true,
        lastVerificationTime: miner.lastVerificationTime || null,
        lastActiveTime: miner.lastActiveTime,
        lastActiveDisplay,
        createdAt: miner.createdAt,
        updatedAt: miner.updatedAt,
        lastSnapshotTime: miner.lastSnapshotTime || null,
      };
    });
  }
});