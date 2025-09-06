// Story nodes feature - not yet implemented
// This file is commented out until the storyPaths and playerStoryProgress tables are added to the schema

/*
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Save a generated story path
export const saveStoryPath = mutation({
  args: {
    chapter: v.number(),
    algorithm: v.string(),
    settings: v.object({
      nodeCount: v.number(),
      bossFreq: v.number(),
      eventChance: v.number(),
      maxWidth: v.number(),
      seed: v.string(),
    }),
    nodes: v.array(v.object({
      id: v.number(),
      level: v.number(),
      type: v.string(),
      x: v.number(),
      y: v.number(),
      connections: v.array(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    // Check if path already exists for this chapter
    const existing = await ctx.db
      .query("storyPaths")
      .filter((q) => q.eq(q.field("chapter"), args.chapter))
      .first();
    
    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        algorithm: args.algorithm,
        settings: args.settings,
        nodes: args.nodes,
        updatedAt: Date.now(),
        updatedBy: identity.tokenIdentifier,
      });
      return existing._id;
    } else {
      // Create new
      const pathId = await ctx.db.insert("storyPaths", {
        chapter: args.chapter,
        algorithm: args.algorithm,
        settings: args.settings,
        nodes: args.nodes,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: identity.tokenIdentifier,
        updatedBy: identity.tokenIdentifier,
      });
      return pathId;
    }
  },
});

// Get story path for a chapter
export const getStoryPath = query({
  args: {
    chapter: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("storyPaths")
      .filter((q) => q.eq(q.field("chapter"), args.chapter))
      .first();
  },
});

// Get all story paths
export const getAllStoryPaths = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("storyPaths")
      .collect();
  },
});

// Delete a story path
export const deleteStoryPath = mutation({
  args: {
    chapter: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const path = await ctx.db
      .query("storyPaths")
      .filter((q) => q.eq(q.field("chapter"), args.chapter))
      .first();
    
    if (path) {
      await ctx.db.delete(path._id);
      return true;
    }
    return false;
  },
});

// Get player progress for a chapter
export const getPlayerProgress = query({
  args: {
    playerId: v.string(),
    chapter: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("playerStoryProgress")
      .filter((q) => 
        q.and(
          q.eq(q.field("playerId"), args.playerId),
          q.eq(q.field("chapter"), args.chapter)
        )
      )
      .first();
  },
});

// Save player progress
export const savePlayerProgress = mutation({
  args: {
    playerId: v.string(),
    chapter: v.number(),
    currentNodeId: v.number(),
    completedNodes: v.array(v.number()),
    unlockedPaths: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("playerStoryProgress")
      .filter((q) => 
        q.and(
          q.eq(q.field("playerId"), args.playerId),
          q.eq(q.field("chapter"), args.chapter)
        )
      )
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        currentNodeId: args.currentNodeId,
        completedNodes: args.completedNodes,
        unlockedPaths: args.unlockedPaths,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      const progressId = await ctx.db.insert("playerStoryProgress", {
        playerId: args.playerId,
        chapter: args.chapter,
        currentNodeId: args.currentNodeId,
        completedNodes: args.completedNodes,
        unlockedPaths: args.unlockedPaths,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return progressId;
    }
  },
});
*/