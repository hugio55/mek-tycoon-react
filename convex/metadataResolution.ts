import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// MEK NFT Policy ID
const MEK_POLICY_ID = "ffa56051fda3d106a96f09c3d209d4bf24a117406fb813fb8b4548e3";

// IPFS gateways for fallback
const IPFS_GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
];

// Blockfrost API for metadata
async function fetchMetadataFromBlockfrost(assetId: string): Promise<any> {
  const apiKey = process.env.BLOCKFROST_API_KEY;

  if (!apiKey || apiKey === 'your_blockfrost_mainnet_api_key_here') {
    throw new Error('Blockfrost API key not configured');
  }

  try {
    const response = await fetch(
      `https://cardano-mainnet.blockfrost.io/api/v0/assets/${assetId}`,
      {
        headers: {
          'project_id': apiKey
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Blockfrost error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Failed to fetch metadata from Blockfrost:', error);
    throw error;
  }
}

// Resolve IPFS hash to content
async function resolveIPFS(ipfsHash: string): Promise<any> {
  // Remove ipfs:// prefix if present
  const cleanHash = ipfsHash.replace('ipfs://', '');

  for (const gateway of IPFS_GATEWAYS) {
    try {
      const response = await fetch(`${gateway}${cleanHash}`, {
        timeout: 5000
      } as any);

      if (response.ok) {
        const contentType = response.headers.get('content-type');

        if (contentType?.includes('json')) {
          return response.json();
        } else {
          return {
            url: `${gateway}${cleanHash}`,
            contentType
          };
        }
      }
    } catch (error) {
      console.log(`Failed to fetch from ${gateway}, trying next...`);
    }
  }

  throw new Error('Failed to resolve IPFS content from all gateways');
}

// Parse CIP-25 metadata structure
function parseCIP25Metadata(metadata: any): any {
  // CIP-25 structure: policy_id -> asset_name -> metadata
  const policyMetadata = metadata[MEK_POLICY_ID] || metadata['721']?.[MEK_POLICY_ID];

  if (!policyMetadata) {
    return null;
  }

  // Get the first asset (or specific one if asset name provided)
  const assetNames = Object.keys(policyMetadata);
  if (assetNames.length === 0) {
    return null;
  }

  const assetMetadata = policyMetadata[assetNames[0]];

  return {
    name: assetMetadata.name,
    image: assetMetadata.image,
    description: assetMetadata.description,
    attributes: assetMetadata.attributes || [],
    // MEK-specific fields
    head: assetMetadata.Head || assetMetadata.head,
    body: assetMetadata.Body || assetMetadata.body,
    trait: assetMetadata.Trait || assetMetadata.trait,
    rarity: assetMetadata.Rarity || assetMetadata.rarity,
    rank: assetMetadata.Rank || assetMetadata.rank,
    // Additional metadata
    files: assetMetadata.files || [],
    mediaType: assetMetadata.mediaType,
  };
}

// Fetch and resolve NFT metadata
export const resolveNFTMetadata = action({
  args: {
    assetId: v.string(),
    assetName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      // Fetch metadata from Blockfrost
      const assetData = await fetchMetadataFromBlockfrost(args.assetId);

      // Check for on-chain metadata
      let metadata = null;
      if (assetData.onchain_metadata) {
        metadata = parseCIP25Metadata(assetData.onchain_metadata);
      }

      // If metadata has IPFS references, resolve them
      if (metadata?.image && metadata.image.startsWith('ipfs://')) {
        try {
          const imageData = await resolveIPFS(metadata.image);
          metadata.resolvedImage = imageData.url || imageData;
        } catch (error) {
          console.error('Failed to resolve image IPFS:', error);
          metadata.resolvedImage = null;
        }
      }

      // Resolve additional files
      if (metadata?.files && Array.isArray(metadata.files)) {
        metadata.resolvedFiles = await Promise.all(
          metadata.files.map(async (file: any) => {
            if (file.src && file.src.startsWith('ipfs://')) {
              try {
                const fileData = await resolveIPFS(file.src);
                return {
                  ...file,
                  resolvedSrc: fileData.url || fileData,
                };
              } catch {
                return file;
              }
            }
            return file;
          })
        );
      }

      // Extract MEK-specific data
      const mekData = {
        mekNumber: parseInt(assetData.asset_name?.replace(/[^0-9]/g, '') || '0'),
        headVariation: metadata?.head,
        bodyVariation: metadata?.body,
        traitVariation: metadata?.trait,
        rarity: metadata?.rarity,
        rank: metadata?.rank,
      };

      // Store resolved metadata
      await ctx.runMutation(api.metadataResolution.storeResolvedMetadata, {
        assetId: args.assetId,
        assetName: assetData.asset_name,
        metadata: JSON.stringify(metadata),
        mekData: JSON.stringify(mekData),
        resolvedImage: metadata?.resolvedImage || metadata?.image,
      });

      return {
        success: true,
        assetId: args.assetId,
        assetName: assetData.asset_name,
        metadata,
        mekData,
        quantity: assetData.quantity,
        initialMintTxHash: assetData.initial_mint_tx_hash,
        mintBlockHeight: assetData.mint_or_burn_count,
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to resolve metadata',
        assetId: args.assetId,
      };
    }
  },
});

// Store resolved metadata
export const storeResolvedMetadata = mutation({
  args: {
    assetId: v.string(),
    assetName: v.string(),
    metadata: v.string(), // JSON string
    mekData: v.string(), // JSON string
    resolvedImage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if we already have this metadata
    const existing = await ctx.db
      .query("nftMetadata")
      .filter(q => q.eq(q.field("assetId"), args.assetId))
      .first();

    const metadataObj = JSON.parse(args.metadata);
    const mekDataObj = JSON.parse(args.mekData);

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        assetName: args.assetName,
        metadata: metadataObj,
        mekData: mekDataObj,
        resolvedImage: args.resolvedImage,
        lastUpdated: Date.now(),
      });
      return existing._id;
    } else {
      // Create new
      return await ctx.db.insert("nftMetadata", {
        assetId: args.assetId,
        assetName: args.assetName,
        metadata: metadataObj,
        mekData: mekDataObj,
        resolvedImage: args.resolvedImage,
        fetchedAt: Date.now(),
        lastUpdated: Date.now(),
      });
    }
  },
});

// Get cached metadata
export const getCachedMetadata = query({
  args: {
    assetId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("nftMetadata")
      .filter(q => q.eq(q.field("assetId"), args.assetId))
      .first();
  },
});

// Batch resolve metadata for multiple assets
export const batchResolveMetadata = action({
  args: {
    assetIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const results = [];
    const errors = [];

    for (const assetId of args.assetIds) {
      try {
        // Check cache first
        const cached = await ctx.runQuery(api.metadataResolution.getCachedMetadata, {
          assetId,
        });

        if (cached && Date.now() - cached.lastUpdated < 86400000) { // 24 hours
          results.push({
            assetId,
            cached: true,
            metadata: cached.metadata,
            mekData: cached.mekData,
          });
        } else {
          // Fetch fresh metadata
          const fresh = await ctx.runAction(api.metadataResolution.resolveNFTMetadata, {
            assetId,
          });

          if (fresh.success) {
            results.push(fresh);
          } else {
            errors.push({
              assetId,
              error: fresh.error,
            });
          }
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error: any) {
        errors.push({
          assetId,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      resolved: results.length,
      failed: errors.length,
      results,
      errors,
    };
  },
});

// Get metadata statistics
export const getMetadataStats = query({
  args: {},
  handler: async (ctx) => {
    const allMetadata = await ctx.db.query("nftMetadata").collect();

    const stats = {
      totalCached: allMetadata.length,
      withImages: allMetadata.filter(m => m.resolvedImage).length,
      byRarity: {} as Record<string, number>,
      lastUpdated: Math.max(...allMetadata.map(m => m.lastUpdated || 0)),
    };

    // Count by rarity
    allMetadata.forEach(m => {
      const rarity = m.mekData?.rarity || 'unknown';
      stats.byRarity[rarity] = (stats.byRarity[rarity] || 0) + 1;
    });

    return stats;
  },
});