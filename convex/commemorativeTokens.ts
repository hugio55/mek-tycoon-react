/**
 * Commemorative Token System - Backend Logic
 *
 * Handles sequential edition minting with atomic reservation
 * Prevents race conditions and duplicate mints
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ===== ELIGIBILITY CHECKING =====

/**
 * Check if a wallet is eligible to mint a commemorative token
 *
 * Eligibility requirements:
 * - User exists in database (beta participation)
 * - Has not already minted this token type
 * - Has gold mining activity OR Mek ownership
 */
export const checkBetaTesterEligibility = query({
  args: {
    walletAddress: v.string(),
    tokenType: v.string(), // "phase_1_beta"
  },
  handler: async (ctx, args) => {
    // 1. Find user by wallet
    const user = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (!user) {
      return {
        eligible: false,
        reason: "Not a registered beta tester",
      };
    }

    // 2. Check if already minted this token type
    const existingMint = await ctx.db
      .query("commemorativeTokens")
      .withIndex("by_wallet_type", (q) =>
        q.eq("walletAddress", args.walletAddress).eq("tokenType", args.tokenType)
      )
      .first();

    if (existingMint) {
      return {
        eligible: false,
        reason: "Already minted this commemorative token",
        editionNumber: existingMint.editionNumber,
        status: existingMint.status,
      };
    }

    // 3. Check beta participation (any activity qualifies)
    const goldMining = await ctx.db
      .query("goldMining")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (goldMining) {
      return {
        eligible: true,
        reason: "Beta tester - has gold mining activity",
        userId: user._id,
      };
    }

    // Could add more checks here:
    // - Story climb progress
    // - Achievement unlocks
    // - Mek ownership
    // - Any gameplay activity

    return {
      eligible: false,
      reason: "No beta participation found",
    };
  },
});

/**
 * Get counter info for a token type (shows next edition number, total minted, etc.)
 */
export const getTokenTypeInfo = query({
  args: { tokenType: v.string() },
  handler: async (ctx, args) => {
    const counter = await ctx.db
      .query("commemorativeTokenCounters")
      .withIndex("by_type", (q) => q.eq("tokenType", args.tokenType))
      .first();

    if (!counter) {
      return {
        exists: false,
        tokenType: args.tokenType,
      };
    }

    return {
      exists: true,
      ...counter,
      nextEdition: counter.currentEdition + 1,
    };
  },
});

// ===== EDITION RESERVATION (ATOMIC) =====

/**
 * Reserve the next edition number for a user
 *
 * This is ATOMIC - prevents race conditions where two users
 * try to mint at the same time and get duplicate edition numbers
 */
export const reserveEdition = mutation({
  args: {
    tokenType: v.string(), // "phase_1_beta"
    walletAddress: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // 1. Double-check user hasn't already minted (safety check)
    const existing = await ctx.db
      .query("commemorativeTokens")
      .withIndex("by_wallet_type", (q) =>
        q.eq("walletAddress", args.walletAddress).eq("tokenType", args.tokenType)
      )
      .first();

    if (existing) {
      throw new Error("Already minted this commemorative token");
    }

    // 2. Get or create counter for this token type
    const counter = await ctx.db
      .query("commemorativeTokenCounters")
      .withIndex("by_type", (q) => q.eq("tokenType", args.tokenType))
      .first();

    let nextEdition = 1;
    let imageUrl = "";
    let displayName = "";
    let price = 10;

    if (counter) {
      // Counter exists - check if still active
      if (!counter.isActive) {
        throw new Error("This commemorative token is no longer available");
      }

      // Check if max editions reached
      if (counter.maxEditions && counter.currentEdition >= counter.maxEditions) {
        throw new Error("All editions have been minted");
      }

      nextEdition = counter.currentEdition + 1;
      imageUrl = counter.imageUrl;
      displayName = counter.displayName;
      price = counter.price;

      // Atomic increment
      await ctx.db.patch(counter._id, {
        currentEdition: nextEdition,
      });
    } else {
      throw new Error("Token type not found. Please contact admin to set up this commemorative token.");
    }

    // 3. Generate placeholder asset ID (will be updated after minting)
    const assetName = `placeholder_${args.tokenType}_${nextEdition}`;
    const policyId = "placeholder"; // Will be updated with real policy ID
    const assetId = `${policyId}.${assetName}`;

    // 4. Reserve this edition for the user
    const reservationId = await ctx.db.insert("commemorativeTokens", {
      tokenType: args.tokenType,
      editionNumber: nextEdition,
      policyId: policyId,
      assetName: assetName,
      assetId: assetId,
      walletAddress: args.walletAddress,
      userId: args.userId,
      status: "reserved",
      network: process.env.NEXT_PUBLIC_CARDANO_NETWORK || "preprod",
      nftName: `${displayName} #${nextEdition}`,
      imageUrl: imageUrl,
      reservedAt: Date.now(),
      paymentAmount: price,
      treasuryAddress: process.env.NEXT_PUBLIC_CARDANO_NETWORK === "mainnet"
        ? (process.env.NEXT_PUBLIC_TREASURY_ADDRESS_MAINNET || "")
        : (process.env.NEXT_PUBLIC_TREASURY_ADDRESS_TESTNET || ""),
    });

    console.log(`[Commemorative] Reserved edition #${nextEdition} for ${args.walletAddress}`);

    return {
      reservationId,
      editionNumber: nextEdition,
      displayName,
      imageUrl,
      price,
    };
  },
});

// ===== MINT CONFIRMATION =====

/**
 * Update reservation with transaction details after minting
 */
export const confirmMint = mutation({
  args: {
    reservationId: v.id("commemorativeTokens"),
    txHash: v.string(),
    policyId: v.string(),
    assetName: v.string(),
    explorerUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const reservation = await ctx.db.get(args.reservationId);

    if (!reservation) {
      throw new Error("Reservation not found");
    }

    if (reservation.status !== "reserved" && reservation.status !== "minting") {
      throw new Error(`Cannot confirm mint - current status: ${reservation.status}`);
    }

    // Update with blockchain data
    await ctx.db.patch(args.reservationId, {
      status: "confirmed",
      txHash: args.txHash,
      policyId: args.policyId,
      assetName: args.assetName,
      assetId: `${args.policyId}.${args.assetName}`,
      explorerUrl: args.explorerUrl,
      mintedAt: Date.now(),
      confirmedAt: Date.now(),
    });

    // Increment totalMinted counter
    const counter = await ctx.db
      .query("commemorativeTokenCounters")
      .withIndex("by_type", (q) => q.eq("tokenType", reservation.tokenType))
      .first();

    if (counter) {
      await ctx.db.patch(counter._id, {
        totalMinted: (counter.totalMinted || 0) + 1,
      });
    }

    console.log(`[Commemorative] Confirmed mint #${reservation.editionNumber} - tx: ${args.txHash}`);

    return {
      success: true,
      editionNumber: reservation.editionNumber,
    };
  },
});

/**
 * Mark mint as failed
 */
export const markMintFailed = mutation({
  args: {
    reservationId: v.id("commemorativeTokens"),
    errorMessage: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.reservationId, {
      status: "failed",
      errorMessage: args.errorMessage,
    });

    console.log(`[Commemorative] Mint failed - reservation ${args.reservationId}: ${args.errorMessage}`);
  },
});

/**
 * Cancel a reservation (allows edition to be re-used)
 */
export const cancelReservation = mutation({
  args: {
    reservationId: v.id("commemorativeTokens"),
  },
  handler: async (ctx, args) => {
    const reservation = await ctx.db.get(args.reservationId);

    if (!reservation) {
      throw new Error("Reservation not found");
    }

    if (reservation.status === "confirmed") {
      throw new Error("Cannot cancel a confirmed mint");
    }

    await ctx.db.patch(args.reservationId, {
      status: "cancelled",
    });

    // Decrement counter so edition can be re-used
    const counter = await ctx.db
      .query("commemorativeTokenCounters")
      .withIndex("by_type", (q) => q.eq("tokenType", reservation.tokenType))
      .first();

    if (counter && counter.currentEdition === reservation.editionNumber) {
      await ctx.db.patch(counter._id, {
        currentEdition: counter.currentEdition - 1,
      });
    }

    console.log(`[Commemorative] Cancelled reservation #${reservation.editionNumber}`);
  },
});

// ===== QUERY FUNCTIONS =====

/**
 * Get user's commemorative tokens
 */
export const getMyCommemorativeTokens = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const tokens = await ctx.db
      .query("commemorativeTokens")
      .withIndex("by_wallet_type", (q) => q.eq("walletAddress", args.walletAddress))
      .collect();

    return tokens.filter(t => t.status === "confirmed");
  },
});

/**
 * Get all commemorative tokens (admin view)
 */
export const getAllCommemorativeTokens = query({
  args: {
    tokenType: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("reserved"),
      v.literal("minting"),
      v.literal("confirmed"),
      v.literal("failed"),
      v.literal("cancelled")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("commemorativeTokens");

    // Filter by status if provided
    if (args.status) {
      query = query.withIndex("by_status", (q) => q.eq("status", args.status));
    }

    let tokens = await query.collect();

    // Filter by token type if provided
    if (args.tokenType) {
      tokens = tokens.filter(t => t.tokenType === args.tokenType);
    }

    // Sort by edition number (descending - newest first)
    tokens.sort((a, b) => b.editionNumber - a.editionNumber);

    // Limit results if specified
    if (args.limit) {
      tokens = tokens.slice(0, args.limit);
    }

    return tokens;
  },
});

/**
 * Get statistics for a token type
 */
export const getTokenTypeStats = query({
  args: { tokenType: v.string() },
  handler: async (ctx, args) => {
    const counter = await ctx.db
      .query("commemorativeTokenCounters")
      .withIndex("by_type", (q) => q.eq("tokenType", args.tokenType))
      .first();

    if (!counter) {
      return null;
    }

    const allTokens = await ctx.db
      .query("commemorativeTokens")
      .withIndex("by_edition", (q) => q.eq("tokenType", args.tokenType))
      .collect();

    const confirmed = allTokens.filter(t => t.status === "confirmed").length;
    const reserved = allTokens.filter(t => t.status === "reserved").length;
    const minting = allTokens.filter(t => t.status === "minting").length;
    const failed = allTokens.filter(t => t.status === "failed").length;
    const cancelled = allTokens.filter(t => t.status === "cancelled").length;

    // Get latest confirmed mint
    const latestMint = allTokens
      .filter(t => t.status === "confirmed")
      .sort((a, b) => (b.confirmedAt || 0) - (a.confirmedAt || 0))[0];

    return {
      tokenType: counter.tokenType,
      displayName: counter.displayName,
      price: counter.price,
      isActive: counter.isActive,
      currentEdition: counter.currentEdition,
      totalMinted: confirmed,
      maxEditions: counter.maxEditions,
      imageUrl: counter.imageUrl,
      stats: {
        confirmed,
        reserved,
        minting,
        failed,
        cancelled,
        total: allTokens.length,
      },
      latestMint: latestMint ? {
        editionNumber: latestMint.editionNumber,
        walletAddress: latestMint.walletAddress,
        confirmedAt: latestMint.confirmedAt,
        txHash: latestMint.txHash,
      } : null,
    };
  },
});

// ===== ADMIN FUNCTIONS =====

/**
 * Initialize a new token design (admin only)
 * Creates a new NFT design that can be minted multiple times
 */
export const initializeTokenType = mutation({
  args: {
    tokenType: v.string(),
    displayName: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.string(),
    metadataUrl: v.string(), // NEW: IPFS URL for metadata JSON
    policyId: v.string(), // NEW: Which minting policy to use
    assetNameHex: v.string(), // NEW: Hex-encoded asset name for sub-assets
    price: v.optional(v.number()),
    maxEditions: v.optional(v.number()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Check if already exists
    const existing = await ctx.db
      .query("commemorativeTokenCounters")
      .withIndex("by_type", (q) => q.eq("tokenType", args.tokenType))
      .first();

    if (existing) {
      throw new Error("Token type already exists");
    }

    const counterId = await ctx.db.insert("commemorativeTokenCounters", {
      tokenType: args.tokenType,
      displayName: args.displayName,
      description: args.description,
      imageUrl: args.imageUrl,
      metadataUrl: args.metadataUrl,
      policyId: args.policyId,
      assetNameHex: args.assetNameHex,
      currentEdition: 0,
      totalMinted: 0,
      maxEditions: args.maxEditions,
      price: args.price,
      isActive: args.isActive,
      createdAt: Date.now(),
    });

    console.log(`[Commemorative] Initialized token design: ${args.tokenType} (Policy: ${args.policyId}, Asset: ${args.assetNameHex})`);

    return { counterId };
  },
});

/**
 * Update token type settings (admin only)
 */
export const updateTokenType = mutation({
  args: {
    tokenType: v.string(),
    isActive: v.optional(v.boolean()),
    price: v.optional(v.number()),
    maxEditions: v.optional(v.number()),
    displayName: v.optional(v.string()),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    metadataUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const counter = await ctx.db
      .query("commemorativeTokenCounters")
      .withIndex("by_type", (q) => q.eq("tokenType", args.tokenType))
      .first();

    if (!counter) {
      throw new Error("Token type not found");
    }

    const updates: any = {};
    if (args.isActive !== undefined) updates.isActive = args.isActive;
    if (args.price !== undefined) updates.price = args.price;
    if (args.maxEditions !== undefined) updates.maxEditions = args.maxEditions;
    if (args.displayName !== undefined) updates.displayName = args.displayName;
    if (args.description !== undefined) updates.description = args.description;
    if (args.imageUrl !== undefined) updates.imageUrl = args.imageUrl;
    if (args.metadataUrl !== undefined) updates.metadataUrl = args.metadataUrl;

    await ctx.db.patch(counter._id, updates);

    console.log(`[Commemorative] Updated token type: ${args.tokenType}`);

    return { success: true };
  },
});

/**
 * Delete a token design (admin only)
 * Can only delete if no NFTs have been minted yet
 */
export const deleteTokenType = mutation({
  args: { tokenType: v.string() },
  handler: async (ctx, args) => {
    const counter = await ctx.db
      .query("commemorativeTokenCounters")
      .withIndex("by_type", (q) => q.eq("tokenType", args.tokenType))
      .first();

    if (!counter) {
      throw new Error("Token type not found");
    }

    // Check if any have been minted
    if (counter.totalMinted > 0) {
      throw new Error("Cannot delete - NFTs have already been minted for this design");
    }

    // Delete any reservations
    const reservations = await ctx.db
      .query("commemorativeTokens")
      .withIndex("by_edition", (q) => q.eq("tokenType", args.tokenType))
      .collect();

    for (const reservation of reservations) {
      await ctx.db.delete(reservation._id);
    }

    // Delete the counter
    await ctx.db.delete(counter._id);

    console.log(`[Commemorative] Deleted token design: ${args.tokenType}`);

    return { success: true };
  },
});

/**
 * Get all designs for a specific policy (admin view)
 */
export const getDesignsByPolicy = query({
  args: { policyId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("commemorativeTokenCounters")
      .withIndex("by_policy_id", (q) => q.eq("policyId", args.policyId))
      .collect();
  },
});

/**
 * Get all designs (admin view)
 */
export const getAllDesigns = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("commemorativeTokenCounters")
      .collect();
  },
});
