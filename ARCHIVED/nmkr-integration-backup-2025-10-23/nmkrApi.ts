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
    metadataTemplate: v.optional(v.string()), // CIP-25 metadata template JSON (escaped)
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

    const requestBody: any = {
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

    // Add metadata template if provided (must be escaped JSON string)
    if (args.metadataTemplate) {
      requestBody.metadataTemplate = args.metadataTemplate;
      console.log("[NMKR] Including custom metadata template");
    }

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
    imageUrl: v.optional(v.string()), // Public URL to image
    imageBase64: v.optional(v.string()), // Or Base64 encoded image
    imageStorageId: v.optional(v.string()), // Or Convex storage ID for base64
    imageMimetype: v.optional(v.string()), // Media type (image/gif, video/mp4, etc.)
    assetName: v.optional(v.string()), // Display name (what users see in wallets)
    metadata: v.optional(v.any()), // Custom metadata attributes
    rarityScore: v.optional(v.number()),
    useTimestamp: v.optional(v.boolean()), // Add timestamp suffix to tokenname
    subassets: v.optional(v.array(v.object({
      url: v.optional(v.string()),
      base64: v.optional(v.string()),
      storageId: v.optional(v.string()), // Convex storage ID for base64
      ipfsHash: v.optional(v.string()),
      name: v.string(),
      description: v.optional(v.string()),
      mimetype: v.optional(v.string()),
    }))),
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = args.apiKey;

    // Fetch base64 from storage if needed
    let imageBase64 = args.imageBase64;
    if (!imageBase64 && args.imageStorageId) {
      const blob = await ctx.storage.get(args.imageStorageId);
      if (blob) {
        imageBase64 = await blob.text();
        console.log("[NMKR] Fetched image base64 from storage, size:", imageBase64.length);
      }
    }

    // Build metadata attributes as array for NMKR's metadataPlaceholder format
    const metadataPlaceholder: Array<{ name: string; value: string }> = [];
    if (args.metadata) {
      Object.entries(args.metadata).forEach(([key, value]) => {
        metadataPlaceholder.push({
          name: key,
          value: String(value),
        });
      });
    }

    // Build subassets array for NMKR (must use "subfiles" format)
    const subfiles = await Promise.all((args.subassets || []).map(async (subasset) => {
      // Build file data object with appropriate source
      const fileData: any = {
        mimetype: subasset.mimetype || "application/octet-stream",
      };

      // Fetch base64 from storage if storageId provided
      let base64Data = subasset.base64;
      if (!base64Data && subasset.storageId) {
        const blob = await ctx.storage.get(subasset.storageId);
        if (blob) {
          base64Data = await blob.text();
          console.log("[NMKR] Fetched subasset base64 from storage:", subasset.name, "size:", base64Data.length);
        }
      }

      if (base64Data) {
        fileData.fileFromBase64 = base64Data;
      } else if (subasset.ipfsHash) {
        fileData.fileFromIPFS = subasset.ipfsHash;
      } else if (subasset.url) {
        fileData.fileFromUrl = subasset.url;
      }

      return {
        subfile: fileData,
        description: subasset.description || "",
      };
    }));

    // Build main NFT image data
    let imageData: any = {};
    const imageMimetype = args.imageMimetype || "image/png";
    if (imageBase64) {
      imageData = {
        mimetype: imageMimetype,
        fileFromBase64: imageBase64,
      };
      console.log("[NMKR] Using Base64 image, length:", imageBase64.length, "type:", imageMimetype);
    } else if (args.ipfsImageHash) {
      imageData = {
        mimetype: imageMimetype,
        fileFromIpfs: args.ipfsImageHash,
      };
    } else if (args.imageUrl) {
      imageData = {
        mimetype: imageMimetype,
        fileFromUrl: args.imageUrl,
      };
    }

    // Generate tokenname (optionally add timestamp to avoid duplicates)
    const baseTokenName = args.nftName.replace(/[^a-zA-Z0-9]/g, '');
    const shouldUseTimestamp = args.useTimestamp === true; // Default to false
    const uniqueTokenName = shouldUseTimestamp
      ? `${baseTokenName}${Date.now().toString().slice(-6)}` // Add timestamp
      : baseTokenName; // Use as-is

    const requestBody = {
      nftUid: "", // Empty for new NFT
      nftProjectUid: args.projectUid,
      tokenname: uniqueTokenName, // Unique on-chain asset name
      displayname: args.assetName || args.nftName, // Display name (what users see)
      description: args.nftDescription || "", // Description for CIP-25 metadata
      previewImageNft: imageData,
      metadataPlaceholder: metadataPlaceholder.length > 0 ? metadataPlaceholder : undefined, // Custom metadata as array [{name, value}]
      rarityNum: args.rarityScore,
      subfiles: subfiles, // Add subassets in correct NMKR format
    };

    console.log("[NMKR] Display name:", args.assetName || args.nftName);
    console.log("[NMKR] On-chain tokenname:", uniqueTokenName, shouldUseTimestamp ? "(with timestamp)" : "(without timestamp)");
    if (args.nftDescription) {
      console.log("[NMKR] Description:", args.nftDescription.substring(0, 50) + (args.nftDescription.length > 50 ? "..." : ""));
    }
    if (metadataPlaceholder.length > 0) {
      console.log("[NMKR] Custom metadata fields:", metadataPlaceholder.length);
      metadataPlaceholder.forEach(field => {
        console.log(`  - ${field.name}: ${field.value}`);
      });
    }

    console.log("[NMKR] Uploading NFT:", args.assetName || args.nftName);
    if (subfiles.length > 0) {
      console.log(`[NMKR] Including ${subfiles.length} subasset(s)`);
      subfiles.forEach((sf, idx) => {
        const hasBase64 = sf.subfile.fileFromBase64 ? `${(sf.subfile.fileFromBase64.length / 1024).toFixed(0)} KB` : 'no';
        const hasUrl = sf.subfile.fileFromUrl ? 'yes' : 'no';
        const hasIPFS = sf.subfile.fileFromIPFS ? 'yes' : 'no';
        console.log(`  [${idx + 1}] Base64: ${hasBase64}, URL: ${hasUrl}, IPFS: ${hasIPFS}, Type: ${sf.subfile.mimetype}`);
      });
    }

    // Log the request structure (without huge base64 strings)
    const requestPreview = {
      ...requestBody,
      previewImageNft: requestBody.previewImageNft ? { ...requestBody.previewImageNft, fileFromBase64: '[BASE64_DATA]' } : undefined,
      subfiles: requestBody.subfiles?.map(sf => ({
        ...sf,
        subfile: { ...sf.subfile, fileFromBase64: sf.subfile.fileFromBase64 ? '[BASE64_DATA]' : undefined }
      })),
    };
    console.log("[NMKR] Request body structure:", JSON.stringify(requestPreview, null, 2));

    // Explicitly log metadataPlaceholder to verify it's being sent
    if (requestBody.metadataPlaceholder) {
      console.log("[NMKR] ⚠️ IMPORTANT: metadataPlaceholder field in request:", JSON.stringify(requestBody.metadataPlaceholder, null, 2));
    }

    const response = await fetch(`${NMKR_API_BASE}/v2/UploadNft/${args.projectUid}`, {
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

    // Extract policyId from metadata if available
    let policyId = result.policyId;
    if (!policyId && result.metadata) {
      try {
        const metadata = JSON.parse(result.metadata);
        // Policy ID is the key under "721" in CIP-25 metadata
        const cip25 = metadata["721"];
        if (cip25) {
          const policyIds = Object.keys(cip25).filter(key => key !== "version");
          if (policyIds.length > 0) {
            policyId = policyIds[0];
            console.log("[NMKR] Extracted policyId from metadata:", policyId);
          }
        }
      } catch (err) {
        console.error("[NMKR] Failed to parse metadata for policyId:", err);
      }
    }

    return {
      nftUid: result.nftUid,
      assetId: result.assetId,
      ipfsHash: result.ipfsHashMainnft,
      tokenname: uniqueTokenName, // Return the generated tokenname
      policyId: policyId, // Extracted from metadata or null
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

    const endpoint = `${NMKR_API_BASE}/v2/MintAndSendSpecific/${args.projectUid}/${args.nftUid}/1/${args.receiverAddress}`;

    console.log("[NMKR] Minting NFT with request:", {
      endpoint,
      projectUid: args.projectUid,
      nftUid: args.nftUid,
      receiverAddress: args.receiverAddress,
    });

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "accept": "text/plain",
        "Authorization": `Bearer ${apiKey}`,
      },
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
      mintAndSendId: result.mintAndSendId, // Batch mint ID from NMKR
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
    nftName: v.string(), // On-chain tokenname base
    displayName: v.optional(v.string()), // Display name for wallets
    description: v.optional(v.string()), // NFT description
    imageStorageId: v.string(), // Convex storage ID instead of base64
    imageMimetype: v.optional(v.string()),
    receiverAddress: v.string(),
    subassets: v.optional(v.array(v.object({
      storageId: v.optional(v.string()), // Convex storage ID for large files
      url: v.optional(v.string()),
      base64: v.optional(v.string()),
      ipfsHash: v.optional(v.string()),
      name: v.string(),
      description: v.optional(v.string()),
      mimetype: v.optional(v.string()),
    }))),
    metadata: v.optional(v.any()), // Custom metadata key-value pairs
    useTimestamp: v.optional(v.boolean()), // Add timestamp suffix to tokenname
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("[NMKR] Starting test NFT mint workflow");

    // Validate storage IDs exist
    if (!args.imageStorageId) {
      throw new Error("Image storage ID is required");
    }

    // Step 1: Upload NFT metadata (with subassets if provided)
    // Pass storage IDs instead of base64 to avoid 16MB action argument limit
    const uploadResult = await ctx.runAction(internal.nmkrApi.uploadNFT, {
      projectUid: args.projectUid,
      nftName: args.nftName,
      assetName: args.displayName || args.nftName, // Use displayName for asset name
      imageStorageId: args.imageStorageId, // Pass storage ID, uploadNFT will fetch base64
      imageMimetype: args.imageMimetype,
      nftDescription: args.description || "",
      subassets: args.subassets, // Pass storage IDs directly, uploadNFT will fetch base64
      metadata: args.metadata,
      useTimestamp: args.useTimestamp, // Pass through (defaults to false in uploadNFT)
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

    // Step 3: Save to mint history
    try {
      await ctx.runMutation(api.mintHistory.saveMintRecord, {
        nftUid: uploadResult.nftUid,
        tokenname: uploadResult.tokenname || args.nftName,
        displayName: args.displayName || args.nftName,
        projectUid: args.projectUid,
        description: args.description,
        mediaType: args.imageMimetype || "image/png",
        ipfsHash: uploadResult.ipfsHash,
        customMetadata: args.metadata,
        receiverAddress: args.receiverAddress,
        mintStatus: "minted", // Mint completed successfully (txHash received)
        mintAndSendId: mintResult.mintAndSendId,
        policyId: uploadResult.policyId,
        assetId: uploadResult.assetId,
      });
      console.log("[NMKR] Mint record saved to history");
    } catch (err) {
      console.error("[NMKR] Failed to save mint history:", err);
      // Don't fail the whole mint if history saving fails
    }

    return {
      success: true,
      nftUid: uploadResult.nftUid,
      txHash: mintResult.txHash,
      assetId: mintResult.assetId,
      message: `NFT minted successfully! TX: ${mintResult.txHash}`,
    };
  },
});

/**
 * Refresh policy ID for a minted NFT
 * Extracts policyId from existing assetId in the database
 */
export const refreshPolicyId = action({
  args: {
    projectUid: v.string(),
    nftUid: v.string(),
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("[NMKR] Refreshing policy ID for:", args.nftUid);

    // Get the mint record from database
    const record = await ctx.runQuery(api.mintHistory.getMintByNftUid, {
      nftUid: args.nftUid,
    });

    if (!record) {
      throw new Error("Mint record not found in database");
    }

    // If we already have a policyId, no need to refresh
    if (record.policyId) {
      console.log("[NMKR] Policy ID already exists:", record.policyId);
      return {
        success: true,
        policyId: record.policyId,
        message: "Policy ID already available",
      };
    }

    // Extract policyId from assetId (first 56 characters)
    // Cardano asset format: policyId (56 chars) + assetName (hex)
    let policyId: string | null = null;
    if (record.assetId && record.assetId.length >= 56) {
      policyId = record.assetId.substring(0, 56);
      console.log("[NMKR] Extracted policyId from assetId:", policyId);
    }

    if (policyId) {
      await ctx.runMutation(api.mintHistory.updatePolicyId, {
        nftUid: args.nftUid,
        policyId: policyId,
        tokenname: record.tokenname,
      });

      console.log("[NMKR] Policy ID updated:", policyId);

      return {
        success: true,
        policyId: policyId,
        tokenname: record.tokenname,
      };
    } else {
      return {
        success: false,
        message: "AssetId not available yet. NFT may still be processing.",
      };
    }
  },
});
