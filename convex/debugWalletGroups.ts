import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Diagnostic tool to check wallet group membership state
 * Helps identify orphaned groups, duplicate memberships, and data integrity issues
 */

export const checkWalletGroupStatus = query({
  args: {
    walletAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get all wallet groups
    const allGroups = await ctx.db.query("walletGroups").collect();

    // Get all memberships
    const allMemberships = await ctx.db.query("walletGroupMemberships").collect();

    // If specific wallet provided, check its status
    let walletSpecificData = null;
    if (args.walletAddress) {
      const membership = await ctx.db
        .query("walletGroupMemberships")
        .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
        .first();

      if (membership) {
        const group = await ctx.db
          .query("walletGroups")
          .withIndex("by_groupId", (q) => q.eq("groupId", membership.groupId))
          .first();

        // Get all wallets in this group
        const groupMembers = await ctx.db
          .query("walletGroupMemberships")
          .withIndex("by_group", (q) => q.eq("groupId", membership.groupId))
          .collect();

        walletSpecificData = {
          walletAddress: args.walletAddress,
          hasMembership: true,
          groupId: membership.groupId,
          addedAt: membership.addedAt,
          nickname: membership.nickname,
          originalCompanyName: membership.originalCompanyName,
          groupExists: !!group,
          groupPrimaryWallet: group?.primaryWallet,
          groupCreatedAt: group?.createdAt,
          totalMembersInGroup: groupMembers.length,
          allMembersInGroup: groupMembers.map(m => ({
            wallet: m.walletAddress,
            nickname: m.nickname,
            addedAt: m.addedAt,
          })),
        };
      } else {
        walletSpecificData = {
          walletAddress: args.walletAddress,
          hasMembership: false,
        };
      }
    }

    // Find orphaned groups (groups with no memberships)
    const orphanedGroups = [];
    for (const group of allGroups) {
      const memberships = await ctx.db
        .query("walletGroupMemberships")
        .withIndex("by_group", (q) => q.eq("groupId", group.groupId))
        .collect();

      if (memberships.length === 0) {
        orphanedGroups.push({
          groupId: group.groupId,
          primaryWallet: group.primaryWallet,
          createdAt: group.createdAt,
        });
      }
    }

    // Find memberships with no parent group
    const orphanedMemberships = [];
    for (const membership of allMemberships) {
      const group = await ctx.db
        .query("walletGroups")
        .withIndex("by_groupId", (q) => q.eq("groupId", membership.groupId))
        .first();

      if (!group) {
        orphanedMemberships.push({
          walletAddress: membership.walletAddress,
          groupId: membership.groupId,
          addedAt: membership.addedAt,
          nickname: membership.nickname,
        });
      }
    }

    // Find duplicate memberships (same wallet in multiple groups)
    const walletToGroups = new Map<string, string[]>();
    for (const membership of allMemberships) {
      const groups = walletToGroups.get(membership.walletAddress) || [];
      groups.push(membership.groupId);
      walletToGroups.set(membership.walletAddress, groups);
    }

    const duplicateMemberships = [];
    for (const [wallet, groups] of walletToGroups.entries()) {
      if (groups.length > 1) {
        duplicateMemberships.push({
          wallet,
          groups,
          count: groups.length,
        });
      }
    }

    // Get group size distribution
    const groupSizes = new Map<string, number>();
    for (const membership of allMemberships) {
      const count = groupSizes.get(membership.groupId) || 0;
      groupSizes.set(membership.groupId, count + 1);
    }

    const singleWalletGroups = [];
    for (const [groupId, size] of groupSizes.entries()) {
      if (size === 1) {
        const group = await ctx.db
          .query("walletGroups")
          .withIndex("by_groupId", (q) => q.eq("groupId", groupId))
          .first();

        const membership = await ctx.db
          .query("walletGroupMemberships")
          .withIndex("by_group", (q) => q.eq("groupId", groupId))
          .first();

        singleWalletGroups.push({
          groupId,
          primaryWallet: group?.primaryWallet,
          memberWallet: membership?.walletAddress,
          createdAt: group?.createdAt,
        });
      }
    }

    return {
      summary: {
        totalGroups: allGroups.length,
        totalMemberships: allMemberships.length,
        orphanedGroups: orphanedGroups.length,
        orphanedMemberships: orphanedMemberships.length,
        duplicateMemberships: duplicateMemberships.length,
        singleWalletGroups: singleWalletGroups.length,
      },
      walletSpecificData,
      orphanedGroups,
      orphanedMemberships,
      duplicateMemberships,
      singleWalletGroups,
      allGroups: allGroups.map(g => ({
        groupId: g.groupId,
        primaryWallet: g.primaryWallet,
        createdAt: g.createdAt,
      })),
      allMemberships: allMemberships.map(m => ({
        walletAddress: m.walletAddress,
        groupId: m.groupId,
        addedAt: m.addedAt,
        nickname: m.nickname,
      })),
    };
  },
});

export const getWalletGroupAuditLogs = query({
  args: {
    walletAddress: v.optional(v.string()),
    groupId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let auditLogs = await ctx.db.query("walletGroupAudit").collect();

    // Filter by wallet if provided
    if (args.walletAddress) {
      auditLogs = auditLogs.filter(
        log => log.performedBy === args.walletAddress || log.targetWallet === args.walletAddress
      );
    }

    // Filter by groupId if provided
    if (args.groupId) {
      auditLogs = auditLogs.filter(log => log.groupId === args.groupId);
    }

    // Sort by timestamp descending (most recent first)
    auditLogs.sort((a, b) => b.timestamp - a.timestamp);

    // Limit results if specified
    if (args.limit) {
      auditLogs = auditLogs.slice(0, args.limit);
    }

    return {
      totalLogs: auditLogs.length,
      logs: auditLogs.map(log => ({
        groupId: log.groupId,
        action: log.action,
        performedBy: log.performedBy,
        targetWallet: log.targetWallet,
        timestamp: log.timestamp,
        timestampReadable: new Date(log.timestamp).toISOString(),
        success: log.success,
        errorMessage: log.errorMessage,
        signature: log.signature ? log.signature.substring(0, 20) + "..." : undefined,
        nonce: log.nonce,
      })),
    };
  },
});
