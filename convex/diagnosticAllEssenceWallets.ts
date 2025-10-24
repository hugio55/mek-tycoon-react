import { query } from "./_generated/server";

// Diagnostic query to find all wallets with essence balances
export const findAllEssenceWallets = query({
  args: {},
  handler: async (ctx) => {
    // Get all essence tracking records (indicates initialized wallets)
    const allTracking = await ctx.db
      .query("essenceTracking")
      .collect();

    // Get all essence balances
    const allBalances = await ctx.db
      .query("essenceBalances")
      .collect();

    // Group balances by wallet
    const balancesByWallet = allBalances.reduce((acc: any, balance: any) => {
      const wallet = balance.walletAddress;
      if (!acc[wallet]) {
        acc[wallet] = [];
      }
      acc[wallet].push(balance);
      return acc;
    }, {});

    // Get all slotted configurations
    const allSlots = await ctx.db
      .query("essenceSlots")
      .collect();

    // Group slots by wallet
    const slotsByWallet = allSlots.reduce((acc: any, slot: any) => {
      const wallet = slot.walletAddress;
      if (!acc[wallet]) {
        acc[wallet] = [];
      }
      acc[wallet].push(slot);
      return acc;
    }, {});

    // Combine info by wallet
    const walletInfo = Object.keys(balancesByWallet).map((wallet) => {
      const tracking = allTracking.find((t) => t.walletAddress === wallet);
      const balances = balancesByWallet[wallet] || [];
      const slots = slotsByWallet[wallet] || [];
      const slottedMeks = slots.filter((s: any) => s.mekAssetId);

      // Find "Nothing" balances
      const nothingBalances = balances.filter(
        (b: any) => b.variationName === "Nothing"
      );

      return {
        walletAddress: wallet,
        shortAddress: `${wallet.substring(0, 12)}...${wallet.substring(wallet.length - 8)}`,
        isInitialized: !!tracking,
        isActive: tracking?.isActive || false,
        totalBalances: balances.length,
        totalSlots: slots.length,
        slottedMeks: slottedMeks.length,
        nothingCount: nothingBalances.length,
        hasMultipleNothings: nothingBalances.length > 1,
      };
    });

    return {
      totalWallets: walletInfo.length,
      wallets: walletInfo.sort((a, b) => b.totalBalances - a.totalBalances),
      walletsWithMultipleNothings: walletInfo.filter((w) => w.hasMultipleNothings),
    };
  },
});
