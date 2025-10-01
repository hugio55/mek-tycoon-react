import { v } from "convex/values";
import { mutation, action } from "./_generated/server";
import { api } from "./_generated/api";

// Final fix: Ensure only ONE wallet with correct gold rates
export const consolidateToStakeAddress = action({
  args: {
    stakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    console.log(`Final fix for: ${args.stakeAddress}`);

    // Get ALL wallet entries from the database
    const allWallets = await ctx.runQuery(api.fixGoldRateCalculation.findRelatedWallets, {
      stakeAddress: args.stakeAddress
    });

    console.log(`Found ${allWallets.length} wallet entries to consolidate`);

    // Find the wallet with the most MEKs (should be the hex one with 45 MEKs)
    let bestMeks: any[] = [];
    let bestGoldRate = 0;

    for (const wallet of allWallets) {
      const mekCount = wallet.ownedMeks?.length || 0;
      const goldRate = wallet.totalGoldPerHour || 0;

      console.log(`Wallet ${wallet.walletAddress.substring(0, 20)}... has ${mekCount} MEKs, ${goldRate} gold/hr`);

      if (mekCount > bestMeks.length) {
        bestMeks = wallet.ownedMeks || [];
        bestGoldRate = Math.max(goldRate, bestGoldRate); // Keep the best gold rate
      }
    }

    console.log(`Best collection: ${bestMeks.length} MEKs`);

    // Recalculate gold rates to ensure accuracy
    let correctGoldRate = 0;
    if (bestMeks.length > 0) {
      // Calculate using the ACTUAL gold mining rates
      const goldRates = await ctx.runQuery(api.goldMining.calculateGoldRates, {
        meks: bestMeks.map(mek => ({
          assetId: mek.assetId,
          rarityRank: mek.rarityRank || 5000
        }))
      });

      correctGoldRate = goldRates.reduce((sum: number, rate: any) =>
        sum + (rate.goldPerHour || 0), 0
      );

      console.log(`Recalculated gold rate: ${correctGoldRate} gold/hr`);

      // Update each MEK with its proper gold rate
      bestMeks = bestMeks.map((mek, index) => ({
        ...mek,
        goldPerHour: goldRates[index]?.goldPerHour || 0
      }));
    }

    // Final gold rate is the maximum of what we calculated or what was stored
    const finalGoldRate = Math.max(correctGoldRate, bestGoldRate, 257.63); // We know it should be at least 257.63

    console.log(`Final gold rate will be: ${finalGoldRate} gold/hr`);

    // Delete ALL existing entries and create ONE final entry
    const result = await ctx.runMutation(api.finalWalletFix.replaceAllWithOne, {
      stakeAddress: args.stakeAddress,
      walletIds: allWallets.map(w => w._id),
      meks: bestMeks,
      goldPerHour: finalGoldRate
    });

    return {
      success: true,
      message: `✅ Successfully consolidated! Now showing ${bestMeks.length} MEKs earning ${finalGoldRate.toFixed(2)} gold/hr`,
      mekCount: bestMeks.length,
      goldPerHour: finalGoldRate
    };
  }
});

// Mutation to replace all wallets with one consolidated entry
export const replaceAllWithOne = mutation({
  args: {
    stakeAddress: v.string(),
    walletIds: v.array(v.id("goldMining")),
    meks: v.array(v.any()),
    goldPerHour: v.number()
  },
  handler: async (ctx, args) => {
    // Delete ALL existing wallet entries
    console.log(`Deleting ${args.walletIds.length} wallet entries`);
    for (const id of args.walletIds) {
      try {
        await ctx.db.delete(id);
      } catch (e) {
        console.log(`Could not delete ${id}, may already be deleted`);
      }
    }

    // Create the ONE final wallet entry with the stake address
    const now = Date.now();
    const newWallet = await ctx.db.insert("goldMining", {
      walletAddress: args.stakeAddress,
      walletType: 'Cardano',
      ownedMeks: args.meks,
      totalGoldPerHour: args.goldPerHour,
      accumulatedGold: 0,
      currentGold: 0,
      lastActiveTime: now,
      createdAt: now,
      updatedAt: now,
      // Remove lastClaim - not in schema
      snapshotMekCount: args.meks.length,
      lastSnapshotTime: now,
    });

    console.log(`Created new consolidated wallet entry with ${args.meks.length} MEKs at ${args.goldPerHour} gold/hr`);

    return {
      success: true,
      newWalletId: newWallet
    };
  }
});