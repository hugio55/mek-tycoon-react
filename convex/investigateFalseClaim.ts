import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * INVESTIGATION: False Claim Record in commemorativeNFTClaims
 *
 * Issue: User reports 1 claim exists in database, but NMKR shows all 3 Lab Rats
 * are still "Free" (unminted). User never completed actual payment.
 *
 * This query provides complete data dump of all commemorative NFT tables.
 */

export const investigateAllData = query({
  args: {},
  handler: async (ctx) => {
    // Get all claims
    const allClaims = await ctx.db
      .query("commemorativeNFTClaims")
      .collect();

    // Get all inventory
    const allInventory = await ctx.db
      .query("commemorativeNFTInventory")
      .collect();

    // PHASE 2: Get active reservations from inventory table (new system)
    // Reservations are now stored directly in inventory rows with status="reserved"
    const allReservations = allInventory.filter(inv =>
      inv.status === "reserved" && inv.reservedBy && inv.reservedAt && inv.expiresAt
    );

    // Get campaigns for context
    const allCampaigns = await ctx.db
      .query("commemorativeCampaigns")
      .collect();

    return {
      summary: {
        totalClaims: allClaims.length,
        totalInventory: allInventory.length,
        totalReservations: allReservations.length,
        totalCampaigns: allCampaigns.length,
      },
      claims: allClaims.map(claim => ({
        _id: claim._id,
        campaignId: claim.campaignId,
        walletAddress: claim.walletAddress,
        transactionHash: claim.transactionHash,
        nftName: claim.nftName,
        nftAssetId: claim.nftAssetId,
        claimedAt: claim.claimedAt,
        claimedAtDate: new Date(claim.claimedAt).toISOString(),
        metadata: claim.metadata,
      })),
      inventory: allInventory.map(inv => ({
        _id: inv._id,
        campaignId: inv.campaignId,
        nftUid: inv.nftUid,
        nftNumber: inv.nftNumber,
        name: inv.name,
        status: inv.status,
        projectId: inv.projectId,
        paymentUrl: inv.paymentUrl,
        imageUrl: inv.imageUrl,
        createdAt: inv.createdAt,
        createdAtDate: new Date(inv.createdAt).toISOString(),
      })),
      reservations: allReservations.map(inv => {
        // Helper function to format date in EST with 12-hour time
        const formatDateEST = (timestamp: number) => {
          return new Date(timestamp).toLocaleString('en-US', {
            timeZone: 'America/New_York',
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          });
        };

        // Helper function to abbreviate stake address
        const abbreviateAddress = (address: string) => {
          if (!address || address.length < 20) return address;
          return `${address.slice(0, 10)}...${address.slice(-8)}`;
        };

        // PHASE 2: Inventory row IS the reservation now
        // Check if expired for accurate status display
        const now = Date.now();
        const isExpired = inv.expiresAt! < now;

        return {
          _id: inv._id,
          campaignId: inv.campaignId,
          nftInventoryId: inv._id, // Same as _id in new system
          nftUid: inv.nftUid,
          nftNumber: inv.nftNumber,
          reservedBy: abbreviateAddress(inv.reservedBy!),
          reservedByFull: inv.reservedBy, // Keep full address for reference
          reservedAt: inv.reservedAt!,
          reservedAtDate: formatDateEST(inv.reservedAt!),
          expiresAt: inv.expiresAt!,
          expiresAtDate: formatDateEST(inv.expiresAt!),
          status: isExpired ? "expired" : "active", // Calculate real-time status
          paymentWindowOpenedAt: inv.paymentWindowOpenedAt,
          paymentWindowClosedAt: inv.paymentWindowClosedAt,
        };
      }),
      campaigns: allCampaigns.map(camp => ({
        _id: camp._id,
        name: camp.name,
        description: camp.description,
        isActive: camp.isActive,
        createdAt: camp.createdAt,
        createdAtDate: new Date(camp.createdAt).toISOString(),
      })),
    };
  },
});

/**
 * CLEANUP MUTATION #1: Delete specific false claim
 */
export const deleteFalseClaim = mutation({
  args: {
    claimId: v.id("commemorativeNFTClaims"),
  },
  handler: async (ctx, args) => {
    const claim = await ctx.db.get(args.claimId);
    if (!claim) {
      throw new Error(`Claim ${args.claimId} not found`);
    }

    await ctx.db.delete(args.claimId);

    return {
      success: true,
      deletedClaim: {
        _id: claim._id,
        walletAddress: claim.walletAddress,
        nftName: claim.nftName,
        transactionHash: claim.transactionHash,
      },
    };
  },
});

/**
 * CLEANUP MUTATION #2: Reset inventory NFT to "available"
 */
export const resetInventoryToAvailable = mutation({
  args: {
    nftUid: v.string(),
  },
  handler: async (ctx, args) => {
    const inventory = await ctx.db
      .query("commemorativeNFTInventory")
      .withIndex("by_uid", (q) => q.eq("nftUid", args.nftUid))
      .first();

    if (!inventory) {
      throw new Error(`Inventory item with nftUid ${args.nftUid} not found`);
    }

    const oldStatus = inventory.status;
    await ctx.db.patch(inventory._id, {
      status: "available",
    });

    return {
      success: true,
      nftUid: args.nftUid,
      nftName: inventory.name,
      oldStatus,
      newStatus: "available",
    };
  },
});

/**
 * CLEANUP MUTATION #3: Cancel/delete reservation
 * PHASE 2: Updated to work with inventory IDs (new system)
 */
export const cancelReservation = mutation({
  args: {
    reservationId: v.id("commemorativeNFTInventory"),
  },
  handler: async (ctx, args) => {
    // PHASE 2: Reservation ID is now the inventory ID
    const inventory = await ctx.db.get(args.reservationId);
    if (!inventory) {
      throw new Error(`Inventory item ${args.reservationId} not found`);
    }

    if (inventory.status !== "reserved") {
      throw new Error(`Inventory item is not reserved (status: ${inventory.status})`);
    }

    // PHASE 2: Clear reservation fields and set back to available
    // Don't delete the inventory item - just clear the reservation
    await ctx.db.patch(args.reservationId, {
      status: "available",
      reservedBy: undefined,
      reservedAt: undefined,
      expiresAt: undefined,
      paymentWindowOpenedAt: undefined,
      paymentWindowClosedAt: undefined,
    });

    return {
      success: true,
      deletedReservation: {
        _id: inventory._id,
        nftUid: inventory.nftUid,
        nftNumber: inventory.nftNumber,
        status: "available", // Now available again
        reservedBy: inventory.reservedBy, // Old value
      },
    };
  },
});

/**
 * COMPREHENSIVE CLEANUP: Reset everything to match NMKR reality
 * (All 3 Lab Rats available, zero claims)
 */
export const comprehensiveCleanup = mutation({
  args: {
    // Safety parameter - must pass "CONFIRM_DELETE_ALL_CLAIMS"
    confirmationCode: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.confirmationCode !== "CONFIRM_DELETE_ALL_CLAIMS") {
      throw new Error("Invalid confirmation code. Pass 'CONFIRM_DELETE_ALL_CLAIMS' to proceed.");
    }

    // Step 1: Delete ALL claims
    const allClaims = await ctx.db
      .query("commemorativeNFTClaims")
      .collect();

    const deletedClaims = [];
    for (const claim of allClaims) {
      deletedClaims.push({
        _id: claim._id,
        walletAddress: claim.walletAddress,
        nftName: claim.nftName,
      });
      await ctx.db.delete(claim._id);
    }

    // Step 2: Delete ALL reservations
    const allReservations = await ctx.db
      .query("commemorativeNFTReservations")
      .collect();

    const deletedReservations = [];
    for (const reservation of allReservations) {
      deletedReservations.push({
        _id: reservation._id,
        nftUid: reservation.nftUid,
        status: reservation.status,
      });
      await ctx.db.delete(reservation._id);
    }

    // Step 3: Reset ALL inventory to "available"
    const allInventory = await ctx.db
      .query("commemorativeNFTInventory")
      .collect();

    const resetInventory = [];
    for (const inv of allInventory) {
      if (inv.status !== "available") {
        resetInventory.push({
          _id: inv._id,
          nftUid: inv.nftUid,
          name: inv.name,
          oldStatus: inv.status,
          newStatus: "available",
        });
        await ctx.db.patch(inv._id, {
          status: "available",
        });
      }
    }

    return {
      success: true,
      deletedClaimsCount: deletedClaims.length,
      deletedReservationsCount: deletedReservations.length,
      resetInventoryCount: resetInventory.length,
      deletedClaims,
      deletedReservations,
      resetInventory,
      message: "Database reset to match NMKR reality: All NFTs available, zero claims, zero reservations.",
    };
  },
});
