import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import { devLog } from "./lib/devLog";

/**
 * CHECKSUM VERIFICATION SYSTEM
 *
 * Automatically detects data integrity issues by:
 * - Calculating checksums for wallet NFT lists
 * - Comparing database state with blockchain reality
 * - Tracking sync status for each wallet
 * - Alerting on mismatches
 */

// Calculate checksum from Mek array
function calculateChecksum(meks: any[]): string {
  if (!meks || meks.length === 0) {
    return "empty_0";
  }

  // Sort by assetId for deterministic ordering
  const sortedAssetIds = meks
    .map(m => m.assetId || m.assetName)
    .filter(Boolean)
    .sort();

  // Create checksum string
  const checksumInput = sortedAssetIds.join('|');

  // Simple hash
  let hash = 0;
  for (let i = 0; i < checksumInput.length; i++) {
    const char = checksumInput.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return `v1_${hash.toString(16)}_n${meks.length}`;
}

// Update checksum for a wallet
export const updateChecksum = mutation({
  args: {
    walletAddress: v.string(),
    meks: v.array(v.any()),
    source: v.union(v.literal("blockchain"), v.literal("database")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const checksum = calculateChecksum(args.meks);

    // Check if checksum record exists
    const existing = await ctx.db
      .query("syncChecksums")
      .withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (existing) {
      // Update existing checksum
      const statusChanged = existing.checksum !== checksum;
      const newStatus = statusChanged ? "desynced" : "synced";

      await ctx.db.patch(existing._id, {
        checksum,
        mekCount: args.meks.length,
        lastSyncTime: now,
        lastVerifiedTime: args.source === "blockchain" ? now : existing.lastVerifiedTime,
        status: newStatus,
        discrepancies: statusChanged
          ? [`Checksum mismatch: ${existing.checksum} → ${checksum}`]
          : [],
      });

      if (statusChanged) {
        devLog.warn(`[Checksum] Desync detected for ${args.walletAddress}: ${existing.mekCount} → ${args.meks.length} Meks`);
      }
    } else {
      // Create new checksum record
      await ctx.db.insert("syncChecksums", {
        walletAddress: args.walletAddress,
        checksum,
        mekCount: args.meks.length,
        lastSyncTime: now,
        lastVerifiedTime: args.source === "blockchain" ? now : now,
        status: "synced",
        discrepancies: [],
      });

      devLog.log(`[Checksum] Created checksum for ${args.walletAddress}: ${args.meks.length} Meks`);
    }

    return { checksum, mekCount: args.meks.length };
  },
});

// Get checksum for a wallet
export const getChecksum = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("syncChecksums")
      .withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress))
      .first();
  },
});

// Verify wallet is in sync
export const verifyWalletSync = action({
  args: {
    walletAddress: v.string(),
    checkBlockchain: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    devLog.log(`[Checksum] Verifying sync for ${args.walletAddress}`);

    // Get database state
    const dbState = await ctx.runQuery(api.goldMining.getGoldMiningData, {
      walletAddress: args.walletAddress,
    });

    if (!dbState) {
      return {
        status: "unknown",
        message: "Wallet not found in database",
        dbMekCount: 0,
        blockchainMekCount: 0,
        discrepancies: [],
      };
    }

    const dbChecksum = calculateChecksum(dbState.ownedMeks);
    const dbMekCount = dbState.ownedMeks.length;

    // Update database checksum
    await ctx.runMutation(api.syncChecksums.updateChecksum, {
      walletAddress: args.walletAddress,
      meks: dbState.ownedMeks,
      source: "database",
    });

    // Optionally verify against blockchain
    if (args.checkBlockchain) {
      try {
        const blockchainResult = await ctx.runAction(api.blockfrostNftFetcher.fetchNFTsByStakeAddress, {
          stakeAddress: args.walletAddress,
          useCache: false,
        });

        if (blockchainResult.success && blockchainResult.meks) {
          const blockchainChecksum = calculateChecksum(blockchainResult.meks);
          const blockchainMekCount = blockchainResult.meks.length;

          // Compare checksums
          const inSync = dbChecksum === blockchainChecksum;

          if (!inSync) {
            devLog.warn(`[Checksum] DESYNC DETECTED: ${args.walletAddress}`);
            devLog.warn(`[Checksum] Database: ${dbMekCount} Meks (${dbChecksum})`);
            devLog.warn(`[Checksum] Blockchain: ${blockchainMekCount} Meks (${blockchainChecksum})`);

            // Identify missing/extra Meks
            const dbAssetIds = new Set(dbState.ownedMeks.map(m => m.assetId));
            const blockchainAssetIds = new Set(blockchainResult.meks.map(m => m.assetId));

            const missingInDb = blockchainResult.meks
              .filter(m => !dbAssetIds.has(m.assetId))
              .map(m => m.assetName);

            const extraInDb = dbState.ownedMeks
              .filter(m => !blockchainAssetIds.has(m.assetId))
              .map(m => m.assetName);

            const discrepancies = [
              `Database has ${dbMekCount} Meks, blockchain has ${blockchainMekCount} Meks`,
              ...(missingInDb.length > 0 ? [`Missing in DB: ${missingInDb.slice(0, 5).join(", ")}`] : []),
              ...(extraInDb.length > 0 ? [`Extra in DB: ${extraInDb.slice(0, 5).join(", ")}`] : []),
            ];

            // Update checksum with blockchain data
            await ctx.runMutation(api.syncChecksums.updateChecksum, {
              walletAddress: args.walletAddress,
              meks: blockchainResult.meks,
              source: "blockchain",
            });

            return {
              status: "desynced",
              message: "Database and blockchain are out of sync",
              dbMekCount,
              blockchainMekCount,
              discrepancies,
              missingInDb: missingInDb.slice(0, 10),
              extraInDb: extraInDb.slice(0, 10),
            };
          } else {
            devLog.log(`[Checksum] Wallet ${args.walletAddress} is IN SYNC (${dbMekCount} Meks)`);

            return {
              status: "synced",
              message: "Database and blockchain match perfectly",
              dbMekCount,
              blockchainMekCount,
              discrepancies: [],
            };
          }
        } else {
          return {
            status: "unknown",
            message: `Blockchain fetch failed: ${blockchainResult.error}`,
            dbMekCount,
            blockchainMekCount: 0,
            discrepancies: ["Could not verify against blockchain"],
          };
        }
      } catch (error: any) {
        devLog.errorAlways(`[Checksum] Blockchain verification error: ${error.message}`);
        return {
          status: "unknown",
          message: `Verification error: ${error.message}`,
          dbMekCount,
          blockchainMekCount: 0,
          discrepancies: ["Blockchain verification failed"],
        };
      }
    }

    // No blockchain check - just return database status
    return {
      status: "synced",
      message: "Database checksum updated (blockchain not checked)",
      dbMekCount,
      blockchainMekCount: 0,
      discrepancies: [],
    };
  },
});

// Scan all wallets for desyncs
export const scanAllWalletsForDesyncs = action({
  args: {
    checkBlockchain: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;

    devLog.log(`[Checksum] Scanning all wallets for desyncs (limit: ${limit})`);

    // Get all wallets
    const allMiners = await ctx.runQuery(api.goldMining.getAllGoldMiningData, {});

    const results = {
      totalScanned: 0,
      synced: 0,
      desynced: 0,
      unknown: 0,
      desyncedWallets: [] as any[],
    };

    for (const miner of allMiners.slice(0, limit)) {
      try {
        const verification = await ctx.runAction(api.syncChecksums.verifyWalletSync, {
          walletAddress: miner.walletAddress,
          checkBlockchain: args.checkBlockchain,
        });

        results.totalScanned++;

        if (verification.status === "synced") {
          results.synced++;
        } else if (verification.status === "desynced") {
          results.desynced++;
          results.desyncedWallets.push({
            walletAddress: miner.walletAddress,
            companyName: miner.companyName,
            dbMekCount: verification.dbMekCount,
            blockchainMekCount: verification.blockchainMekCount,
            discrepancies: verification.discrepancies,
          });
        } else {
          results.unknown++;
        }

        // Log progress every 10 wallets
        if (results.totalScanned % 10 === 0) {
          devLog.log(`[Checksum] Scanned ${results.totalScanned} wallets...`);
        }
      } catch (error: any) {
        devLog.errorAlways(`[Checksum] Error scanning ${miner.walletAddress}: ${error.message}`);
        results.unknown++;
      }
    }

    devLog.log(`[Checksum] Scan complete: ${results.synced} synced, ${results.desynced} desynced, ${results.unknown} unknown`);

    return results;
  },
});

// Get all desynced wallets
export const getDesyncedWallets = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("syncChecksums")
      .withIndex("", (q: any) => q.eq("status", "desynced"))
      .collect();
  },
});

// Fix desynced wallet by re-syncing from blockchain
export const fixDesyncedWallet = action({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    devLog.log(`[Checksum] Fixing desynced wallet: ${args.walletAddress}`);

    // Use saga pattern to safely re-sync
    const result = await ctx.runAction(api.nftSyncSaga.syncWalletNFTsWithSaga, {
      stakeAddress: args.walletAddress,
      walletType: "unknown",
      forceResync: true,
    });

    if (result.success) {
      // Verify fix
      const verification = await ctx.runAction(api.syncChecksums.verifyWalletSync, {
        walletAddress: args.walletAddress,
        checkBlockchain: true,
      });

      return {
        success: true,
        message: `Wallet re-synced successfully: ${result.mekCount} Meks`,
        verification,
      };
    } else {
      return {
        success: false,
        message: `Failed to fix wallet: ${result.error}`,
        error: result.error,
      };
    }
  },
});

// Automatic checksum update (called after any Mek update)
export const autoUpdateChecksum = mutation({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    // Get current goldMining state
    const dbState = await ctx.db
      .query("goldMining")
      .withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!dbState) {
      return { success: false, message: "Wallet not found" };
    }

    const checksum = calculateChecksum(dbState.ownedMeks);

    // Update checksum
    const existing = await ctx.db
      .query("syncChecksums")
      .withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        checksum,
        mekCount: dbState.ownedMeks.length,
        lastSyncTime: Date.now(),
        status: "synced",
        discrepancies: [],
      });
    } else {
      await ctx.db.insert("syncChecksums", {
        walletAddress: args.walletAddress,
        checksum,
        mekCount: dbState.ownedMeks.length,
        lastSyncTime: Date.now(),
        lastVerifiedTime: Date.now(),
        status: "synced",
        discrepancies: [],
      });
    }

    return { success: true, checksum, mekCount: dbState.ownedMeks.length };
  },
});
