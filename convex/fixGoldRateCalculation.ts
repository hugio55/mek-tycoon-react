import { v } from "convex/values";
import { mutation, action, query } from "./_generated/server";
import { api } from "./_generated/api";

// Simple fix: Merge all wallet variants and recalculate gold rates properly
export const fixWalletAndRecalculate = action({
  args: {
    stakeAddress: v.string(), // The stake1... address
  },
  handler: async (ctx, args) => {
    console.log(`Fixing wallet for stake address: ${args.stakeAddress}`);

    // Step 1: Find ALL related wallet entries (stake, hex, anything with same suffix)
    const allWallets = await ctx.runQuery(api.fixGoldRateCalculation.findRelatedWallets, {
      stakeAddress: args.stakeAddress
    });

    if (allWallets.length === 0) {
      return { success: false, error: "No wallets found" };
    }

    console.log(`Found ${allWallets.length} related wallet entries`);

    // Step 2: Find the one with MEKs (if any)
    let bestWallet = allWallets[0];
    let totalMeks = 0;
    let allMeks: any[] = [];

    for (const wallet of allWallets) {
      const mekCount = wallet.ownedMeks?.length || 0;
      if (mekCount > totalMeks) {
        totalMeks = mekCount;
        bestWallet = wallet;
        allMeks = wallet.ownedMeks || [];
      }
    }

    console.log(`Best wallet has ${totalMeks} MEKs`);

    // Step 3: Calculate PROPER gold rates for these MEKs
    let totalGoldPerHour = 0;
    if (allMeks.length > 0) {
      // Get the actual gold rates from your calculation system
      const goldRates = await ctx.runQuery(api.goldMining.calculateGoldRates, {
        meks: allMeks.map(mek => ({
          assetId: mek.assetId,
          rarityRank: mek.rarityRank || 5000 // Default middle rank if not set
        }))
      });

      // Sum up the gold rates
      totalGoldPerHour = goldRates.reduce((sum: number, rate: any) =>
        sum + (rate.goldPerHour || 0), 0
      );

      console.log(`Calculated total gold/hr: ${totalGoldPerHour}`);
    }

    // Step 4: Delete all duplicates and create ONE clean record
    const deleteResult = await ctx.runMutation(api.fixGoldRateCalculation.deleteAndRecreateSingle, {
      stakeAddress: args.stakeAddress,
      meks: allMeks,
      totalGoldPerHour: totalGoldPerHour,
      deleteIds: allWallets.map(w => w._id)
    });

    if (!deleteResult.success) {
      return deleteResult;
    }

    // Step 5: Force a snapshot update to ensure everything is synced
    if (totalMeks > 0) {
      await ctx.runMutation(api.goldMiningSnapshot.updateMinerAfterSnapshot, {
        walletAddress: args.stakeAddress,
        mekCount: totalMeks,
        totalGoldPerHour: totalGoldPerHour,
        mekNumbers: allMeks.map(m => m.rarityRank || 5000),
        mekDetails: allMeks.map(mek => ({
          assetId: mek.assetId,
          assetName: mek.assetName || mek.assetId,
          goldPerHour: mek.goldPerHour || (totalGoldPerHour / Math.max(1, allMeks.length)),
          rarityRank: mek.rarityRank
        }))
      });
    }

    return {
      success: true,
      message: `Fixed! Consolidated to 1 wallet with ${totalMeks} MEKs earning ${totalGoldPerHour.toFixed(2)} gold/hr`,
      mekCount: totalMeks,
      goldPerHour: totalGoldPerHour,
      walletAddress: args.stakeAddress
    };
  }
});

// Query to find all related wallets
export const findRelatedWallets = query({
  args: {
    stakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    // Get the suffix from the stake address (last 8 chars are usually consistent)
    const suffix = args.stakeAddress.slice(-8);

    // Find ALL wallets that might be related
    const allWallets = await ctx.db.query("goldMining").collect();

    // Filter for related wallets:
    // 1. Exact match on stake address
    // 2. Hex addresses with same suffix
    // 3. Any address containing the suffix
    const related = allWallets.filter(w =>
      w.walletAddress === args.stakeAddress ||
      w.walletAddress.toLowerCase().includes(suffix.toLowerCase()) ||
      w.walletAddress.endsWith('fe6012f1') || // Your specific hex suffix
      (args.stakeAddress.includes('ughgq076') &&
       (w.walletAddress.includes('fe6012f1') || w.walletAddress.includes('ughgq076')))
    );

    return related;
  }
});

// Mutation to delete duplicates and recreate single clean record
export const deleteAndRecreateSingle = mutation({
  args: {
    stakeAddress: v.string(),
    meks: v.array(v.any()),
    totalGoldPerHour: v.number(),
    deleteIds: v.array(v.id("goldMining"))
  },
  handler: async (ctx, args) => {
    // Delete all the old records
    for (const id of args.deleteIds) {
      await ctx.db.delete(id);
    }

    // Create ONE new clean record with the stake address
    await ctx.db.insert("goldMining", {
      walletAddress: args.stakeAddress,
      walletType: 'Cardano',
      ownedMeks: args.meks,
      totalGoldPerHour: args.totalGoldPerHour,
      accumulatedGold: 0,
      currentGold: 0,
      lastActiveTime: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastClaim: Date.now(),
      snapshotMekCount: args.meks.length,
      lastSnapshotTime: Date.now(),
      // Don't include isVerified - not in schema
      // Don't need paymentAddresses either
    });

    return { success: true };
  }
});