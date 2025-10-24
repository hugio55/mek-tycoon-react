import { query } from "./_generated/server";

// Diagnostic query to check essence storage usage
export const checkEssenceStorage = query({
  args: {},
  handler: async (ctx) => {
    // Count records in each essence table
    const config = await ctx.db
      .query("essenceConfig")
      .collect();

    const tracking = await ctx.db
      .query("essenceTracking")
      .collect();

    const slots = await ctx.db
      .query("essenceSlots")
      .collect();

    const requirements = await ctx.db
      .query("essenceSlotRequirements")
      .collect();

    const balances = await ctx.db
      .query("essenceBalances")
      .collect();

    const buffs = await ctx.db
      .query("essencePlayerBuffs")
      .collect();

    // Calculate active vs inactive players
    const activeTracking = tracking.filter(t => t.isActive);
    const inactiveTracking = tracking.filter(t => !t.isActive);

    // Find unique wallet addresses
    const uniqueWallets = new Set(tracking.map(t => t.walletAddress));

    // Count slots with Meks vs empty
    const slottedSlots = slots.filter(s => s.mekAssetId);
    const emptySlots = slots.filter(s => !s.mekAssetId);

    // Group balances by wallet to see distribution
    const balancesByWallet = new Map<string, number>();
    for (const balance of balances) {
      balancesByWallet.set(
        balance.walletAddress,
        (balancesByWallet.get(balance.walletAddress) || 0) + 1
      );
    }

    // Calculate average balances per player
    const avgBalancesPerPlayer = balances.length / uniqueWallets.size || 0;

    // Estimate storage size (rough estimate)
    // Convex uses efficient storage, but we can estimate based on field counts
    const estimatedBytes = {
      config: config.length * 500, // ~500 bytes per config (has arrays)
      tracking: tracking.length * 200, // ~200 bytes per tracking record
      slots: slots.length * 300, // ~300 bytes per slot
      requirements: requirements.length * 400, // ~400 bytes per requirement (has arrays)
      balances: balances.length * 200, // ~200 bytes per balance
      buffs: buffs.length * 150, // ~150 bytes per buff
    };

    const totalEstimatedBytes = Object.values(estimatedBytes).reduce((sum, val) => sum + val, 0);
    const totalEstimatedKB = totalEstimatedBytes / 1024;
    const totalEstimatedMB = totalEstimatedKB / 1024;

    return {
      counts: {
        config: config.length,
        tracking: tracking.length,
        slots: slots.length,
        requirements: requirements.length,
        balances: balances.length,
        buffs: buffs.length,
      },
      playerStats: {
        totalPlayers: uniqueWallets.size,
        activePlayers: activeTracking.length,
        inactivePlayers: inactiveTracking.length,
        slottedSlots: slottedSlots.length,
        emptySlots: emptySlots.length,
        avgBalancesPerPlayer: Math.round(avgBalancesPerPlayer * 100) / 100,
      },
      storageEstimate: {
        bytes: totalEstimatedBytes,
        kilobytes: Math.round(totalEstimatedKB * 100) / 100,
        megabytes: Math.round(totalEstimatedMB * 100) / 100,
      },
      breakdown: estimatedBytes,
      topBalanceWallets: Array.from(balancesByWallet.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([wallet, count]) => ({
          wallet: wallet.substring(0, 20) + '...',
          balanceCount: count,
        })),
    };
  },
});
