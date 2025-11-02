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
 * - Has not already claimed/minted this token type
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

    // 2. CRITICAL: Check if already claimed (prevents double-claiming even after NFT transfer)
    // First check the permanent claims table
    const existingClaim = await ctx.db
      .query("commemorativeNFTClaims")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .first();

    if (existingClaim) {
      return {
        eligible: false,
        reason: "Already claimed this commemorative NFT",
        hasClaimed: true,
        claimedAt: existingClaim.claimedAt,
      };
    }

    // 3. Also check commemorativeTokens table (reservation/mint tracking)
    const existingMint = await ctx.db
      .query("commemorativeTokens")
      .withIndex("by_wallet_type", (q) =>
        q.eq("walletAddress", args.walletAddress).eq("tokenType", args.tokenType)
      )
      .first();

    if (existingMint && (existingMint.status === "confirmed" || existingMint.status === "reserved")) {
      return {
        eligible: false,
        reason: "Already minted this commemorative token",
        editionNumber: existingMint.editionNumber,
        status: existingMint.status,
      };
    }

    // 4. Check beta participation (any activity qualifies)
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
      price = counter.price ?? 10; // Default to 10 ADA if not set

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

    const assetId = `${args.policyId}.${args.assetName}`;
    const now = Date.now();

    // Update with blockchain data
    await ctx.db.patch(args.reservationId, {
      status: "confirmed",
      txHash: args.txHash,
      policyId: args.policyId,
      assetName: args.assetName,
      assetId: assetId,
      explorerUrl: args.explorerUrl,
      mintedAt: now,
      confirmedAt: now,
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

    // CRITICAL: Record permanent claim in commemorativeNFTClaims table
    // This prevents double-claiming even if user transfers NFT out
    const existingClaim = await ctx.db
      .query("commemorativeNFTClaims")
      .withIndex("by_transaction", (q) => q.eq("transactionHash", args.txHash))
      .first();

    if (!existingClaim) {
      await ctx.db.insert("commemorativeNFTClaims", {
        walletAddress: reservation.walletAddress,
        transactionHash: args.txHash,
        nftName: reservation.nftName,
        nftAssetId: assetId,
        claimedAt: now,
        metadata: {
          imageUrl: reservation.imageUrl,
          collection: counter?.displayName,
        },
      });
      console.log(`[Commemorative] Recorded permanent claim for ${reservation.walletAddress}`);
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
    // Filter by status if provided, otherwise get all
    let tokens: any[];
    if (args.status) {
      tokens = await ctx.db
        .query("commemorativeTokens")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      tokens = await ctx.db.query("commemorativeTokens").collect();
    }

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
 * Initialize a new NFT design (admin only) - Universal Minting Engine
 * Supports: Whitelist Mode, Public Sale, Free Claim
 */
export const initializeTokenType = mutation({
  args: {
    tokenType: v.string(),
    displayName: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.string(),
    mediaType: v.optional(v.string()), // MIME type: "image/png", "image/gif", etc.
    metadataUrl: v.string(),
    policyId: v.string(),
    assetNameHex: v.string(),
    isActive: v.boolean(),

    // Custom metadata attributes (for token-specific values like "Poop?: yes")
    customAttributes: v.optional(v.array(v.object({
      trait_type: v.string(),
      value: v.string()
    }))),

    // Distribution Settings (optional - configured in Step 3)
    saleMode: v.optional(v.union(v.literal("whitelist"), v.literal("public_sale"), v.literal("free_claim"))),
    price: v.optional(v.number()),
    maxEditions: v.optional(v.number()),
    minimumGold: v.optional(v.number()),
    onePerWallet: v.optional(v.boolean()),
    maxPerWallet: v.optional(v.number()),
    publicSaleStart: v.optional(v.number()),
    publicSaleEnd: v.optional(v.number()),
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
      mediaType: args.mediaType, // Store media type for proper NFT display
      metadataUrl: args.metadataUrl,
      policyId: args.policyId,
      assetNameHex: args.assetNameHex,

      // Custom metadata attributes
      customAttributes: args.customAttributes,

      // Sale Mode (will be configured later if not provided)
      saleMode: args.saleMode,

      // Whitelist Settings
      minimumGold: args.minimumGold,
      onePerWallet: args.onePerWallet,
      eligibilitySnapshot: undefined, // Will be set when snapshot is taken
      snapshotTakenAt: undefined,

      // Public Sale Settings
      maxPerWallet: args.maxPerWallet,
      publicSaleStart: args.publicSaleStart,
      publicSaleEnd: args.publicSaleEnd,

      // Minting Stats
      currentEdition: 0,
      totalMinted: 0,
      maxEditions: args.maxEditions,

      // Status
      price: args.price,
      isActive: args.isActive,

      // Timestamps
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    console.log(`[NFT Design] Created design: ${args.tokenType} (Policy: ${args.policyId})${args.saleMode ? ` - ${args.saleMode} mode` : ' - distribution settings pending'}`);

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
    saleMode: v.optional(v.union(v.literal("whitelist"), v.literal("public_sale"), v.literal("free_claim"))),
    minimumGold: v.optional(v.number()),
    onePerWallet: v.optional(v.boolean()),
    maxPerWallet: v.optional(v.number()),
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
    if (args.saleMode !== undefined) updates.saleMode = args.saleMode;
    if (args.minimumGold !== undefined) updates.minimumGold = args.minimumGold;
    if (args.onePerWallet !== undefined) updates.onePerWallet = args.onePerWallet;
    if (args.maxPerWallet !== undefined) updates.maxPerWallet = args.maxPerWallet;

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
 * Take eligibility snapshot for whitelist mode (admin only)
 * Captures wallet addresses of eligible users at this moment in time
 */
export const takeEligibilitySnapshot = mutation({
  args: {
    tokenType: v.string(),
  },
  handler: async (ctx, args) => {
    const design = await ctx.db
      .query("commemorativeTokenCounters")
      .withIndex("by_type", (q) => q.eq("tokenType", args.tokenType))
      .first();

    if (!design) {
      throw new Error("Design not found");
    }

    if (design.saleMode !== "whitelist") {
      throw new Error("Can only take snapshots for whitelist mode designs");
    }

    // Query eligible users based on minimumGold requirement
    const miners = await ctx.db.query("goldMining").collect();
    const now = Date.now();

    const eligibleWallets: string[] = [];

    for (const miner of miners) {
      // Calculate current gold
      let currentGold = miner.accumulatedGold || 0;

      if (miner.isBlockchainVerified === true) {
        const lastUpdateTime = miner.lastSnapshotTime || miner.updatedAt || miner.createdAt;
        const hoursSinceLastUpdate = (now - lastUpdateTime) / (1000 * 60 * 60);
        const goldSinceLastUpdate = miner.totalGoldPerHour * hoursSinceLastUpdate;
        currentGold = (miner.accumulatedGold || 0) + goldSinceLastUpdate;
      }

      const minimumGold = design.minimumGold ?? 0;

      // Check eligibility
      if (
        currentGold > minimumGold &&
        miner.walletAddress &&
        miner.isBlockchainVerified === true
      ) {
        eligibleWallets.push(miner.walletAddress);
      }
    }

    // Update design with snapshot
    await ctx.db.patch(design._id, {
      eligibilitySnapshot: eligibleWallets,
      snapshotTakenAt: Date.now(),
      updatedAt: Date.now(),
    });

    console.log(`[Whitelist] Snapshot taken for ${args.tokenType}: ${eligibleWallets.length} eligible wallets`);

    return {
      success: true,
      eligibleCount: eligibleWallets.length,
      snapshotTakenAt: Date.now(),
    };
  },
});

/**
 * Import a whitelist snapshot into an NFT's eligibility snapshot
 */
export const importSnapshotToNFT = mutation({
  args: {
    tokenType: v.string(),
    snapshotId: v.id("whitelistSnapshots"),
  },
  handler: async (ctx, args) => {
    const design = await ctx.db
      .query("commemorativeTokenCounters")
      .withIndex("by_type", (q) => q.eq("tokenType", args.tokenType))
      .first();

    if (!design) {
      throw new Error("NFT not found");
    }

    if (design.saleMode !== "whitelist") {
      throw new Error("Can only import snapshots for whitelist mode NFTs");
    }

    const snapshot = await ctx.db.get(args.snapshotId);
    if (!snapshot) {
      throw new Error("Snapshot not found");
    }

    // Extract wallet addresses from snapshot's eligible users
    const eligibleWallets = snapshot.eligibleUsers.map(user => user.walletAddress);

    // Update NFT with snapshot data
    await ctx.db.patch(design._id, {
      eligibilitySnapshot: eligibleWallets,
      snapshotTakenAt: snapshot.takenAt,
      updatedAt: Date.now(),
    });

    console.log(`[Snapshot Import] Imported snapshot "${snapshot.snapshotName}" from whitelist "${snapshot.whitelistName}" to ${args.tokenType}: ${eligibleWallets.length} eligible wallets`);

    return {
      success: true,
      eligibleCount: eligibleWallets.length,
      snapshotName: snapshot.snapshotName,
      whitelistName: snapshot.whitelistName,
      snapshotTakenAt: snapshot.takenAt,
    };
  },
});

/**
 * Import a whitelist from the Whitelist Manager into a design's eligibility snapshot
 * @deprecated Use importSnapshotToNFT instead
 */
export const importWhitelistToDesign = mutation({
  args: {
    tokenType: v.string(),
    whitelistId: v.id("whitelists"),
  },
  handler: async (ctx, args) => {
    const design = await ctx.db
      .query("commemorativeTokenCounters")
      .withIndex("by_type", (q) => q.eq("tokenType", args.tokenType))
      .first();

    if (!design) {
      throw new Error("Design not found");
    }

    if (design.saleMode !== "whitelist") {
      throw new Error("Can only import whitelists for whitelist mode designs");
    }

    const whitelist = await ctx.db.get(args.whitelistId);
    if (!whitelist) {
      throw new Error("Whitelist not found");
    }

    // Extract wallet addresses from eligible users
    const eligibleWallets = whitelist.eligibleUsers.map(user => user.walletAddress);

    // Update design with whitelist data
    await ctx.db.patch(design._id, {
      eligibilitySnapshot: eligibleWallets,
      snapshotTakenAt: Date.now(),
      updatedAt: Date.now(),
    });

    console.log(`[Whitelist] Imported whitelist "${whitelist.name}" to ${args.tokenType}: ${eligibleWallets.length} eligible wallets`);

    return {
      success: true,
      eligibleCount: eligibleWallets.length,
      whitelistName: whitelist.name,
      snapshotTakenAt: Date.now(),
    };
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

// ===== BATCH MINTING FUNCTIONS =====

/**
 * Record a batch minted token in the database
 *
 * Called after successful minting transaction to track the NFT
 */
export const recordBatchMintedToken = mutation({
  args: {
    tokenType: v.string(),
    mintNumber: v.number(),
    policyId: v.string(),
    assetName: v.string(),
    assetId: v.string(),
    recipientAddress: v.string(),
    recipientDisplayName: v.optional(v.string()),
    snapshotId: v.optional(v.id("whitelistSnapshots")),
    batchNumber: v.number(),
    batchId: v.optional(v.string()),
    txHash: v.string(),
    network: v.string(),
    nftName: v.string(),
    imageIpfsUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const tokenId = await ctx.db.insert("batchMintedTokens", {
      tokenType: args.tokenType,
      mintNumber: args.mintNumber,
      policyId: args.policyId,
      assetName: args.assetName,
      assetId: args.assetId,
      recipientAddress: args.recipientAddress,
      recipientDisplayName: args.recipientDisplayName,
      snapshotId: args.snapshotId,
      batchNumber: args.batchNumber,
      batchId: args.batchId,
      status: "confirmed",
      txHash: args.txHash,
      network: args.network,
      nftName: args.nftName,
      imageIpfsUrl: args.imageIpfsUrl,
      createdAt: Date.now(),
      submittedAt: Date.now(),
      confirmedAt: Date.now(),
    });

    console.log(`[Batch Mint] Recorded minted token: ${args.nftName} → ${args.recipientAddress.substring(0, 20)}...`);

    // Update totalMinted counter for this design
    const counter = await ctx.db
      .query("commemorativeTokenCounters")
      .withIndex("by_type", (q) => q.eq("tokenType", args.tokenType))
      .first();

    if (counter) {
      await ctx.db.patch(counter._id, {
        totalMinted: (counter.totalMinted || 0) + 1,
      });
      console.log(`[Batch Mint] Updated totalMinted counter for ${args.tokenType}: ${(counter.totalMinted || 0) + 1}`);
    } else {
      console.warn(`[Batch Mint] Counter not found for tokenType: ${args.tokenType}`);
    }

    return tokenId;
  },
});

/**
 * Get all batch minted tokens for a token type
 */
export const getBatchMintedTokens = query({
  args: {
    tokenType: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("batchMintedTokens")
      .withIndex("by_token_type", (q) => q.eq("tokenType", args.tokenType))
      .collect();
  },
});

/**
 * Get batch minted tokens by snapshot ID
 */
export const getBatchMintedBySnapshot = query({
  args: {
    snapshotId: v.id("whitelistSnapshots"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("batchMintedTokens")
      .withIndex("by_snapshot", (q) => q.eq("snapshotId", args.snapshotId))
      .collect();
  },
});

/**
 * Get all batch minted tokens for an address
 */
export const getBatchMintedByAddress = query({
  args: {
    address: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("batchMintedTokens")
      .withIndex("by_recipient", (q) => q.eq("recipientAddress", args.address))
      .collect();
  },
});

/**
 * Get minting statistics for a token type
 */
export const getBatchMintingStats = query({
  args: {
    tokenType: v.string(),
  },
  handler: async (ctx, args) => {
    const allMints = await ctx.db
      .query("batchMintedTokens")
      .withIndex("by_token_type", (q) => q.eq("tokenType", args.tokenType))
      .collect();

    const confirmed = allMints.filter(m => m.status === "confirmed").length;
    const failed = allMints.filter(m => m.status === "failed").length;
    const pending = allMints.filter(m => m.status === "pending" || m.status === "submitted").length;

    return {
      total: allMints.length,
      confirmed,
      failed,
      pending,
      uniqueRecipients: new Set(allMints.map(m => m.recipientAddress)).size,
    };
  },
});
