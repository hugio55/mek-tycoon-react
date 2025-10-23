import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Save a mint record to history
 */
export const saveMintRecord = mutation({
  args: {
    nftUid: v.string(),
    tokenname: v.string(),
    displayName: v.string(),
    projectUid: v.string(),
    projectName: v.optional(v.string()),
    description: v.optional(v.string()),
    mediaType: v.string(),
    ipfsHash: v.optional(v.string()),
    thumbnailIpfsHash: v.optional(v.string()),
    customMetadata: v.optional(v.any()),
    receiverAddress: v.string(),
    mintStatus: v.string(), // "queued", "minted", "failed"
    mintAndSendId: v.optional(v.number()),
    policyId: v.optional(v.string()),
    assetId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const mintId = await ctx.db.insert("mintHistory", {
      nftUid: args.nftUid,
      tokenname: args.tokenname,
      displayName: args.displayName,
      projectUid: args.projectUid,
      projectName: args.projectName,
      description: args.description,
      mediaType: args.mediaType,
      ipfsHash: args.ipfsHash,
      thumbnailIpfsHash: args.thumbnailIpfsHash,
      customMetadata: args.customMetadata,
      receiverAddress: args.receiverAddress,
      mintStatus: args.mintStatus,
      mintAndSendId: args.mintAndSendId,
      policyId: args.policyId,
      assetId: args.assetId,
      createdAt: now,
    });

    console.log("[MintHistory] Saved mint record:", args.displayName);

    return mintId;
  },
});

/**
 * Get mint history (most recent first)
 */
export const getMintHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    const records = await ctx.db
      .query("mintHistory")
      .order("desc")
      .take(limit);

    return records;
  },
});

/**
 * Get mint record by NFT UID
 */
export const getMintByNftUid = query({
  args: {
    nftUid: v.string(),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("mintHistory")
      .withIndex("by_nft_uid", (q) => q.eq("nftUid", args.nftUid))
      .first();

    return record;
  },
});

/**
 * Update policy ID for a mint record
 */
export const updatePolicyId = mutation({
  args: {
    nftUid: v.string(),
    policyId: v.string(),
    tokenname: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("mintHistory")
      .withIndex("by_nft_uid", (q) => q.eq("nftUid", args.nftUid))
      .first();

    if (!record) {
      throw new Error(`Mint record not found for nftUid: ${args.nftUid}`);
    }

    await ctx.db.patch(record._id, {
      policyId: args.policyId,
      ...(args.tokenname && { tokenname: args.tokenname }),
    });

    console.log("[MintHistory] Updated policyId for:", args.nftUid);

    return record._id;
  },
});
