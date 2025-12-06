import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all saved versions
export const getAllVersions = query({
  args: {},
  handler: async (ctx) => {
    const versions = await ctx.db
      .query("nodeFeeVersions")
      .order("desc")
      .collect();

    return versions.map((v: any) => ({
      _id: v._id,
      name: v.name,
      createdAt: v.createdAt,
      isAutoSave: v.isAutoSave || false
    }));
  }
});

// Get most recent version
export const getMostRecent = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("nodeFeeVersions")
      .order("desc")
      .first();
  }
});

// Get specific version by ID
export const getVersion = query({
  args: {
    versionId: v.id("nodeFeeVersions")
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.versionId);
  }
});

// Save a new version
export const saveVersion = mutation({
  args: {
    name: v.string(),
    fees: v.any(),
    isAutoSave: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const versionId = await ctx.db.insert("nodeFeeVersions", {
      name: args.name,
      fees: args.fees,
      createdAt: Date.now(),
      isAutoSave: args.isAutoSave || false
    });

    // Also update the main config to keep it in sync
    const existing = await ctx.db.query("nodeFeeConfig").first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        fees: args.fees,
        updatedAt: Date.now(),
        lastVersionId: versionId
      });
    } else {
      await ctx.db.insert("nodeFeeConfig", {
        fees: args.fees,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastVersionId: versionId
      });
    }

    return { success: true, versionId };
  }
});

// Delete a version
export const deleteVersion = mutation({
  args: {
    versionId: v.id("nodeFeeVersions")
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.versionId);
    return { success: true };
  }
});

// Update version name
export const renameVersion = mutation({
  args: {
    versionId: v.id("nodeFeeVersions"),
    newName: v.string()
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.versionId, {
      name: args.newName
    });
    return { success: true };
  }
});