import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * COMPREHENSIVE WALLET FIX
 *
 * This fixes ALL the issues:
 * 1. Removes duplicate wallets (hex addresses, payment addresses)
 * 2. Ensures only stake addresses are used
 * 3. Preserves MEK counts and calculates correct gold rates
 * 4. Cleans up snapshot history
 */

// Main fix action - orchestrates everything
export const fixAllWalletIssues = action({
  args: {
    stakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.stakeAddress.startsWith('stake1')) {
      return {
        success: false,
        error: "Please provide a valid stake address (starts with stake1)"
      };
    }

    console.log(`Starting comprehensive fix for: ${args.stakeAddress}`);

    // Step 1: Find ALL related wallets (stake, hex, payment)
    const allWallets = await ctx.runQuery(api.comprehensiveWalletFix.findAllRelatedWallets, {
      stakeAddress: args.stakeAddress
    });

    console.log(`Found ${allWallets.length} related wallets`);

    // Step 2: Consolidate data from all wallets
    let bestMeks: any[] = [];
    let totalAccumulatedGold = 0;
    let maxMekCount = 0;

    for (const wallet of allWallets) {
      // Get the wallet with the most MEKs
      const mekCount = wallet.ownedMeks?.length || 0;
      if (mekCount > maxMekCount) {
        maxMekCount = mekCount;
        bestMeks = wallet.ownedMeks || [];
      }

      // Accumulate all gold from all wallets
      totalAccumulatedGold += wallet.accumulatedGold || 0;
      totalAccumulatedGold += wallet.currentGold || 0;
    }

    console.log(`Best wallet has ${maxMekCount} MEKs, total gold: ${totalAccumulatedGold}`);

    // Step 3: Calculate correct gold rate
    let correctGoldRate = 0;
    if (bestMeks.length > 0) {
      const goldRates = await ctx.runQuery(api.goldMining.calculateGoldRates, {
        meks: bestMeks.map(mek => ({
          assetId: mek.assetId,
          rarityRank: mek.rarityRank || 5000
        }))
      });

      correctGoldRate = goldRates.reduce((sum: number, rate: any) =>
        sum + (rate.goldPerHour || 0), 0
      );
    }

    console.log(`Calculated gold rate: ${correctGoldRate} gold/hr`);

    // Step 4: Delete ALL existing wallets and create ONE clean entry
    // FIXED: Actions CAN call mutations directly via ctx.runMutation
    await ctx.runMutation(api.comprehensiveWalletFix.recreateWallet, {
      stakeAddress: args.stakeAddress,
      walletIds: allWallets.map(w => w._id),
      meks: bestMeks,
      goldPerHour: correctGoldRate,
      accumulatedGold: totalAccumulatedGold
    });

    // Step 5: Clean up snapshot history
    // FIXED: Actions CAN call mutations directly via ctx.runMutation
    await ctx.runMutation(api.comprehensiveWalletFix.cleanSnapshotHistory, {
      stakeAddress: args.stakeAddress
    });

    return {
      success: true,
      message: `✅ Fixed! Consolidated to 1 wallet with ${maxMekCount} MEKs earning ${correctGoldRate.toFixed(2)} gold/hr`,
      mekCount: maxMekCount,
      goldPerHour: correctGoldRate,
      accumulatedGold: totalAccumulatedGold
    };
  }
});

// Query to find all related wallets
export const findAllRelatedWallets = query({
  args: {
    stakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const allWallets = await ctx.db.query("goldMining").collect();

    // Match wallets by:
    // 1. Exact stake address match
    // 2. Hex addresses with matching suffix
    // 3. Any address containing the stake suffix
    const stakeSuffix = args.stakeAddress.slice(-8); // Last 8 chars

    return allWallets.filter(w =>
      w.walletAddress === args.stakeAddress || // Exact stake match
      w.walletAddress.includes(stakeSuffix) || // Contains suffix
      w.walletAddress.includes('ughgq076') || // Your specific suffix
      w.walletAddress.includes('fe6012f1') || // Your hex suffix
      w.walletAddress.startsWith('01d9d9cf8225') || // Your hex prefix
      w.walletAddress.startsWith('addr1') // Any payment address (to be removed)
    );
  }
});

// Mutation to recreate wallet with only stake address
export const recreateWallet = mutation({
  args: {
    stakeAddress: v.string(),
    walletIds: v.array(v.id("goldMining")),
    meks: v.array(v.any()),
    goldPerHour: v.number(),
    accumulatedGold: v.number()
  },
  handler: async (ctx, args) => {
    // Delete ALL existing wallets
    for (const id of args.walletIds) {
      try {
        await ctx.db.delete(id);
        console.log(`Deleted wallet: ${id}`);
      } catch (e) {
        console.log(`Could not delete ${id}, may already be deleted`);
      }
    }

    // Create ONE clean wallet with stake address ONLY
    const now = Date.now();
    const newWallet = await ctx.db.insert("goldMining", {
      walletAddress: args.stakeAddress, // ONLY stake address
      walletType: 'Cardano',
      ownedMeks: args.meks,
      totalGoldPerHour: args.goldPerHour,
      accumulatedGold: args.accumulatedGold,
      currentGold: 0,
      lastActiveTime: now,
      createdAt: now,
      updatedAt: now,
      snapshotMekCount: args.meks.length,
      lastSnapshotTime: now,
      // NO paymentAddresses field - we're removing it entirely
    });

    console.log(`Created clean wallet with stake address: ${args.stakeAddress}`);
    return { success: true, walletId: newWallet };
  }
});

// Clean up snapshot history to only show stake addresses
export const cleanSnapshotHistory = mutation({
  args: {
    stakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    // Find all snapshot history entries
    const allHistory = await ctx.db.query("mekOwnershipHistory").collect();

    // Find entries that belong to this user but use wrong address format
    const stakeSuffix = args.stakeAddress.slice(-8);
    const wrongEntries = allHistory.filter(h =>
      h.walletAddress !== args.stakeAddress &&
      (h.walletAddress.includes(stakeSuffix) ||
       h.walletAddress.includes('ughgq076') ||
       h.walletAddress.includes('fe6012f1') ||
       h.walletAddress.startsWith('01d9d9cf8225') ||
       h.walletAddress.startsWith('addr1'))
    );

    // Update all wrong entries to use stake address
    for (const entry of wrongEntries) {
      await ctx.db.patch(entry._id, {
        walletAddress: args.stakeAddress
      });
      console.log(`Updated history entry from ${entry.walletAddress.substring(0, 20)}... to stake address`);
    }

    return {
      success: true,
      updatedCount: wrongEntries.length
    };
  }
});

// Query to check wallet status
export const checkWalletStatus = query({
  args: {
    stakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const wallet = await ctx.db
      .query("goldMining")
      .withIndex("", (q: any) => q.eq("walletAddress", args.stakeAddress))
      .first();

    if (!wallet) {
      return { exists: false };
    }

    return {
      exists: true,
      mekCount: wallet.ownedMeks?.length || 0,
      goldPerHour: wallet.totalGoldPerHour || 0,
      accumulatedGold: wallet.accumulatedGold || 0,
      currentGold: wallet.currentGold || 0,
      lastSnapshot: wallet.lastSnapshotTime,
      hasPaymentAddresses: !!(wallet as any).paymentAddresses?.length
    };
  }
});