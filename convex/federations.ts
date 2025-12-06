import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ===== QUERIES =====

// Get federation by ID
export const getFederation = query({
  args: { federationId: v.string() },
  handler: async (ctx, args) => {
    const federation = await ctx.db
      .query("federations")
      .withIndex("", (q: any) => q.eq("federationId", args.federationId))
      .first();

    if (!federation) return null;

    // Get members
    const memberships = await ctx.db
      .query("federationMemberships")
      .withIndex("", (q: any) => q.eq("federationId", args.federationId))
      .collect();

    return {
      ...federation,
      members: memberships,
    };
  },
});

// Get all federations (for browsing/discovery)
export const getAllFederations = query({
  handler: async (ctx) => {
    const federations = await ctx.db
      .query("federations")
      .collect();

    return federations;
  },
});

// Get federation for a specific wallet/corporation
export const getFederationByWallet = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("federationMemberships")
      .withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!membership) return null;

    const federation = await ctx.db
      .query("federations")
      .withIndex("", (q: any) => q.eq("federationId", membership.federationId))
      .first();

    return federation;
  },
});

// Get federation variation collection
export const getFederationVariations = query({
  args: { federationId: v.string() },
  handler: async (ctx, args) => {
    const variations = await ctx.db
      .query("federationVariationCollection")
      .withIndex("", (q: any) => q.eq("federationId", args.federationId))
      .collect();

    return variations;
  },
});

// Get pending invites for a wallet/corporation
export const getPendingInvites = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const invites = await ctx.db
      .query("federationInvites")
      .withIndex("", (q: any) => q.eq("invitedWalletAddress", args.walletAddress))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    // Get federation details for each invite
    const invitesWithDetails = await Promise.all(
      invites.map(async (invite) => {
        const federation = await ctx.db
          .query("federations")
          .withIndex("", (q: any) => q.eq("federationId", invite.federationId))
          .first();

        return {
          ...invite,
          federation,
        };
      })
    );

    return invitesWithDetails;
  },
});

// ===== MUTATIONS =====

// Create a new federation
export const createFederation = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    leaderWalletAddress: v.string(),
    emblem: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const federationId = crypto.randomUUID();
    const now = Date.now();

    // Create federation
    const fedId = await ctx.db.insert("federations", {
      federationId,
      name: args.name,
      description: args.description,
      leaderWalletAddress: args.leaderWalletAddress,
      emblem: args.emblem,
      color: args.color || "#fab617",
      memberCount: 1,
      createdAt: now,
      updatedAt: now,
    });

    // Add leader as first member
    await ctx.db.insert("federationMemberships", {
      federationId,
      walletAddress: args.leaderWalletAddress,
      joinedAt: now,
      role: "leader",
    });

    // Initialize variation collection
    await updateFederationVariations(ctx, federationId);

    return { federationId };
  },
});

// Invite a wallet/corporation to join federation
export const inviteToFederation = mutation({
  args: {
    federationId: v.string(),
    invitedWalletAddress: v.string(),
    invitedByWalletAddress: v.string(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if inviter is a member with permission
    const inviterMembership = await ctx.db
      .query("federationMemberships")
      .withIndex("", (q: any) =>
        q.eq("federationId", args.federationId).eq("walletAddress", args.invitedByWalletAddress)
      )
      .first();

    if (!inviterMembership || (inviterMembership.role !== "leader" && inviterMembership.role !== "officer")) {
      throw new Error("Only leaders and officers can invite members");
    }

    // Check if wallet is already a member
    const existingMembership = await ctx.db
      .query("federationMemberships")
      .withIndex("", (q: any) => q.eq("walletAddress", args.invitedWalletAddress))
      .first();

    if (existingMembership) {
      throw new Error("Corporation is already in a federation");
    }

    // Check for existing pending invite
    const existingInvite = await ctx.db
      .query("federationInvites")
      .withIndex("", (q: any) => q.eq("invitedWalletAddress", args.invitedWalletAddress))
      .filter((q) =>
        q.and(
          q.eq(q.field("federationId"), args.federationId),
          q.eq(q.field("status"), "pending")
        )
      )
      .first();

    if (existingInvite) {
      throw new Error("Invite already sent to this corporation");
    }

    const now = Date.now();
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days

    await ctx.db.insert("federationInvites", {
      federationId: args.federationId,
      invitedWalletAddress: args.invitedWalletAddress,
      invitedByWalletAddress: args.invitedByWalletAddress,
      status: "pending",
      message: args.message,
      createdAt: now,
      expiresAt,
    });

    return { success: true };
  },
});

// Accept federation invite
export const acceptInvite = mutation({
  args: {
    inviteId: v.id("federationInvites"),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const invite = await ctx.db.get(args.inviteId);

    if (!invite) {
      throw new Error("Invite not found");
    }

    if (invite.invitedWalletAddress !== args.walletAddress) {
      throw new Error("This invite is not for your corporation");
    }

    if (invite.status !== "pending") {
      throw new Error("Invite is no longer pending");
    }

    if (invite.expiresAt < Date.now()) {
      throw new Error("Invite has expired");
    }

    const now = Date.now();

    // Add wallet to federation
    await ctx.db.insert("federationMemberships", {
      federationId: invite.federationId,
      walletAddress: args.walletAddress,
      joinedAt: now,
      role: "member",
    });

    // Update invite status
    await ctx.db.patch(args.inviteId, {
      status: "accepted",
      respondedAt: now,
    });

    // Update federation member count
    const federation = await ctx.db
      .query("federations")
      .withIndex("", (q: any) => q.eq("federationId", invite.federationId))
      .first();

    if (federation) {
      await ctx.db.patch(federation._id, {
        memberCount: federation.memberCount + 1,
        updatedAt: now,
      });
    }

    // Update variation collection
    await updateFederationVariations(ctx, invite.federationId);

    return { success: true, federationId: invite.federationId };
  },
});

// Reject federation invite
export const rejectInvite = mutation({
  args: {
    inviteId: v.id("federationInvites"),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const invite = await ctx.db.get(args.inviteId);

    if (!invite || invite.invitedWalletAddress !== args.walletAddress) {
      throw new Error("Invalid invite");
    }

    await ctx.db.patch(args.inviteId, {
      status: "rejected",
      respondedAt: Date.now(),
    });

    return { success: true };
  },
});

// Leave federation
export const leaveFederation = mutation({
  args: {
    federationId: v.string(),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("federationMemberships")
      .withIndex("", (q: any) =>
        q.eq("federationId", args.federationId).eq("walletAddress", args.walletAddress)
      )
      .first();

    if (!membership) {
      throw new Error("Not a member of this federation");
    }

    if (membership.role === "leader") {
      throw new Error("Leader cannot leave. Transfer leadership or disband federation first.");
    }

    // Remove membership
    await ctx.db.delete(membership._id);

    // Update federation member count
    const federation = await ctx.db
      .query("federations")
      .withIndex("", (q: any) => q.eq("federationId", args.federationId))
      .first();

    if (federation) {
      await ctx.db.patch(federation._id, {
        memberCount: federation.memberCount - 1,
        updatedAt: Date.now(),
      });
    }

    // Update variation collection
    await updateFederationVariations(ctx, args.federationId);

    return { success: true };
  },
});

// Helper function to update federation variation collection
async function updateFederationVariations(ctx: any, federationId: string) {
  // Get all members of the federation (now each membership IS a wallet/corporation)
  const memberships = await ctx.db
    .query("federationMemberships")
    .withIndex("", (q: any) => q.eq("federationId", federationId))
    .collect();

  // Get all wallet addresses directly from memberships (1 wallet = 1 corp)
  const allWallets: string[] = memberships.map((m: any) => m.walletAddress);

  // Get all Meks owned by these wallets
  const allMeks = await ctx.db
    .query("meks")
    .filter((q: any) =>
      q.or(...allWallets.map((wallet) => q.eq(q.field("owner"), wallet)))
    )
    .collect();

  // Aggregate variations
  const variationMap = new Map<number, { count: number; wallets: Set<string> }>();

  for (const mek of allMeks) {
    // Get variationIds from Mek
    const variationIds = [
      mek.headVariationId,
      mek.bodyVariationId,
    ].filter((id) => id !== undefined) as number[];

    for (const varId of variationIds) {
      if (!variationMap.has(varId)) {
        variationMap.set(varId, { count: 0, wallets: new Set() });
      }
      const data = variationMap.get(varId)!;
      data.count++;

      // Track which wallet owns this variation
      data.wallets.add(mek.owner);
    }
  }

  // Clear existing variation collection
  const existingVariations = await ctx.db
    .query("federationVariationCollection")
    .withIndex("", (q: any) => q.eq("federationId", federationId))
    .collect();

  for (const existing of existingVariations) {
    await ctx.db.delete(existing._id);
  }

  // Insert new variation collection
  const now = Date.now();
  for (const [variationId, data] of variationMap.entries()) {
    await ctx.db.insert("federationVariationCollection", {
      federationId,
      variationId,
      count: data.count,
      contributingWallets: Array.from(data.wallets),
      lastUpdated: now,
    });
  }

  // Update federation stats
  const federation = await ctx.db
    .query("federations")
    .withIndex("", (q: any) => q.eq("federationId", federationId))
    .first();

  if (federation) {
    await ctx.db.patch(federation._id, {
      uniqueVariationCount: variationMap.size,
      totalMekCount: allMeks.length,
      lastMiningUpdate: now,
      updatedAt: now,
    });
  }
}

// Manual trigger to recalculate federation variations (for admin/debugging)
export const recalculateFederationVariations = mutation({
  args: { federationId: v.string() },
  handler: async (ctx, args) => {
    await updateFederationVariations(ctx, args.federationId);
    return { success: true };
  },
});

// ===== PLANET MINING SYSTEM =====

// Get active mining operations for a federation
export const getActiveMining = query({
  args: { federationId: v.string() },
  handler: async (ctx, args) => {
    const mining = await ctx.db
      .query("planetMining")
      .withIndex("", (q: any) => q.eq("federationId", args.federationId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    return mining;
  },
});

// Get mining history for a federation
export const getMiningHistory = query({
  args: { federationId: v.string() },
  handler: async (ctx, args) => {
    const mining = await ctx.db
      .query("planetMining")
      .withIndex("", (q: any) => q.eq("federationId", args.federationId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

    return mining.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
  },
});

// Start a mining operation
export const startMining = mutation({
  args: {
    federationId: v.string(),
    planetName: v.string(),
    durationHours: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if federation exists
    const federation = await ctx.db
      .query("federations")
      .withIndex("", (q: any) => q.eq("federationId", args.federationId))
      .first();

    if (!federation) {
      throw new Error("Federation not found");
    }

    // Check if there's already an active mining operation
    const activeMining = await ctx.db
      .query("planetMining")
      .withIndex("", (q: any) => q.eq("federationId", args.federationId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (activeMining) {
      throw new Error("Already have an active mining operation");
    }

    const now = Date.now();
    const completesAt = now + args.durationHours * 60 * 60 * 1000;

    // Get variation count for diversity calculation
    const variationCount = federation.uniqueVariationCount || 0;

    // Calculate required diversity based on planet difficulty (placeholder logic)
    const requiredDiversity = getPlanetDifficulty(args.planetName);

    // Calculate success rate (0-100)
    const successRate = Math.min(100, Math.floor((variationCount / requiredDiversity) * 100));

    const miningId = crypto.randomUUID();

    await ctx.db.insert("planetMining", {
      miningId,
      federationId: args.federationId,
      planetName: args.planetName,
      startedAt: now,
      completesAt,
      status: "active",
      requiredDiversity,
      currentDiversity: variationCount,
      successRate,
    });

    return { miningId, successRate, completesAt };
  },
});

// Complete a mining operation (check if time is up and distribute rewards)
export const completeMining = mutation({
  args: { miningId: v.string() },
  handler: async (ctx, args) => {
    const mining = await ctx.db
      .query("planetMining")
      .filter((q) => q.eq(q.field("miningId"), args.miningId))
      .first();

    if (!mining) {
      throw new Error("Mining operation not found");
    }

    if (mining.status !== "active") {
      throw new Error("Mining operation is not active");
    }

    const now = Date.now();

    if (now < mining.completesAt) {
      throw new Error("Mining operation not yet complete");
    }

    // Calculate rewards based on success rate
    const baseReward = 1000; // Base resources earned
    const actualReward = Math.floor(baseReward * (mining.successRate / 100));

    const resources = {
      minerals: actualReward,
      crystals: Math.floor(actualReward * 0.5),
      exoticMatter: Math.floor(actualReward * 0.1),
    };

    // Update mining record
    const miningDoc = await ctx.db
      .query("planetMining")
      .filter((q) => q.eq(q.field("miningId"), args.miningId))
      .first();

    if (miningDoc) {
      await ctx.db.patch(miningDoc._id, {
        status: "completed",
        completedAt: now,
        resourcesEarned: resources,
      });
    }

    return { success: true, resources };
  },
});

// Cancel a mining operation (early exit, no rewards)
export const cancelMining = mutation({
  args: { miningId: v.string() },
  handler: async (ctx, args) => {
    const mining = await ctx.db
      .query("planetMining")
      .filter((q) => q.eq(q.field("miningId"), args.miningId))
      .first();

    if (!mining) {
      throw new Error("Mining operation not found");
    }

    if (mining.status !== "active") {
      throw new Error("Mining operation is not active");
    }

    await ctx.db.patch(mining._id, {
      status: "cancelled",
      completedAt: Date.now(),
    });

    return { success: true };
  },
});

// Helper function to determine planet difficulty (placeholder)
function getPlanetDifficulty(planetName: string): number {
  // Map planet names to required variation counts
  const difficulties: Record<string, number> = {
    "Mercury": 50,
    "Venus": 75,
    "Mars": 100,
    "Jupiter": 150,
    "Saturn": 200,
    "Uranus": 250,
    "Neptune": 275,
    "Pluto": 291, // All variations required!
  };

  return difficulties[planetName] || 100;
}
