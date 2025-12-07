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
      .withIndex("by_transaction", (q: any) => q.eq("transactionHash", args.transactionHash))
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
// Now checks BOTH claims table AND inventory table for robust detection
export const checkClaimed = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    // Check 1: Look in the claims table (populated by webhook)
    const claim = await ctx.db
      .query("commemorativeNFTClaims")
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (claim) {
      console.log('[🔨CLAIM-CHECK] Found claim in claims table for:', args.walletAddress);
      return {
        hasClaimed: true,
        claim: claim,
        source: 'claims_table' as const,
      };
    }

    // Check 2: Look in inventory table for sold NFTs (also updated by webhook)
    // This provides a second source of truth in case claims table wasn't updated
    const soldNFT = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_status", (q: any) => q.eq("status", "sold"))
      .filter((q) => q.eq(q.field("soldTo"), args.walletAddress))
      .first();

    if (soldNFT) {
      console.log('[🔨CLAIM-CHECK] Found sold NFT in inventory for:', args.walletAddress, '- NFT:', soldNFT.name);
      return {
        hasClaimed: true,
        claim: {
          walletAddress: args.walletAddress,
          nftName: soldNFT.name,
          claimedAt: soldNFT.soldAt || Date.now(),
          transactionHash: soldNFT.transactionHash || 'pending',
          nftAssetId: soldNFT.nftUid,
        },
        source: 'inventory_table' as const,
      };
    }

    // Check 3: Look for completed reservations (backup check)
    const completedReservation = await ctx.db
      .query("commemorativeNFTReservations")
      .withIndex("by_reserved_by", (q: any) => q.eq("reservedBy", args.walletAddress))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .first();

    if (completedReservation) {
      console.log('[🔨CLAIM-CHECK] Found completed reservation for:', args.walletAddress);
      const nft = await ctx.db.get(completedReservation.nftInventoryId);
      return {
        hasClaimed: true,
        claim: {
          walletAddress: args.walletAddress,
          nftName: nft?.name || `NFT #${completedReservation.nftNumber}`,
          claimedAt: completedReservation.completedAt || Date.now(),
          transactionHash: completedReservation.transactionHash || 'pending',
          nftAssetId: completedReservation.nftUid,
        },
        source: 'reservation_table' as const,
      };
    }

    console.log('[🔨CLAIM-CHECK] No claim found for:', args.walletAddress);
    return {
      hasClaimed: false,
      claim: null,
      source: null,
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
      .withIndex("by_transaction", (q: any) => q.eq("transactionHash", args.transactionHash))
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
      .withIndex("by_wallet", (q: any) => q.eq("walletAddress", args.walletAddress))
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
      .withIndex("by_claimed_at", (q: any) => q.gte("claimedAt", cutoffTime))
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

    const uniqueWallets = new Set(allClaims.map((c: any) => c.walletAddress)).size;
    const totalClaims = allClaims.length;

    // Group by NFT name
    const claimsByNFT: Record<string, number> = {};
    allClaims.forEach((claim: any) => {
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
    const claimsToDelete = testClaims.filter((claim: any) =>
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
