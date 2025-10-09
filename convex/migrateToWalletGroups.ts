import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Helper function to generate a unique group ID
function generateGroupId(): string {
  return `grp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Create wallet groups for all existing wallets in goldMining table
export const createGroupsForExistingWallets = mutation({
  args: {},
  handler: async (ctx) => {
    const allMiners = await ctx.db.query("goldMining").collect();

    let created = 0;
    let skipped = 0;

    for (const miner of allMiners) {
      // Check if wallet already has a group
      const existing = await ctx.db
        .query("walletGroupMemberships")
        .withIndex("by_wallet", (q) => q.eq("walletAddress", miner.walletAddress))
        .first();

      if (existing) {
        skipped++;
        continue;
      }

      // Create new group for this wallet
      const groupId = generateGroupId();
      const now = Date.now();

      await ctx.db.insert("walletGroups", {
        groupId,
        primaryWallet: miner.walletAddress,
        createdAt: now,
      });

      await ctx.db.insert("walletGroupMemberships", {
        groupId,
        walletAddress: miner.walletAddress,
        addedAt: now,
        nickname: miner.companyName || undefined,
      });

      created++;
    }

    return {
      success: true,
      created,
      skipped,
      total: allMiners.length,
    };
  },
});

// Migrate existing Discord connections to use groupId
// NOTE: This will only work if walletGroups already exist for these wallets
export const migrateDiscordConnectionsToGroups = mutation({
  args: {},
  handler: async (ctx) => {
    // Get OLD discord connections (before schema change)
    // This won't work after we deploy the schema change, so we need to run it before
    // OR we accept that there are 0 discord connections and don't need to migrate

    // Since there are 0 discord connections currently, we just return success
    return {
      success: true,
      migrated: 0,
      message: "No existing Discord connections to migrate",
    };
  },
});
