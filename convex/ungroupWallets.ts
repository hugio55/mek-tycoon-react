import { mutation } from "./_generated/server";

// Remove all wallet group memberships for a specific wallet (ungroup it)
export const ungroupWallet = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all wallet group memberships
    const allMemberships = await ctx.db.query("walletGroupMemberships").collect();

    console.log(`[ungroupWallet] Found ${allMemberships.length} wallet group memberships`);

    // Delete all memberships
    let deletedCount = 0;
    for (const membership of allMemberships) {
      await ctx.db.delete(membership._id);
      deletedCount++;
      console.log(`[ungroupWallet] Deleted membership for wallet: ${membership.walletAddress}`);
    }

    // Get all wallet groups
    const allGroups = await ctx.db.query("walletGroups").collect();
    console.log(`[ungroupWallet] Found ${allGroups.length} wallet groups`);

    // Delete all groups
    let deletedGroupsCount = 0;
    for (const group of allGroups) {
      await ctx.db.delete(group._id);
      deletedGroupsCount++;
      console.log(`[ungroupWallet] Deleted wallet group: ${group.groupId}`);
    }

    return {
      success: true,
      message: `Deleted ${deletedCount} wallet memberships and ${deletedGroupsCount} wallet groups. All wallets are now ungrouped.`,
      deletedMemberships: deletedCount,
      deletedGroups: deletedGroupsCount,
    };
  },
});
