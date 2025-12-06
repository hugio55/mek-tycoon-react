import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ==========================================
// QUERIES
// ==========================================

// Get all art assets in library
export const getArtLibrary = query({
  args: {
    category: v.optional(v.union(
      v.literal("event_art"),
      v.literal("variation_art"),
      v.literal("promotional"),
      v.literal("backgrounds"),
      v.literal("other")
    )),
    tags: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("nftArtAssets");

    if (args.category) {
      query = query.withIndex("", (q: any) => q.eq("category", args.category));
    }

    let assets = await query.collect();

    // Filter by tags if provided
    if (args.tags && args.tags.length > 0) {
      assets = assets.filter(asset =>
        args.tags!.some(tag => asset.tags?.includes(tag))
      );
    }

    // Sort by most recently uploaded
    assets.sort((a, b) => b.uploadedAt - a.uploadedAt);

    // Apply limit
    if (args.limit) {
      assets = assets.slice(0, args.limit);
    }

    return assets;
  },
});

// Get art asset by ID
export const getArtAssetById = query({
  args: { assetId: v.id("nftArtAssets") },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.assetId);
    return asset;
  },
});

// Search art assets by name
export const searchArtAssets = query({
  args: {
    searchTerm: v.string(),
    category: v.optional(v.union(
      v.literal("event_art"),
      v.literal("variation_art"),
      v.literal("promotional"),
      v.literal("backgrounds"),
      v.literal("other")
    )),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("nftArtAssets");

    if (args.category) {
      query = query.withIndex("", (q: any) => q.eq("category", args.category));
    }

    const assets = await query.collect();

    // Filter by search term
    const filtered = assets.filter(asset =>
      asset.assetName.toLowerCase().includes(args.searchTerm.toLowerCase()) ||
      asset.tags?.some(tag => tag.toLowerCase().includes(args.searchTerm.toLowerCase()))
    );

    return filtered.sort((a, b) => b.uploadedAt - a.uploadedAt);
  },
});

// Get art usage statistics
export const getArtUsageStats = query({
  args: { assetId: v.id("nftArtAssets") },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.assetId);
    if (!asset) return null;

    // Find all variations using this art
    const variationsWithMainArt = await ctx.db
      .query("nftVariations")
      .filter((q) => q.eq(q.field("mainArtUrl"), asset.mainArtUrl))
      .collect();

    const variationsWithThumbnail = await ctx.db
      .query("nftVariations")
      .filter((q) => q.eq(q.field("thumbnailUrl"), asset.thumbnailUrl || asset.mainArtUrl))
      .collect();

    return {
      asset,
      usedInMainArt: variationsWithMainArt.length,
      usedInThumbnails: variationsWithThumbnail.length,
      totalUsage: new Set([
        ...variationsWithMainArt.map(v => v._id),
        ...variationsWithThumbnail.map(v => v._id),
      ]).size,
      variations: [...variationsWithMainArt, ...variationsWithThumbnail],
    };
  },
});

// ==========================================
// MUTATIONS
// ==========================================

// Add art asset to library
export const addArtAsset = mutation({
  args: {
    assetName: v.string(),
    mainArtUrl: v.string(),
    thumbnailUrl: v.optional(v.string()),
    thumbnailSmallUrl: v.optional(v.string()),
    category: v.union(
      v.literal("event_art"),
      v.literal("variation_art"),
      v.literal("promotional"),
      v.literal("backgrounds"),
      v.literal("other")
    ),
    format: v.union(
      v.literal("gif"),
      v.literal("png"),
      v.literal("jpg"),
      v.literal("webp"),
      v.literal("mp4")
    ),
    fileSize: v.optional(v.number()),
    dimensions: v.optional(v.string()),
    ipfsHash: v.optional(v.string()),
    arweaveId: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const assetId = await ctx.db.insert("nftArtAssets", {
      assetName: args.assetName,
      mainArtUrl: args.mainArtUrl,
      thumbnailUrl: args.thumbnailUrl,
      thumbnailSmallUrl: args.thumbnailSmallUrl,
      category: args.category,
      format: args.format,
      fileSize: args.fileSize,
      dimensions: args.dimensions,
      ipfsHash: args.ipfsHash,
      arweaveId: args.arweaveId,
      tags: args.tags,
      description: args.description,
      uploadedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    return assetId;
  },
});

// Update art asset
export const updateArtAsset = mutation({
  args: {
    assetId: v.id("nftArtAssets"),
    assetName: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    thumbnailSmallUrl: v.optional(v.string()),
    category: v.optional(v.union(
      v.literal("event_art"),
      v.literal("variation_art"),
      v.literal("promotional"),
      v.literal("backgrounds"),
      v.literal("other")
    )),
    tags: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { assetId, ...updates } = args;

    const asset = await ctx.db.get(assetId);
    if (!asset) {
      throw new Error("Art asset not found");
    }

    await ctx.db.patch(assetId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return assetId;
  },
});

// Delete art asset
export const deleteArtAsset = mutation({
  args: {
    assetId: v.id("nftArtAssets"),
    force: v.optional(v.boolean()), // Force delete even if in use
  },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.assetId);
    if (!asset) {
      throw new Error("Art asset not found");
    }

    if (!args.force) {
      // Check if asset is being used
      const variationsUsingArt = await ctx.db
        .query("nftVariations")
        .filter((q) =>
          q.or(
            q.eq(q.field("mainArtUrl"), asset.mainArtUrl),
            q.eq(q.field("thumbnailUrl"), asset.thumbnailUrl || asset.mainArtUrl)
          )
        )
        .collect();

      if (variationsUsingArt.length > 0) {
        throw new Error(
          `Cannot delete art asset. It is currently used in ${variationsUsingArt.length} variation(s). Use force=true to delete anyway.`
        );
      }
    }

    await ctx.db.delete(args.assetId);

    return { success: true };
  },
});

// Bulk import art assets
export const bulkImportArtAssets = mutation({
  args: {
    assets: v.array(v.object({
      assetName: v.string(),
      mainArtUrl: v.string(),
      thumbnailUrl: v.optional(v.string()),
      category: v.union(
        v.literal("event_art"),
        v.literal("variation_art"),
        v.literal("promotional"),
        v.literal("backgrounds"),
        v.literal("other")
      ),
      format: v.union(
        v.literal("gif"),
        v.literal("png"),
        v.literal("jpg"),
        v.literal("webp"),
        v.literal("mp4")
      ),
      tags: v.optional(v.array(v.string())),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const assetIds = [];

    for (const assetData of args.assets) {
      const assetId = await ctx.db.insert("nftArtAssets", {
        ...assetData,
        uploadedAt: now,
        createdAt: now,
        updatedAt: now,
      });
      assetIds.push(assetId);
    }

    return {
      success: true,
      imported: assetIds.length,
      assetIds,
    };
  },
});
