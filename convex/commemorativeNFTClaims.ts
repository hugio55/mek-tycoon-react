import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Commemorative NFT Claims System
 *
 * Tracks actual NFT ownership after successful NMKR purchases.
 * This is separate from commemorativePurchases to maintain clean separation
 * between purchase intent/tracking and actual NFT ownership.
 */

// Record a new NFT claim (called by webhook after successful mint)
export const recordClaim = mutation({
  args: {
    walletAddress: v.string(),
    transactionHash: v.string(),
    nftName: v.string(),
    nftAssetId: v.string(),
    metadata: v.optional(v.object({
      imageUrl: v.optional(v.string()),
      attributes: v.optional(v.array(v.object({
        trait_type: v.string(),
        value: v.string()
      }))),
      collection: v.optional(v.string()),
      artist: v.optional(v.string()),
      website: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    console.log('[🔨CLAIM] Recording NFT claim:', {
      wallet: args.walletAddress,
      tx: args.transactionHash,
      nft: args.nftName
    });

    // Check if claim already exists
    const existingClaim = await ctx.db
      .query("commemorativeNFTClaims")
      .withIndex("by_transaction", (q) => q.eq("transactionHash", args.transactionHash))
      .first();

    if (existingClaim) {
      console.log('[🔨CLAIM] Claim already exists for transaction:', args.transactionHash);
      return existingClaim._id;
    }

    // Create new claim record
    const claimId = await ctx.db.insert("commemorativeNFTClaims", {
      walletAddress: args.walletAddress,
      transactionHash: args.transactionHash,
      nftName: args.nftName,
      nftAssetId: args.nftAssetId,
      claimedAt: Date.now(),
      metadata: args.metadata,
    });

    console.log('[🔨CLAIM] Claim recorded successfully:', claimId);
    return claimId;
  },
});

// Check if a wallet has claimed (for button state)
export const checkClaimed = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const claim = await ctx.db
      .query("commemorativeNFTClaims")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    return {
      hasClaimed: !!claim,
      claim: claim || null,
    };
  },
});

// Get claim details for display (for success modal)
export const getClaimByTransaction = query({
  args: {
    transactionHash: v.string(),
  },
  handler: async (ctx, args) => {
    const claim = await ctx.db
      .query("commemorativeNFTClaims")
      .withIndex("by_transaction", (q) => q.eq("transactionHash", args.transactionHash))
      .first();

    return claim;
  },
});

// Get all claims for a wallet (user's NFT collection)
export const getWalletClaims = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const claims = await ctx.db
      .query("commemorativeNFTClaims")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .order("desc")
      .collect();

    return claims;
  },
});

// Get recent claims (for admin dashboard)
export const getRecentClaims = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    const claims = await ctx.db
      .query("commemorativeNFTClaims")
      .withIndex("by_claimed_at")
      .order("desc")
      .take(limit);

    return claims;
  },
});

// Check for any recent claim (for testing without wallet connection)
export const checkRecentClaim = query({
  args: {
    minutesAgo: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const minutesAgo = args.minutesAgo || 5;
    const cutoffTime = Date.now() - (minutesAgo * 60 * 1000);

    const recentClaim = await ctx.db
      .query("commemorativeNFTClaims")
      .withIndex("by_claimed_at", (q) => q.gte("claimedAt", cutoffTime))
      .order("desc")
      .first();

    return {
      hasClaimed: !!recentClaim,
      claim: recentClaim || null,
    };
  },
});

// Get claim statistics (for admin)
export const getClaimStats = query({
  args: {},
  handler: async (ctx) => {
    const allClaims = await ctx.db
      .query("commemorativeNFTClaims")
      .collect();

    const uniqueWallets = new Set(allClaims.map(c => c.walletAddress)).size;
    const totalClaims = allClaims.length;

    // Group by NFT name
    const claimsByNFT: Record<string, number> = {};
    allClaims.forEach(claim => {
      claimsByNFT[claim.nftName] = (claimsByNFT[claim.nftName] || 0) + 1;
    });

    return {
      totalClaims,
      uniqueWallets,
      claimsByNFT,
      mostRecentClaim: allClaims.sort((a, b) => b.claimedAt - a.claimedAt)[0],
    };
  },
});

// Get next NFT number for preview (before purchase)
export const getNextNFTNumber = query({
  args: {},
  handler: async (ctx) => {
    const allClaims = await ctx.db
      .query("commemorativeNFTClaims")
      .collect();

    const totalMinted = allClaims.length;
    const nextNumber = totalMinted + 1;

    console.log('[💰CLAIM] Next NFT number:', nextNumber, '(total minted:', totalMinted + ')');

    return {
      nextNumber,
      totalMinted,
    };
  },
});

// ADMIN ONLY: Delete a specific claim record (for cleaning up test/invalid data)
export const deleteClaim = mutation({
  args: {
    claimId: v.id("commemorativeNFTClaims"),
  },
  handler: async (ctx, args) => {
    const claim = await ctx.db.get(args.claimId);

    if (!claim) {
      return { success: false, error: "Claim not found" };
    }

    console.log('[🔨CLAIM] ADMIN: Deleting claim record:', {
      id: args.claimId,
      wallet: claim.walletAddress,
      tx: claim.transactionHash,
      nft: claim.nftName
    });

    await ctx.db.delete(args.claimId);

    return {
      success: true,
      deletedClaim: claim
    };
  },
});

// ADMIN ONLY: Delete all test claims (mock transactions)
export const deleteTestClaims = mutation({
  args: {},
  handler: async (ctx) => {
    const testClaims = await ctx.db
      .query("commemorativeNFTClaims")
      .collect();

    // Filter for test/mock claims
    const claimsToDelete = testClaims.filter(claim =>
      claim.transactionHash.startsWith('mock_') ||
      claim.transactionHash.startsWith('debug_') ||
      claim.transactionHash.startsWith('test_') ||
      claim.walletAddress.includes('test_wallet')
    );

    console.log('[🔨CLAIM] ADMIN: Found', claimsToDelete.length, 'test claims to delete');

    for (const claim of claimsToDelete) {
      console.log('[🔨CLAIM] ADMIN: Deleting test claim:', claim.transactionHash);
      await ctx.db.delete(claim._id);
    }

    return {
      success: true,
      deletedCount: claimsToDelete.length,
      deletedClaims: claimsToDelete
    };
  },
});
