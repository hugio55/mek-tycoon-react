import { query } from "./_generated/server";

// Get top 50 Mek holders from connected wallets
export const getTop50MekHolders = query({
  args: {},
  handler: async (ctx) => {
    // Get all gold mining records (connected wallets)
    const allMiners = await ctx.db
      .query("goldMining")
      .collect();

    // Sort by Mek count and get top 50
    const top50 = allMiners
      .filter(miner => miner.ownedMeks.length > 0) // Only include wallets with Meks
      .sort((a, b) => b.ownedMeks.length - a.ownedMeks.length)
      .slice(0, 50)
      .map((miner, index) => ({
        rank: index + 1,
        stakeAddress: miner.walletAddress.length > 50
          ? `${miner.walletAddress.substring(0, 8)}...${miner.walletAddress.substring(miner.walletAddress.length - 8)}`
          : miner.walletAddress,
        fullAddress: miner.walletAddress,
        mekCount: miner.ownedMeks.length || 0,
        theoreticalGoldPerHour: miner.totalGoldPerHour || 0,
        walletType: miner.walletType,
        lastActive: miner.lastActiveTime,
        isConnected: true, // These are all connected wallets
      }));

    // Add placeholder entries if we have less than 50
    while (top50.length < 50 && top50.length > 0) {
      top50.push({
        rank: top50.length + 1,
        stakeAddress: "-",
        fullAddress: "",
        mekCount: 0,
        theoreticalGoldPerHour: 0,
        walletType: "",
        lastActive: 0,
        isConnected: false,
      });
    }

    return {
      holders: top50,
      totalConnectedHolders: allMiners.filter(m => m.ownedMeks.length > 0).length,
      lastUpdated: Date.now(),
      note: "Shows only wallets that have connected to the app"
    };
  },
});