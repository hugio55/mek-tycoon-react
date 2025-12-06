/**
 * Convex functions for Custom Minting System
 * Phase 1: Testnet minting with policy management
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ===== MINTING POLICIES =====

/**
 * Store a new minting policy
 */
export const storeMintingPolicy = mutation({
  args: {
    policyId: v.string(),
    policyName: v.string(),
    policyScript: v.any(),
    keyHash: v.string(),
    expirySlot: v.optional(v.number()),
    expiryDate: v.optional(v.number()),
    network: v.union(v.literal("mainnet"), v.literal("preprod"), v.literal("preview")),
    notes: v.optional(v.string()),

    // Wallet Configuration
    adminWallet: v.string(),
    payoutWallet: v.optional(v.string()),

    // Royalty Configuration
    royaltiesEnabled: v.optional(v.boolean()),
    royaltyPercentage: v.optional(v.number()),
    royaltyAddress: v.optional(v.string()),

    // Metadata Template
    metadataTemplate: v.optional(v.object({
      customFields: v.array(v.object({
        fieldName: v.string(),
        fieldType: v.union(v.literal("fixed"), v.literal("placeholder")),
        fixedValue: v.optional(v.string()),
      })),
    })),
  },
  handler: async (ctx, args) => {
    // Check if policy already exists
    const existing = await ctx.db
      .query("mintingPolicies")
      .withIndex("", (q: any) => q.eq("policyId", args.policyId))
      .first();

    if (existing) {
      throw new Error(
        `Policy ${args.policyId} already exists.\n\n` +
        `This usually means you're trying to create a policy with the same parameters (wallet + expiry).\n\n` +
        `To create a different policy:\n` +
        `1. Set a different expiry date (even by 1 minute creates a unique policy)\n` +
        `2. Or select an existing policy from the dropdown to add NFT designs to it`
      );
    }

    const policyId = await ctx.db.insert("mintingPolicies", {
      policyId: args.policyId,
      policyName: args.policyName,
      policyScript: args.policyScript,
      keyHash: args.keyHash,
      expirySlot: args.expirySlot,
      expiryDate: args.expiryDate,
      network: args.network,
      createdAt: Date.now(),
      isActive: true,
      notes: args.notes,

      // Wallet Configuration
      adminWallet: args.adminWallet,
      payoutWallet: args.payoutWallet,

      // Royalty Configuration
      royaltiesEnabled: args.royaltiesEnabled,
      royaltyPercentage: args.royaltyPercentage,
      royaltyAddress: args.royaltyAddress,

      // Metadata Template
      metadataTemplate: args.metadataTemplate,
    });

    return policyId;
  },
});

/**
 * Get all minting policies
 */
export const getMintingPolicies = query({
  args: {
    network: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let policies = ctx.db.query("mintingPolicies");

    if (args.network) {
      policies = policies.withIndex("", (q: any) =>
        q.eq("network", args.network as "mainnet" | "preprod" | "preview")
      );
    }

    return await policies.collect();
  },
});

/**
 * Get a specific policy by ID
 */
export const getPolicyById = query({
  args: { policyId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("mintingPolicies")
      .withIndex("", (q: any) => q.eq("policyId", args.policyId))
      .first();
  },
});

/**
 * Update policy active status
 */
export const updatePolicyStatus = mutation({
  args: {
    policyId: v.string(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const policy = await ctx.db
      .query("mintingPolicies")
      .withIndex("", (q: any) => q.eq("policyId", args.policyId))
      .first();

    if (!policy) {
      throw new Error(`Policy ${args.policyId} not found`);
    }

    await ctx.db.patch(policy._id, { isActive: args.isActive });
  },
});

/**
 * Delete a minting policy
 */
export const deleteMintingPolicy = mutation({
  args: {
    policyId: v.string(),
  },
  handler: async (ctx, args) => {
    const policy = await ctx.db
      .query("mintingPolicies")
      .withIndex("", (q: any) => q.eq("policyId", args.policyId))
      .first();

    if (!policy) {
      throw new Error(`Policy ${args.policyId} not found`);
    }

    // Check if any NFT designs use this policy
    const designs = await ctx.db
      .query("commemorativeTokenCounters")
      .filter((q) => q.eq(q.field("policyId"), args.policyId))
      .collect();

    if (designs.length > 0) {
      throw new Error(
        `Cannot delete policy - ${designs.length} NFT design(s) are using this policy.\n\n` +
        `⚠️ NOTE: Deleting only removes the policy from YOUR database - it does NOT delete anything from the blockchain.\n` +
        `The policy and any minted NFTs will still exist on Cardano forever.\n\n` +
        `To delete this policy, first delete all associated NFT designs.`
      );
    }

    console.log(`[Policy] Deleting policy ${args.policyId} from database (blockchain policy remains unchanged)`);
    await ctx.db.delete(policy._id);
  },
});

// ===== TEST MINTS =====

/**
 * Record a test mint transaction
 */
export const recordTestMint = mutation({
  args: {
    txHash: v.string(),
    policyId: v.string(),
    assetName: v.string(),
    nftName: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.string(),
    walletAddress: v.string(),
    network: v.string(),
    explorerUrl: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const assetId = args.policyId + args.assetName;

    const mintId = await ctx.db.insert("testMints", {
      txHash: args.txHash,
      policyId: args.policyId,
      assetName: args.assetName,
      assetId,
      nftName: args.nftName,
      description: args.description,
      imageUrl: args.imageUrl,
      walletAddress: args.walletAddress,
      network: args.network,
      confirmed: false,
      mintedAt: Date.now(),
      explorerUrl: args.explorerUrl,
      metadata: args.metadata,
    });

    return mintId;
  },
});

/**
 * Mark a test mint as confirmed
 */
export const confirmTestMint = mutation({
  args: {
    txHash: v.string(),
  },
  handler: async (ctx, args) => {
    const mint = await ctx.db
      .query("testMints")
      .withIndex("", (q: any) => q.eq("txHash", args.txHash))
      .first();

    if (!mint) {
      throw new Error(`Mint with tx ${args.txHash} not found`);
    }

    await ctx.db.patch(mint._id, {
      confirmed: true,
      confirmedAt: Date.now(),
    });
  },
});

/**
 * Get all test mints
 */
export const getTestMints = query({
  args: {
    network: v.optional(v.string()),
    walletAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let mints = ctx.db.query("testMints");

    if (args.network) {
      mints = mints.withIndex("", (q: any) => q.eq("network", args.network!));
    }

    if (args.walletAddress) {
      mints = mints.withIndex("", (q: any) => q.eq("walletAddress", args.walletAddress!));
    }

    return await mints.order("desc").collect();
  },
});

/**
 * Get test mints for a specific policy
 */
export const getMintsForPolicy = query({
  args: { policyId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("testMints")
      .withIndex("", (q: any) => q.eq("policyId", args.policyId))
      .order("desc")
      .collect();
  },
});

/**
 * Get mint by transaction hash
 */
export const getMintByTxHash = query({
  args: { txHash: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("testMints")
      .withIndex("", (q: any) => q.eq("txHash", args.txHash))
      .first();
  },
});

// ===== BATCH MINTING HISTORY =====

/**
 * Get all batch minted tokens (minting history)
 * Supports filtering by network, tokenType, status
 */
export const getBatchMintingHistory = query({
  args: {
    network: v.optional(v.string()),
    tokenType: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("batchMintedTokens");

    // Apply filters
    if (args.network) {
      query = query.withIndex("", (q: any) => q.eq("network", args.network!));
    }

    if (args.tokenType) {
      query = query.filter((q) => q.eq(q.field("tokenType"), args.tokenType));
    }

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    // Order by most recent first
    const results = await query.order("desc").collect();

    // Apply limit if specified
    if (args.limit) {
      return results.slice(0, args.limit);
    }

    return results;
  },
});

/**
 * Get batch minting summary statistics
 */
export const getBatchMintingStats = query({
  args: {
    network: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("batchMintedTokens");

    if (args.network) {
      query = query.withIndex("", (q: any) => q.eq("network", args.network!));
    }

    const allMints = await query.collect();

    const stats = {
      totalMinted: allMints.length,
      confirmedMints: allMints.filter(m => m.status === "confirmed").length,
      pendingMints: allMints.filter(m => m.status === "pending" || m.status === "submitted").length,
      failedMints: allMints.filter(m => m.status === "failed").length,
      uniqueRecipients: new Set(allMints.map(m => m.recipientAddress)).size,
      uniqueTokenTypes: new Set(allMints.map(m => m.tokenType)).size,
      totalBatches: new Set(allMints.map(m => m.batchId)).size,
    };

    return stats;
  },
});

/**
 * Get batch minting history for a specific recipient
 */
export const getBatchMintsByRecipient = query({
  args: {
    recipientAddress: v.string(),
    network: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("batchMintedTokens")
      .withIndex("", (q: any) => q.eq("recipientAddress", args.recipientAddress));

    const results = await query.order("desc").collect();

    if (args.network) {
      return results.filter(m => m.network === args.network);
    }

    return results;
  },
});

/**
 * Get batch minting history for a specific token type
 */
export const getBatchMintsByTokenType = query({
  args: {
    tokenType: v.string(),
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("batchMintedTokens")
      .filter((q) => q.eq(q.field("tokenType"), args.tokenType))
      .order("desc")
      .collect();

    return results;
  },
});
