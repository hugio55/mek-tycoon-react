import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ==========================================
// QUERIES
// ==========================================

// Get active airdrop configuration
export const getActiveConfig = query({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db
      .query("airdropConfig")
      .withIndex("by_active", (q: any) => q.eq("isActive", true))
      .first();

    return config;
  },
});

// Get airdrop config by campaign name
export const getConfigByCampaign = query({
  args: { campaignName: v.string() },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("airdropConfig")
      .withIndex("by_campaign", (q: any) => q.eq("campaignName", args.campaignName))
      .first();

    return config;
  },
});

// Check if user has already submitted for a campaign
export const getUserSubmission = query({
  args: {
    userId: v.id("users"),
    campaignName: v.string()
  },
  handler: async (ctx, args) => {
    const submission = await ctx.db
      .query("airdropSubmissions")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("campaignName"), args.campaignName))
      .first();

    return submission;
  },
});

// Get all submissions for admin dashboard
export const getAllSubmissions = query({
  args: {
    campaignName: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("sent"),
      v.literal("failed")
    ))
  },
  handler: async (ctx, args) => {
    let submissions;

    if (args.campaignName) {
      submissions = await ctx.db
        .query("airdropSubmissions")
        .withIndex("by_campaign", (q: any) => q.eq("campaignName", args.campaignName!))
        .collect();
    } else {
      submissions = await ctx.db
        .query("airdropSubmissions")
        .collect();
    }

    // Filter by status if provided
    if (args.status) {
      submissions = submissions.filter((s: any) => s.status === args.status);
    }

    // Get user details for each submission
    const submissionsWithUsers = await Promise.all(
      submissions.map(async (submission) => {
        const user = await ctx.db.get(submission.userId);
        return {
          ...submission,
          user: {
            walletAddress: user?.walletAddress,
            username: user?.username,
            gold: user?.gold,
          }
        };
      })
    );

    return submissionsWithUsers;
  },
});

// Get submission statistics
export const getSubmissionStats = query({
  args: { campaignName: v.string() },
  handler: async (ctx, args) => {
    const submissions = await ctx.db
      .query("airdropSubmissions")
      .withIndex("by_campaign", (q: any) => q.eq("campaignName", args.campaignName))
      .collect();

    const stats = {
      total: submissions.length,
      pending: submissions.filter((s: any) => s.status === "pending").length,
      processing: submissions.filter((s: any) => s.status === "processing").length,
      sent: submissions.filter((s: any) => s.status === "sent").length,
      failed: submissions.filter((s: any) => s.status === "failed").length,
    };

    return stats;
  },
});

// Phase II: Count eligible users (verified + gold > minimum)
export const getEligibleUsersCount = query({
  args: { minimumGold: v.number() },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .collect();

    const eligible = users.filter((user: any) => {
      return (
        (user.gold || 0) > args.minimumGold &&
        user.stakeAddress &&
        user.walletVerified === true
      );
    });

    return eligible.length;
  },
});

// Phase II: Get list of eligible users with details (for minting interface)
export const getEligibleUsersList = query({
  args: { minimumGold: v.number() },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .collect();

    const eligible = users.filter((user: any) => {
      return (
        (user.gold || 0) > args.minimumGold &&
        user.stakeAddress &&
        user.walletVerified === true
      );
    });

    return eligible.map((user: any) => ({
      _id: user._id,
      walletAddress: user.stakeAddress,
      companyName: user.corporationName,
      currentGold: Math.round((user.gold || 0) * 100) / 100,
      totalGoldPerHour: 0, // Phase II: calculated from job slots
      isBlockchainVerified: user.walletVerified,
    }));
  },
});

// Get company names for wallet addresses
export const getWalletCompanyNames = query({
  args: { walletAddresses: v.array(v.string()) },
  handler: async (ctx, args) => {
    const companyMap: Record<string, string | null> = {};

    for (const walletAddress of args.walletAddresses) {
      const miner = await ctx.db
        .query("goldMining")
        .withIndex("by_wallet", (q: any) => q.eq("walletAddress", walletAddress))
        .first();

      companyMap[walletAddress] = miner?.companyName || null;
    }

    return companyMap;
  },
});

// ==========================================
// MUTATIONS
// ==========================================

// Create or update airdrop configuration (Admin only)
export const upsertConfig = mutation({
  args: {
    campaignName: v.string(),
    isActive: v.boolean(),
    nftName: v.string(),
    nftDescription: v.string(),
    minimumGold: v.number(),
    imageUrl: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    nmkrProjectId: v.optional(v.string()),
    policyId: v.optional(v.string()),
    testMode: v.optional(v.boolean()),
    testWallets: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Check if config exists
    const existing = await ctx.db
      .query("airdropConfig")
      .withIndex("by_campaign", (q: any) => q.eq("campaignName", args.campaignName))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Create new
      const id = await ctx.db.insert("airdropConfig", {
        ...args,
        createdAt: now,
        updatedAt: now,
      });
      return id;
    }
  },
});

// Submit receive address (User action)
export const submitAddress = mutation({
  args: {
    userId: v.id("users"),
    receiveAddress: v.string(),
    campaignName: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify campaign is active
    const config = await ctx.db
      .query("airdropConfig")
      .withIndex("by_campaign", (q: any) => q.eq("campaignName", args.campaignName))
      .first();

    if (!config || !config.isActive) {
      throw new Error("This airdrop campaign is not currently active");
    }

    // Get user to get their wallet address
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get goldMining record for verification and gold balance
    const miner = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", user.walletAddress))
      .first();

    if (!miner) {
      throw new Error("No mining record found for this wallet");
    }

    // Check wallet verification (blockchain verification)
    if (!miner.isBlockchainVerified) {
      throw new Error("Your wallet must be verified to claim this airdrop");
    }

    // Calculate current gold (including ongoing accumulation)
    const now = Date.now();
    let currentGold = miner.accumulatedGold || 0;

    if (miner.isBlockchainVerified === true) {
      const lastUpdateTime = miner.lastSnapshotTime || miner.updatedAt || miner.createdAt;
      const hoursSinceLastUpdate = (now - lastUpdateTime) / (1000 * 60 * 60);
      const goldSinceLastUpdate = miner.totalGoldPerHour * hoursSinceLastUpdate;
      currentGold = (miner.accumulatedGold || 0) + goldSinceLastUpdate;
    }

    // Check eligibility - must have MORE than minimum gold (strictly greater than)
    if (currentGold <= config.minimumGold) {
      throw new Error(`You need more than ${config.minimumGold} gold to qualify`);
    }

    // Check if already submitted
    const existing = await ctx.db
      .query("airdropSubmissions")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("campaignName"), args.campaignName))
      .first();

    if (existing) {
      throw new Error("You have already submitted an address for this campaign");
    }

    // Validate Cardano address format
    if (!args.receiveAddress.startsWith("addr1") && !args.receiveAddress.startsWith("addr_test1")) {
      throw new Error("Invalid Cardano address. Must start with addr1 or addr_test1");
    }

    if (args.receiveAddress.length < 58 || args.receiveAddress.length > 108) {
      throw new Error("Invalid Cardano address length");
    }

    // Create submission
    const submissionId = await ctx.db.insert("airdropSubmissions", {
      userId: args.userId,
      walletAddress: user.walletAddress,
      receiveAddress: args.receiveAddress,
      goldAtSubmission: currentGold,
      submittedAt: now,
      status: "pending",
      campaignName: args.campaignName,
    });

    // Update config statistics
    const currentStats = await ctx.db
      .query("airdropSubmissions")
      .withIndex("by_campaign", (q: any) => q.eq("campaignName", args.campaignName))
      .collect();

    await ctx.db.patch(config._id, {
      totalSubmitted: currentStats.length + 1,
    });

    return submissionId;
  },
});

// Update submission status (Admin/System action)
export const updateSubmissionStatus = mutation({
  args: {
    submissionId: v.id("airdropSubmissions"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("sent"),
      v.literal("failed")
    ),
    transactionHash: v.optional(v.string()),
    transactionUrl: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: any = {
      status: args.status,
    };

    if (args.status === "sent") {
      updates.sentAt = Date.now();
      updates.transactionHash = args.transactionHash;
      updates.transactionUrl = args.transactionUrl;
    }

    if (args.status === "failed") {
      updates.errorMessage = args.errorMessage;
    }

    await ctx.db.patch(args.submissionId, updates);

    return { success: true };
  },
});

// Toggle airdrop active status (Admin only)
export const toggleActive = mutation({
  args: {
    campaignName: v.string(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("airdropConfig")
      .withIndex("by_campaign", (q: any) => q.eq("campaignName", args.campaignName))
      .first();

    if (!config) {
      throw new Error("Campaign not found");
    }

    await ctx.db.patch(config._id, {
      isActive: args.isActive,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Retry failed submission (Admin action)
export const retrySubmission = mutation({
  args: {
    submissionId: v.id("airdropSubmissions"),
  },
  handler: async (ctx, args) => {
    const submission = await ctx.db.get(args.submissionId);

    if (!submission) {
      throw new Error("Submission not found");
    }

    await ctx.db.patch(args.submissionId, {
      status: "pending",
      retryCount: (submission.retryCount || 0) + 1,
      lastRetryAt: Date.now(),
      errorMessage: undefined,
    });

    return { success: true };
  },
});

// Add admin notes to submission
export const addAdminNotes = mutation({
  args: {
    submissionId: v.id("airdropSubmissions"),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.submissionId, {
      adminNotes: args.notes,
    });

    return { success: true };
  },
});
