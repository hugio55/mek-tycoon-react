import { mutation } from "./_generated/server";
import { calculateLevelBoost } from "./mekLeveling";

// ADMIN ONLY: Reset ALL players' progress back to starting values
// This is a "soft reset" - doesn't delete wallets, just resets their game progress
// - All mechanisms back to level 1
// - Spendable gold → 0
// - Cumulative gold → 0
// - Wallets stay verified
// - Gold continues accumulating immediately
export const resetAllProgress = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Get ALL gold mining records
    const allWallets = await ctx.db.query("goldMining").collect();

    let walletsReset = 0;
    let meksReset = 0;

    console.log(`[ADMIN] Starting FULL PROGRESS RESET for ${allWallets.length} wallets...`);

    for (const wallet of allWallets) {
      // 1. Reset all gold values to zero
      // KEEP: isVerified, totalGoldPerHour (so they continue earning)
      await ctx.db.patch(wallet._id, {
        accumulatedGold: 0,
        totalCumulativeGold: 0,
        totalGoldSpentOnUpgrades: 0,
        lastSnapshotTime: now,
        updatedAt: now
      });

      // 2. Reset all mek levels to 1
      const mekLevels = await ctx.db
        .query("mekLevels")
        .withIndex("by_wallet", (q: any) => q.eq("walletAddress", wallet.walletAddress))
        .filter((q) => q.eq(q.field("ownershipStatus"), "verified"))
        .collect();

      for (const levelRecord of mekLevels) {
        await ctx.db.patch(levelRecord._id, {
          currentLevel: 1,
          totalGoldSpent: 0,
          currentBoostPercent: 0,
          currentBoostAmount: 0,
          lastUpgradeAt: undefined,
          updatedAt: now,
        });
        meksReset++;
      }

      // 3. Reset ownedMeks in goldMining to level 1 with no boosts
      const resetMeks = wallet.ownedMeks.map((mek) => ({
        ...mek,
        currentLevel: 1,
        levelBoostPercent: 0,
        levelBoostAmount: 0,
        effectiveGoldPerHour: mek.baseGoldPerHour || mek.goldPerHour || 0,
      }));

      // Recalculate rates (no boosts now)
      const baseGoldPerHour = resetMeks.reduce(
        (sum, mek) => sum + (mek.baseGoldPerHour || mek.goldPerHour || 0),
        0
      );

      await ctx.db.patch(wallet._id, {
        ownedMeks: resetMeks,
        baseGoldPerHour,
        boostGoldPerHour: 0,
        totalGoldPerHour: baseGoldPerHour,
        updatedAt: now,
      });

      walletsReset++;
    }

    console.log(`[ADMIN] FULL PROGRESS RESET COMPLETE: ${walletsReset} wallets, ${meksReset} meks reset to level 1`);

    return {
      success: true,
      walletsReset,
      meksReset,
      message: `Successfully reset ${walletsReset} wallets and ${meksReset} meks to starting values. All players now have 0 gold and all meks at level 1, but continue earning gold.`
    };
  }
});
