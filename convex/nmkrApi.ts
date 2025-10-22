import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

/**
 * NMKR API Integration
 *
 * Direct integration with NMKR Studio API for creating projects,
 * uploading NFTs, and minting tokens on Cardano mainnet.
 *
 * API Documentation: https://studio-api.nmkr.io/swagger/index.html
 */

const NMKR_API_BASE = "https://studio-api.nmkr.io";

// Convex doesn't support process.env - environment variables must be passed explicitly
// or accessed through Convex's environment system at deploy time

// ==========================================
// PROJECT MANAGEMENT
// ==========================================

/**
 * Create a new NMKR project
 * This is the first step - creates the container for your NFTs
 */
export const createProject = action({
  args: {
    projectName: v.string(),
    description: v.optional(v.string()),
    policyExpires: v.optional(v.boolean()), // If true, policy locks after minting completes
    policyLocksDateTime: v.optional(v.string()), // ISO datetime string for when policy locks
    maxNftCount: v.optional(v.number()), // Maximum NFTs that can be minted in this project
    apiKey: v.string(), // NMKR API key (passed from client)
    payoutWallet: v.string(), // Cardano payout wallet address
  },
  handler: async (ctx, args) => {
    const apiKey = args.apiKey;

    // If policyExpires is true, we need to provide an expiration date
    // Default: 1 year from now
    const policyExpires = args.policyExpires ?? false;
    const policyLocksDateTime = args.policyLocksDateTime ||
      (policyExpires ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : undefined);

    const requestBody = {
      projectname: args.projectName,
      description: args.description || args.projectName,
      policyExpires,
      policyLocksDateTime, // Required if policyExpires is true
      maxNftSupply: args.maxNftCount || 10000, // REQUIRED: Max NFTs in project (default 10k)
      addressExpiretime: 60, // REQUIRED: Payment address expiration (5-60 minutes)
      payoutWalletaddress: args.payoutWallet, // REQUIRED: Cardano wallet for payouts (note: lowercase 'address')
      enableFiatPayments: false, // We handle our own payments
      activatePayin: false,
    };

    console.log("[NMKR] Creating project:", args.projectName);
    console.log("[NMKR] Request body:", JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${NMKR_API_BASE}/v2/CreateProject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[NMKR] Project creation failed:", errorText);
      throw new Error(`NMKR API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("[NMKR] Project created successfully:", result);
    console.log("[NMKR] Full response keys:", Object.keys(result));

    return {
      projectUid: result.uid, // NMKR returns "uid" not "projectUid"
      projectName: result.projectname,
      policyId: result.policyId,
      paymentAddress: result.payinAddress,
    };
  },
});

/**
 * Get all projects for this API key from NMKR
 */
export const listProjects = action({
  args: {
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = args.apiKey;

    console.log("[NMKR] Fetching all projects for API key");

    const response = await fetch(
      `${NMKR_API_BASE}/v2/ListProjects`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[NMKR] List projects failed:", errorText);
      throw new Error(`NMKR API error: ${response.status} - ${errorText}`);
    }

    const projects = await response.json();
    console.log("[NMKR] Found projects:", projects.length);
    return projects;
  },
});

/**
 * Get project details from NMKR
 */
export const getProject = action({
  args: {
    projectUid: v.string(),
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = args.apiKey;

    const response = await fetch(
      `${NMKR_API_BASE}/v2/GetProject/${args.projectUid}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`NMKR API error: ${response.status} - ${errorText}`);
    }

    const project = await response.json();
    return project;
  },
});

// ==========================================
// NFT UPLOAD & METADATA
// ==========================================

/**
 * Upload NFT metadata and art to NMKR project
 * This creates the NFT definition - what it looks like, its properties, etc.
 */
export const uploadNFT = action({
  args: {
    projectUid: v.string(),
    nftName: v.string(),
    nftDescription: v.optional(v.string()),
    ipfsImageHash: v.optional(v.string()), // IPFS hash of image (ipfs://...)
    imageUrl: v.optional(v.string()), // Or direct URL to image
    assetName: v.optional(v.string()), // On-chain asset name (if not provided, auto-generated)
    metadata: v.optional(v.any()), // Custom metadata attributes
    rarityScore: v.optional(v.number()),
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = args.apiKey;

    // Build metadata attributes
    const metadataAttributes: Record<string, string> = {};
    if (args.metadata) {
      Object.entries(args.metadata).forEach(([key, value]) => {
        metadataAttributes[key] = String(value);
      });
    }

    const requestBody = {
      nftUid: "", // Empty for new NFT
      nftProjectUid: args.projectUid,
      nftName: args.nftName,
      nftDescription: args.nftDescription || "",
      assetName: args.assetName || "", // Empty = auto-generate
      previewImageNft: {
        mimetype: "image/png",
        fileFromIpfs: args.ipfsImageHash || "",
        fileFromUrl: args.imageUrl || "",
      },
      nftmetadatav2: metadataAttributes,
      rarityNum: args.rarityScore,
    };

    console.log("[NMKR] Uploading NFT:", args.nftName);

    const response = await fetch(`${NMKR_API_BASE}/v2/UploadNft`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[NMKR] NFT upload failed:", errorText);
      throw new Error(`NMKR API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("[NMKR] NFT uploaded successfully:", result);

    return {
      nftUid: result.nftUid,
      assetId: result.assetId,
    };
  },
});

// ==========================================
// MINTING & SENDING
// ==========================================

/**
 * Mint and send a specific NFT to a wallet address
 */
export const mintAndSendNFT = action({
  args: {
    projectUid: v.string(),
    nftUid: v.string(), // Specific NFT to mint (from uploadNFT)
    receiverAddress: v.string(), // Cardano wallet address to send to
    metadata: v.optional(v.any()), // Optional metadata to attach
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = args.apiKey;

    const requestBody = {
      nftProjectUid: args.projectUid,
      nftUid: args.nftUid,
      receiverAddress: args.receiverAddress,
      metadata: args.metadata || {},
    };

    console.log("[NMKR] Minting NFT to:", args.receiverAddress);

    const response = await fetch(`${NMKR_API_BASE}/v2/MintAndSendSpecific`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[NMKR] Minting failed:", errorText);
      throw new Error(`NMKR API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("[NMKR] NFT minted successfully:", result);

    return {
      txHash: result.txHash,
      tokenname: result.tokenname,
      assetId: result.assetId,
    };
  },
});

/**
 * Mint a random NFT from project and send to wallet
 * Useful for paid sales where buyer gets a random NFT
 */
export const mintAndSendRandom = action({
  args: {
    projectUid: v.string(),
    receiverAddress: v.string(),
    count: v.optional(v.number()), // Number of NFTs to mint (default 1)
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = args.apiKey;

    const requestBody = {
      nftProjectUid: args.projectUid,
      receiverAddress: args.receiverAddress,
      countNft: args.count || 1,
    };

    console.log("[NMKR] Minting random NFT(s) to:", args.receiverAddress);

    const response = await fetch(`${NMKR_API_BASE}/v2/MintAndSendRandom`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[NMKR] Random minting failed:", errorText);
      throw new Error(`NMKR API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("[NMKR] Random NFT(s) minted successfully");

    return result;
  },
});

// ==========================================
// HIGH-LEVEL WORKFLOWS
// ==========================================

/**
 * Complete workflow: Create project from our nftEvent
 * Links our internal event to an NMKR project
 */
export const createProjectFromEvent = action({
  args: {
    eventId: v.id("nftEvents"),
    apiKey: v.string(),
    payoutWallet: v.string(),
  },
  handler: async (ctx, args) => {
    // Get event details
    const event = await ctx.runQuery(api.nftEvents.getEventById, {
      eventId: args.eventId,
    });

    if (!event) {
      throw new Error("Event not found");
    }

    if (event.nmkrProjectId) {
      throw new Error("Event already has an NMKR project linked");
    }

    // Create NMKR project
    const project = await ctx.runAction(internal.nmkrApi.createProject, {
      projectName: `${event.eventName} #${event.eventNumber}`,
      description: event.storyContext || `NFTs for ${event.eventName}`,
      policyExpires: true,
      apiKey: args.apiKey,
      payoutWallet: args.payoutWallet,
    });

    // Update event with NMKR project info
    await ctx.runMutation(api.nftEvents.updateEvent, {
      eventId: args.eventId,
      nmkrProjectId: project.projectUid,
      nmkrProjectName: project.projectName,
    });

    return project;
  },
});

/**
 * Upload all 3 variations (easy/medium/hard) for an event to NMKR
 */
export const uploadEventVariations = action({
  args: {
    eventId: v.id("nftEvents"),
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    // Get event and project info
    const event = await ctx.runQuery(api.nftEvents.getEventById, {
      eventId: args.eventId,
    });

    if (!event) {
      throw new Error("Event not found");
    }

    if (!event.nmkrProjectId) {
      throw new Error("Event must have NMKR project first. Call createProjectFromEvent.");
    }

    // Get variations
    const variations = await ctx.runQuery(api.nftVariations.getVariationsByEvent, {
      eventId: args.eventId,
    });

    if (variations.length === 0) {
      throw new Error("No variations found for this event");
    }

    const results = [];

    // Upload each variation to NMKR
    for (const variation of variations) {
      if (!variation.mainArtUrl) {
        console.warn(`[NMKR] Skipping ${variation.nftName} - no art URL`);
        continue;
      }

      const uploadResult = await ctx.runAction(internal.nmkrApi.uploadNFT, {
        projectUid: event.nmkrProjectId,
        nftName: variation.nftName,
        nftDescription: `${event.eventName} - ${variation.difficulty} difficulty`,
        imageUrl: variation.mainArtUrl,
        metadata: {
          event: event.eventName,
          eventNumber: event.eventNumber.toString(),
          difficulty: variation.difficulty,
          supply: variation.supplyTotal.toString(),
        },
        apiKey: args.apiKey,
      });

      // Update variation with NMKR asset info
      await ctx.runMutation(api.nftVariations.updateVariation, {
        variationId: variation._id,
        nmkrAssetId: uploadResult.nftUid,
      });

      results.push({
        difficulty: variation.difficulty,
        nftUid: uploadResult.nftUid,
        assetId: uploadResult.assetId,
      });
    }

    return results;
  },
});

/**
 * Simple test: Mint a single NFT to your wallet
 * Perfect for testing before minting 50-100 tokens
 */
export const mintTestNFT = action({
  args: {
    projectUid: v.string(),
    nftName: v.string(),
    imageUrl: v.string(),
    receiverAddress: v.string(),
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("[NMKR] Starting test NFT mint workflow");

    // Step 1: Upload NFT metadata
    const uploadResult = await ctx.runAction(internal.nmkrApi.uploadNFT, {
      projectUid: args.projectUid,
      nftName: args.nftName,
      imageUrl: args.imageUrl,
      nftDescription: "Test NFT",
      apiKey: args.apiKey,
    });

    console.log("[NMKR] NFT uploaded, now minting...");

    // Step 2: Mint and send to wallet
    const mintResult = await ctx.runAction(internal.nmkrApi.mintAndSendNFT, {
      projectUid: args.projectUid,
      nftUid: uploadResult.nftUid,
      receiverAddress: args.receiverAddress,
      apiKey: args.apiKey,
    });

    return {
      success: true,
      nftUid: uploadResult.nftUid,
      txHash: mintResult.txHash,
      assetId: mintResult.assetId,
      message: `NFT minted successfully! TX: ${mintResult.txHash}`,
    };
  },
});
