import { query } from "./_generated/server";

// Check what wallets exist in essence system
export const checkEssenceWallets = query({
  args: {},
  handler: async (ctx) => {
    const tracking = await ctx.db.query("essenceTracking").collect();
    const slots = await ctx.db.query("essenceSlots").collect();
    const balances = await ctx.db.query("essenceBalances").collect();

    const trackingWallets = new Set(tracking.map(t => t.walletAddress));
    const slotWallets = new Set(slots.map(s => s.walletAddress));
    const balanceWallets = new Set(balances.map(b => b.walletAddress));

    const allWallets = new Set([...trackingWallets, ...slotWallets, ...balanceWallets]);

    return {
      totalWallets: allWallets.size,
      wallets: Array.from(allWallets).map(wallet => ({
        wallet: wallet,
        hasTracking: trackingWallets.has(wallet),
        hasSlots: slotWallets.has(wallet),
        hasBalances: balanceWallets.has(wallet),
        slotCount: slots.filter(s => s.walletAddress === wallet && s.mekAssetId).length,
        balanceCount: balances.filter(b => b.walletAddress === wallet).length,
      })),
      slottedMeks: slots.filter(s => s.mekAssetId).map(s => ({
        wallet: s.walletAddress.substring(0, 20) + '...',
        slot: s.slotNumber,
        mek: s.mekNumber,
        head: s.headVariationName,
        body: s.bodyVariationName,
        item: s.itemVariationName,
      }))
    };
  },
});
