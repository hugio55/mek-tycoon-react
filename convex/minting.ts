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
  },
  handler: async (ctx, args) => {
    // Check if policy already exists
    const existing = await ctx.db
      .query("mintingPolicies")
      .withIndex("by_policy_id", (q) => q.eq("policyId", args.policyId))
      .first();

    if (existing) {
      throw new Error(`Policy ${args.policyId} already exists`);
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
      policies = policies.withIndex("by_network", (q) =>
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
      .withIndex("by_policy_id", (q) => q.eq("policyId", args.policyId))
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
      .withIndex("by_policy_id", (q) => q.eq("policyId", args.policyId))
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
      .withIndex("by_policy_id", (q) => q.eq("policyId", args.policyId))
      .first();

    if (!policy) {
      throw new Error(`Policy ${args.policyId} not found`);
    }

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
      .withIndex("by_tx_hash", (q) => q.eq("txHash", args.txHash))
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
      mints = mints.withIndex("by_network", (q) => q.eq("network", args.network!));
    }

    if (args.walletAddress) {
      mints = mints.withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress!));
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
      .withIndex("by_policy_id", (q) => q.eq("policyId", args.policyId))
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
      .withIndex("by_tx_hash", (q) => q.eq("txHash", args.txHash))
      .first();
  },
});
