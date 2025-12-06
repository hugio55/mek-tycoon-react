import { query, action, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

// Comprehensive duplicate wallet detection for anti-cheat monitoring
export const detectDuplicateWallets = query({
  args: {},
  handler: async (ctx) => {
    const allMiners = await ctx.db.query("goldMining").collect();
    const now = Date.now();

    // Type 1: Exact Address Duplicates (DATABASE BUG)
    const addressMap = new Map<string, typeof allMiners>();
    for (const miner of allMiners) {
      const existing = addressMap.get(miner.walletAddress) || [];
      existing.push(miner);
      addressMap.set(miner.walletAddress, existing);
    }

    const exactDuplicates: Array<{
      walletAddress: string;
      count: number;
      records: Array<{
        id: string;
        mekCount: number;
        goldPerHour: number;
        currentGold: number;
        isVerified: boolean;
        lastActive: number;
      }>;
    }> = [];

    for (const [address, records] of addressMap.entries()) {
      if (records.length > 1) {
        exactDuplicates.push({
          walletAddress: address,
          count: records.length,
          records: records.map((r: any) => ({
            id: r._id as string,
            mekCount: r.ownedMeks.length,
            goldPerHour: r.totalGoldPerHour || 0,
            currentGold: r.accumulatedGold || 0,
            isVerified: r.isBlockchainVerified || false,
            lastActive: r.lastActiveTime
          }))
        });
      }
    }

    // Type 2: MEK Fingerprint Duplicates (POTENTIAL CHEATING)
    const fingerprintMap = new Map<string, typeof allMiners>();
    for (const miner of allMiners) {
      const fingerprint = `${miner.ownedMeks.length}_${miner.totalGoldPerHour}`;
      const existing = fingerprintMap.get(fingerprint) || [];
      existing.push(miner);
      fingerprintMap.set(fingerprint, existing);
    }

    const fingerprintDuplicates: Array<{
      fingerprint: string;
      mekCount: number;
      goldPerHour: number;
      walletCount: number;
      wallets: Array<{
        address: string;
        companyName: string | null;
        isVerified: boolean;
        lastActive: number;
        daysSinceActive: number;
      }>;
    }> = [];

    for (const [fingerprint, records] of fingerprintMap.entries()) {
      if (records.length > 1) {
        // Check if these are actually different wallet addresses
        const uniqueAddresses = new Set(records.map((r: any) => r.walletAddress));
        if (uniqueAddresses.size > 1) {
          const [mekCount, goldPerHour] = fingerprint.split('_').map(Number);

          fingerprintDuplicates.push({
            fingerprint,
            mekCount,
            goldPerHour,
            walletCount: uniqueAddresses.size,
            wallets: records.map((r: any) => ({
              address: r.walletAddress,
              companyName: r.companyName || null,
              isVerified: r.isBlockchainVerified || false,
              lastActive: r.lastActiveTime,
              daysSinceActive: Math.floor((now - r.lastActiveTime) / (1000 * 60 * 60 * 24))
            }))
          });
        }
      }
    }

    // Type 3: Asset ID Overlaps (BLOCKCHAIN IMPOSSIBLE - DATA CORRUPTION)
    // Each MEK (asset ID) can only exist in ONE wallet on the blockchain
    const assetToWalletsMap = new Map<string, Array<{
      walletAddress: string;
      assetName: string;
      goldPerHour: number;
    }>>();

    for (const miner of allMiners) {
      for (const mek of miner.ownedMeks) {
        const existing = assetToWalletsMap.get(mek.assetId) || [];
        existing.push({
          walletAddress: miner.walletAddress,
          assetName: mek.assetName,
          goldPerHour: mek.goldPerHour
        });
        assetToWalletsMap.set(mek.assetId, existing);
      }
    }

    const assetOverlaps: Array<{
      assetId: string;
      assetName: string;
      walletCount: number;
      wallets: Array<{
        address: string;
        goldPerHour: number;
      }>;
    }> = [];

    for (const [assetId, wallets] of assetToWalletsMap.entries()) {
      if (wallets.length > 1) {
        assetOverlaps.push({
          assetId,
          assetName: wallets[0].assetName,
          walletCount: wallets.length,
          wallets: wallets.map((w: any) => ({
            address: w.walletAddress,
            goldPerHour: w.goldPerHour
          }))
        });
      }
    }

    // Type 4: Recently Active Duplicates (HIGHEST PRIORITY)
    const recentlyActiveDuplicates = fingerprintDuplicates.filter((dup: any) => {
      // Flag if ANY of the duplicate wallets were active in last 7 days
      const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
      return dup.wallets.some((w: any) => w.lastActive > sevenDaysAgo);
    });

    // Summary Statistics
    const totalWallets = allMiners.length;
    const uniqueAddresses = new Set(allMiners.map((m: any) => m.walletAddress)).size;
    const databaseDuplicateCount = totalWallets - uniqueAddresses;

    return {
      summary: {
        totalDatabaseRecords: totalWallets,
        uniqueWalletAddresses: uniqueAddresses,
        databaseDuplicates: databaseDuplicateCount,
        fingerprintDuplicateGroups: fingerprintDuplicates.length,
        assetOverlaps: assetOverlaps.length,
        recentlyActiveDuplicates: recentlyActiveDuplicates.length
      },

      // Type 1: Same address appearing multiple times (DATABASE BUG)
      exactDuplicates,

      // Type 2: Different addresses with same MEK holdings (POTENTIAL CHEATING)
      fingerprintDuplicates,

      // Type 3: Same MEK appearing in multiple wallets (IMPOSSIBLE - DATA CORRUPTION)
      assetOverlaps,

      // Type 4: Recently active duplicates (INVESTIGATE FIRST)
      recentlyActiveDuplicates
    };
  }
});

// Get detailed history for a specific wallet to check for MEK transfers
export const getWalletMekTransferHistory = query({
  args: {
    walletAddress: v.string()
  },
  handler: async (ctx, args) => {
    // Get all snapshots for this wallet
    const snapshots = await ctx.db
      .query("mekOwnershipHistory")
      .withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress))
      .order("asc")
      .collect();

    if (snapshots.length === 0) {
      return { error: "No snapshot history found" };
    }

    // Track MEK movements
    const transfers: Array<{
      timestamp: number;
      meksAdded: Array<{ assetId: string; assetName: string }>;
      meksRemoved: Array<{ assetId: string; assetName: string }>;
      rateChange: number;
    }> = [];

    for (let i = 1; i < snapshots.length; i++) {
      const current = snapshots[i];
      const previous = snapshots[i - 1];

      const currentAssetIds = new Set(current.meks.map((m: any) => m.assetId));
      const previousAssetIds = new Set(previous.meks.map((m: any) => m.assetId));

      const added = current.meks.filter((m: any) => !previousAssetIds.has(m.assetId));
      const removed = previous.meks.filter((m: any) => !currentAssetIds.has(m.assetId));

      if (added.length > 0 || removed.length > 0) {
        transfers.push({
          timestamp: current.snapshotTime,
          meksAdded: added.map((m: any) => ({ assetId: m.assetId, assetName: m.assetName })),
          meksRemoved: removed.map((m: any) => ({ assetId: m.assetId, assetName: m.assetName })),
          rateChange: current.totalGoldPerHour - previous.totalGoldPerHour
        });
      }
    }

    return {
      walletAddress: args.walletAddress,
      totalSnapshots: snapshots.length,
      firstSnapshot: snapshots[0].snapshotTime,
      lastSnapshot: snapshots[snapshots.length - 1].snapshotTime,
      transferEvents: transfers,
      currentMekCount: snapshots[snapshots.length - 1].totalMekCount,
      currentRate: snapshots[snapshots.length - 1].totalGoldPerHour
    };
  }
});

// Cross-reference MEKs between two wallets to find overlaps
export const compareTwoWallets = query({
  args: {
    wallet1: v.string(),
    wallet2: v.string()
  },
  handler: async (ctx, args) => {
    const miner1 = await ctx.db
      .query("goldMining")
      .withIndex("", (q: any) => q.eq("walletAddress", args.wallet1))
      .first();

    const miner2 = await ctx.db
      .query("goldMining")
      .withIndex("", (q: any) => q.eq("walletAddress", args.wallet2))
      .first();

    if (!miner1 || !miner2) {
      return { error: "One or both wallets not found" };
    }

    const assetIds1 = new Set(miner1.ownedMeks.map((m: any) => m.assetId));
    const assetIds2 = new Set(miner2.ownedMeks.map((m: any) => m.assetId));

    const sharedAssets = miner1.ownedMeks.filter((m: any) => assetIds2.has(m.assetId));
    const wallet1Only = miner1.ownedMeks.filter((m: any) => !assetIds2.has(m.assetId));
    const wallet2Only = miner2.ownedMeks.filter((m: any) => !assetIds1.has(m.assetId));

    // Get snapshot history to see if MEKs were transferred
    const snapshots1 = await ctx.db
      .query("mekOwnershipHistory")
      .withIndex("", (q: any) => q.eq("walletAddress", args.wallet1))
      .order("desc")
      .take(5);

    const snapshots2 = await ctx.db
      .query("mekOwnershipHistory")
      .withIndex("", (q: any) => q.eq("walletAddress", args.wallet2))
      .order("desc")
      .take(5);

    return {
      wallet1: {
        address: args.wallet1,
        companyName: miner1.companyName,
        totalMeks: miner1.ownedMeks.length,
        goldPerHour: miner1.totalGoldPerHour,
        isVerified: miner1.isBlockchainVerified,
        recentSnapshots: snapshots1.length
      },
      wallet2: {
        address: args.wallet2,
        companyName: miner2.companyName,
        totalMeks: miner2.ownedMeks.length,
        goldPerHour: miner2.totalGoldPerHour,
        isVerified: miner2.isBlockchainVerified,
        recentSnapshots: snapshots2.length
      },
      analysis: {
        sharedMeks: sharedAssets.length,
        wallet1OnlyMeks: wallet1Only.length,
        wallet2OnlyMeks: wallet2Only.length,

        // If they share MEKs, this is BLOCKCHAIN IMPOSSIBLE
        blockchainImpossible: sharedAssets.length > 0,

        // If totals match but no shared MEKs, might be legitimate transfer
        likelyTransfer: sharedAssets.length === 0 &&
                       miner1.ownedMeks.length === miner2.ownedMeks.length &&
                       Math.abs(miner1.totalGoldPerHour - miner2.totalGoldPerHour) < 0.01
      },
      sharedAssets: sharedAssets.map((m: any) => ({
        assetId: m.assetId,
        assetName: m.assetName,
        goldPerHour: m.goldPerHour
      }))
    };
  }
});

// Blockchain verification for suspicious wallets
// This uses Blockfrost to verify actual on-chain MEK ownership
export const verifyWalletOnBlockchain = action({
  args: {
    walletAddress: v.string()
  },
  handler: async (ctx, args) => {
    try {
      // Use the existing Blockfrost fetcher to get real blockchain data
      const blockchainData = await ctx.runAction(api.blockfrostNftFetcher.fetchNFTsByStakeAddress, {
        stakeAddress: args.walletAddress,
        useCache: false // Force fresh data
      });

      if (!blockchainData.success) {
        return {
          success: false,
          error: blockchainData.error || "Blockchain query failed",
          walletAddress: args.walletAddress
        };
      }

      // Get database record for comparison
      const dbRecord = await ctx.runQuery(api.duplicateWalletDetection.getWalletDatabaseRecord, {
        walletAddress: args.walletAddress
      });

      if (!dbRecord) {
        return {
          success: false,
          error: "Wallet not found in database",
          walletAddress: args.walletAddress
        };
      }

      // Compare blockchain vs database
      const blockchainMeks = blockchainData.meks || [];
      const databaseMeks = dbRecord.ownedMeks;

      const blockchainAssetIds = new Set(blockchainMeks.map((m: any) => m.assetId));
      const databaseAssetIds = new Set(databaseMeks.map((m: any) => m.assetId));

      const onlyOnBlockchain = blockchainMeks.filter((m: any) => !databaseAssetIds.has(m.assetId));
      const onlyInDatabase = databaseMeks.filter((m: any) => !blockchainAssetIds.has(m.assetId));
      const inBoth = blockchainMeks.filter((m: any) => databaseAssetIds.has(m.assetId));

      const isInSync = onlyOnBlockchain.length === 0 && onlyInDatabase.length === 0;

      return {
        success: true,
        walletAddress: args.walletAddress,
        blockchainMekCount: blockchainMeks.length,
        databaseMekCount: databaseMeks.length,
        isInSync,
        inBoth: inBoth.length,
        onlyOnBlockchain: onlyOnBlockchain.map((m: any) => ({
          assetId: m.assetId,
          assetName: m.assetName,
          mekNumber: m.mekNumber
        })),
        onlyInDatabase: onlyInDatabase.map((m: any) => ({
          assetId: m.assetId,
          assetName: m.assetName
        })),
        verdict: isInSync ? "VERIFIED - Database matches blockchain" :
                onlyInDatabase.length > 0 ? "DESYNC - Database has MEKs not on blockchain (CHEATING?)" :
                "DESYNC - Blockchain has MEKs not in database (needs sync)"
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Verification failed",
        walletAddress: args.walletAddress
      };
    }
  }
});

// Helper query to get wallet database record
export const getWalletDatabaseRecord = query({
  args: {
    walletAddress: v.string()
  },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("goldMining")
      .withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!record) return null;

    return {
      walletAddress: record.walletAddress,
      ownedMeks: record.ownedMeks,
      totalGoldPerHour: record.totalGoldPerHour,
      isVerified: record.isBlockchainVerified || false,
      lastSnapshotTime: record.lastSnapshotTime || null
    };
  }
});

// Automated asset overlap fixer (runs on cron)
export const autoFixAssetOverlaps = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log('[Auto-Fix Asset Overlaps] Starting automated cleanup...');

    // Get all wallets
    const allMiners = await ctx.db.query("goldMining").collect();

    // Build asset → wallets map
    const assetToWalletsMap = new Map<string, Array<{
      walletAddress: string;
      assetName: string;
      goldPerHour: number;
      minerId: any;
    }>>();

    for (const miner of allMiners) {
      for (const mek of miner.ownedMeks) {
        const existing = assetToWalletsMap.get(mek.assetId) || [];
        existing.push({
          walletAddress: miner.walletAddress,
          assetName: mek.assetName,
          goldPerHour: mek.goldPerHour,
          minerId: miner._id
        });
        assetToWalletsMap.set(mek.assetId, existing);
      }
    }

    // Find overlaps
    const overlaps: Array<{
      assetId: string;
      assetName: string;
      wallets: string[];
    }> = [];

    for (const [assetId, wallets] of assetToWalletsMap.entries()) {
      if (wallets.length > 1) {
        overlaps.push({
          assetId,
          assetName: wallets[0].assetName,
          wallets: wallets.map((w: any) => w.walletAddress)
        });
      }
    }

    if (overlaps.length === 0) {
      console.log('[Auto-Fix Asset Overlaps] ✓ No overlaps found');
      return { success: true, fixed: 0, message: "No overlaps" };
    }

    console.log(`[Auto-Fix Asset Overlaps] Found ${overlaps.length} overlaps - auto-fixing...`);

    // For each overlap, keep it only in the wallet with the most recent snapshot
    let fixedCount = 0;

    for (const overlap of overlaps) {
      console.log(`[Auto-Fix Asset Overlaps] Processing ${overlap.assetName}...`);

      // Get the most recent snapshot for each wallet that claims to own this MEK
      const walletsWithSnapshots = await Promise.all(
        overlap.wallets.map(async (walletAddress) => {
          const snapshot = await ctx.db
            .query("mekOwnershipHistory")
            .withIndex("", (q: any) => q.eq("walletAddress", walletAddress))
            .order("desc")
            .first();

          return {
            walletAddress,
            lastSnapshotTime: snapshot?.snapshotTime || 0,
            hasMekInSnapshot: snapshot?.meks.some((m: any) => m.assetId === overlap.assetId) || false
          };
        })
      );

      // Find the wallet with the most recent snapshot that actually contains this MEK
      const validWallets = walletsWithSnapshots.filter((w: any) => w.hasMekInSnapshot);

      if (validWallets.length === 0) {
        console.warn(`[Auto-Fix Asset Overlaps] No valid snapshots found for ${overlap.assetName} - skipping`);
        continue;
      }

      validWallets.sort((a, b) => b.lastSnapshotTime - a.lastSnapshotTime);
      const correctWallet = validWallets[0].walletAddress;

      console.log(`[Auto-Fix Asset Overlaps] Keeping ${overlap.assetName} in ${correctWallet.substring(0, 15)}... (most recent snapshot)`);

      // Remove from all OTHER wallets
      for (const walletAddress of overlap.wallets) {
        if (walletAddress !== correctWallet) {
          const miner = await ctx.db
            .query("goldMining")
            .withIndex("", (q: any) => q.eq("walletAddress", walletAddress))
            .first();

          if (miner) {
            const filteredMeks = miner.ownedMeks.filter((m: any) => m.assetId !== overlap.assetId);
            const newRate = filteredMeks.reduce((sum, m) => sum + (m.goldPerHour || 0), 0);

            await ctx.db.patch(miner._id, {
              ownedMeks: filteredMeks,
              totalGoldPerHour: newRate,
              updatedAt: Date.now()
            });

            console.log(`[Auto-Fix Asset Overlaps]   Removed from ${walletAddress.substring(0, 15)}...`);
          }
        }
      }

      fixedCount++;
    }

    console.log(`[Auto-Fix Asset Overlaps] ✓ Fixed ${fixedCount} overlaps`);

    return {
      success: true,
      fixed: fixedCount,
      message: `Auto-fixed ${fixedCount} asset overlaps`
    };
  }
});

// Fix asset overlaps by verifying blockchain ownership and removing duplicates
export const fixAssetOverlaps = action({
  args: {},
  handler: async (ctx) => {
    console.log('[Fix Asset Overlaps] Starting...');

    // Get all asset overlaps
    const duplicates = await ctx.runQuery(api.duplicateWalletDetection.detectDuplicateWallets);

    if (duplicates.assetOverlaps.length === 0) {
      return {
        success: true,
        message: "No asset overlaps to fix",
        fixed: 0
      };
    }

    let fixedCount = 0;
    const results: Array<{
      assetId: string;
      assetName: string;
      correctWallet: string;
      removedFrom: string[];
    }> = [];

    for (const overlap of duplicates.assetOverlaps) {
      console.log(`[Fix Asset Overlaps] Processing ${overlap.assetName} (${overlap.assetId.substring(0, 20)}...)`);
      console.log(`[Fix Asset Overlaps] Found in ${overlap.walletCount} wallets:`, overlap.wallets.map((w: any) => w.address.substring(0, 15)));

      // Check each wallet on the blockchain to find the real owner
      let correctWallet: string | null = null;
      const walletsToRemoveFrom: string[] = [];

      for (const wallet of overlap.wallets) {
        try {
          console.log(`[Fix Asset Overlaps] Checking blockchain for wallet: ${wallet.address.substring(0, 15)}...`);

          const blockchainData = await ctx.runAction(api.blockfrostNftFetcher.fetchNFTsByStakeAddress, {
            stakeAddress: wallet.address,
            useCache: false // Force fresh data
          });

          if (blockchainData.success && blockchainData.meks) {
            const hasThisMek = blockchainData.meks.some((m: any) => m.assetId === overlap.assetId);

            if (hasThisMek) {
              console.log(`[Fix Asset Overlaps] ✓ Blockchain CONFIRMS wallet ${wallet.address.substring(0, 15)}... owns ${overlap.assetName}`);
              correctWallet = wallet.address;
            } else {
              console.log(`[Fix Asset Overlaps] ✗ Blockchain says wallet ${wallet.address.substring(0, 15)}... does NOT own ${overlap.assetName}`);
              walletsToRemoveFrom.push(wallet.address);
            }
          }
        } catch (error) {
          console.error(`[Fix Asset Overlaps] Error checking wallet ${wallet.address}:`, error);
        }
      }

      if (correctWallet && walletsToRemoveFrom.length > 0) {
        // Remove the MEK from wallets that don't actually own it
        for (const walletToFix of walletsToRemoveFrom) {
          await ctx.runMutation(internal.duplicateWalletDetection.removeMekFromWallet, {
            walletAddress: walletToFix,
            assetId: overlap.assetId,
            assetName: overlap.assetName
          });
        }

        results.push({
          assetId: overlap.assetId,
          assetName: overlap.assetName,
          correctWallet,
          removedFrom: walletsToRemoveFrom
        });

        fixedCount++;
        console.log(`[Fix Asset Overlaps] ✅ Fixed ${overlap.assetName}: kept in ${correctWallet.substring(0, 15)}..., removed from ${walletsToRemoveFrom.length} other wallet(s)`);
      } else if (!correctWallet) {
        console.error(`[Fix Asset Overlaps] ⚠️ Could not find correct owner for ${overlap.assetName} on blockchain!`);
      }
    }

    return {
      success: true,
      message: `Fixed ${fixedCount} asset overlap(s)`,
      fixed: fixedCount,
      details: results
    };
  }
});

// Internal mutation to remove a MEK from a wallet's ownedMeks array
export const removeMekFromWallet = internalMutation({
  args: {
    walletAddress: v.string(),
    assetId: v.string(),
    assetName: v.string()
  },
  handler: async (ctx, args) => {
    const miner = await ctx.db
      .query("goldMining")
      .withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!miner) {
      console.error(`[Remove MEK] Wallet not found: ${args.walletAddress}`);
      return { success: false, error: "Wallet not found" };
    }

    // Filter out the MEK
    const filteredMeks = miner.ownedMeks.filter((m: any) => m.assetId !== args.assetId);
    const removedMek = miner.ownedMeks.find((m: any) => m.assetId === args.assetId);

    if (!removedMek) {
      console.log(`[Remove MEK] MEK ${args.assetName} not found in wallet ${args.walletAddress.substring(0, 15)}...`);
      return { success: false, error: "MEK not found in wallet" };
    }

    // Recalculate total gold per hour
    const newTotalGoldPerHour = filteredMeks.reduce((sum, m) => sum + (m.goldPerHour || 0), 0);
    const goldRateDifference = miner.totalGoldPerHour - newTotalGoldPerHour;

    console.log(`[Remove MEK] Removing ${args.assetName} from ${args.walletAddress.substring(0, 15)}...`);
    console.log(`[Remove MEK] Old rate: ${miner.totalGoldPerHour.toFixed(2)} g/hr, New rate: ${newTotalGoldPerHour.toFixed(2)} g/hr (reduced by ${goldRateDifference.toFixed(2)})`);

    // Update the wallet
    await ctx.db.patch(miner._id, {
      ownedMeks: filteredMeks,
      totalGoldPerHour: newTotalGoldPerHour,
      updatedAt: Date.now()
    });

    console.log(`[Remove MEK] ✅ Successfully removed ${args.assetName} from wallet ${args.walletAddress.substring(0, 15)}...`);

    return {
      success: true,
      removed: args.assetName,
      newMekCount: filteredMeks.length,
      newGoldPerHour: newTotalGoldPerHour,
      goldRateDifference
    };
  }
});
