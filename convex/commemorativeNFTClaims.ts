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

// Check if a SPECIFIC reservation was paid (for payment window monitoring)
// This prevents false positives from previous claims showing success
// ENHANCED: Now has multiple detection paths for robust payment detection
export const checkReservationPaid = query({
  args: {
    reservationId: v.id("commemorativeNFTInventory"),
    walletAddress: v.optional(v.string()), // Optional: for additional detection paths
  },
  handler: async (ctx, args) => {
    // Get the specific NFT inventory item
    const nft = await ctx.db.get(args.reservationId);

    if (!nft) {
      console.log('[🔨CLAIM-CHECK] Reservation not found:', args.reservationId);
      return {
        isPaid: false,
        claim: null,
        detectionPath: 'none',
      };
    }

    // PATH 1: Check if this specific NFT was sold (PRIMARY CHECK)
    if (nft.status === 'sold') {
      console.log('[🔨CLAIM-CHECK] ✅ PATH 1 - Inventory shows SOLD:', nft.name);
      return {
        isPaid: true,
        claim: {
          walletAddress: nft.soldTo || '',
          nftName: nft.name,
          claimedAt: nft.soldAt || Date.now(),
          transactionHash: nft.transactionHash || 'pending',
          nftAssetId: nft.nftUid,
        },
        detectionPath: 'inventory_status',
      };
    }

    // PATH 2: Check claims table by NFT UID (webhook may have recorded claim but not updated inventory)
    const claimByNftUid = await ctx.db
      .query("commemorativeNFTClaims")
      .filter((q) => q.eq(q.field("nftAssetId"), nft.nftUid))
      .first();

    if (claimByNftUid) {
      console.log('[🔨CLAIM-CHECK] ✅ PATH 2 - Found claim in claims table for NFT:', nft.name);
      return {
        isPaid: true,
        claim: {
          walletAddress: claimByNftUid.walletAddress,
          nftName: claimByNftUid.nftName,
          claimedAt: claimByNftUid.claimedAt,
          transactionHash: claimByNftUid.transactionHash,
          nftAssetId: claimByNftUid.nftAssetId,
        },
        detectionPath: 'claims_table_by_nft',
      };
    }

    // PATH 3: Check processed webhooks by NFT UID (webhook was processed but DB update may have failed)
    const webhookByNftUid = await ctx.db
      .query("processedWebhooks")
      .filter((q) => q.eq(q.field("nftUid"), nft.nftUid))
      .first();

    if (webhookByNftUid) {
      console.log('[🔨CLAIM-CHECK] ✅ PATH 3 - Found processed webhook for NFT:', nft.name);
      return {
        isPaid: true,
        claim: {
          walletAddress: webhookByNftUid.stakeAddress,
          nftName: nft.name,
          claimedAt: webhookByNftUid.processedAt,
          transactionHash: webhookByNftUid.transactionHash,
          nftAssetId: nft.nftUid,
        },
        detectionPath: 'processed_webhook',
        needsInventorySync: true, // Flag that inventory needs to be synced
      };
    }

    // PATH 4: If wallet address provided, check claims table by wallet
    if (args.walletAddress) {
      const claimByWallet = await ctx.db
        .query("commemorativeNFTClaims")
        .withIndex("by_wallet", (q: any) => q.eq("walletAddress", args.walletAddress))
        .first();

      // Only count as match if claimed AFTER reservation was created
      if (claimByWallet && nft.reservedAt && claimByWallet.claimedAt > nft.reservedAt) {
        console.log('[🔨CLAIM-CHECK] ✅ PATH 4 - Found recent claim for wallet:', args.walletAddress);
        return {
          isPaid: true,
          claim: {
            walletAddress: claimByWallet.walletAddress,
            nftName: claimByWallet.nftName,
            claimedAt: claimByWallet.claimedAt,
            transactionHash: claimByWallet.transactionHash,
            nftAssetId: claimByWallet.nftAssetId,
          },
          detectionPath: 'claims_table_by_wallet',
        };
      }
    }

    console.log('[🔨CLAIM-CHECK] Reservation NOT paid yet:', nft.name, '- status:', nft.status);
    return {
      isPaid: false,
      claim: null,
      nftStatus: nft.status,
      detectionPath: 'none',
    };
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
