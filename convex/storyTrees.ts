import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Story tree functions
// Get all story trees
export const getAllStoryTrees = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("storyTrees").collect();
  },
});

// Get a specific story tree by name
export const getStoryTreeByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("storyTrees")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();
  },
});

// Save or update a story tree
export const saveStoryTree = mutation({
  args: {
    name: v.string(),
    chapter: v.number(),
    nodes: v.array(v.object({
      id: v.string(),
      x: v.number(),
      y: v.number(),
      label: v.string(),
      index: v.optional(v.number()),
      storyNodeType: v.optional(v.string()),
      completed: v.optional(v.boolean()),
      available: v.optional(v.boolean()),
      current: v.optional(v.boolean()),
    })),
    connections: v.array(v.object({
      from: v.string(),
      to: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    // Check if tree with this name already exists
    const existing = await ctx.db
      .query("storyTrees")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();
    
    if (existing) {
      // Update existing tree
      await ctx.db.patch(existing._id, {
        chapter: args.chapter,
        nodes: args.nodes,
        connections: args.connections,
        updatedAt: Date.now(),
      });
      return { action: "updated", id: existing._id };
    } else {
      // Create new tree
      const id = await ctx.db.insert("storyTrees", {
        name: args.name,
        chapter: args.chapter,
        nodes: args.nodes,
        connections: args.connections,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return { action: "created", id };
    }
  },
});

// Delete a story tree
export const deleteStoryTree = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const tree = await ctx.db
      .query("storyTrees")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();
    
    if (tree) {
      await ctx.db.delete(tree._id);
      return { deleted: true, name: args.name };
    }
    
    return { deleted: false, name: args.name };
  },
});

// Batch save multiple story trees (for backup restoration)
export const batchSaveStoryTrees = mutation({
  args: {
    trees: v.array(v.object({
      name: v.string(),
      chapter: v.number(),
      nodes: v.array(v.object({
        id: v.string(),
        x: v.number(),
        y: v.number(),
        label: v.string(),
        index: v.optional(v.number()),
        storyNodeType: v.optional(v.string()),
        completed: v.optional(v.boolean()),
        available: v.optional(v.boolean()),
        current: v.optional(v.boolean()),
      })),
      connections: v.array(v.object({
        from: v.string(),
        to: v.string(),
      })),
    })),
  },
  handler: async (ctx, args) => {
    const results = [];
    
    for (const tree of args.trees) {
      const existing = await ctx.db
        .query("storyTrees")
        .filter((q) => q.eq(q.field("name"), tree.name))
        .first();
      
      if (existing) {
        await ctx.db.patch(existing._id, {
          chapter: tree.chapter,
          nodes: tree.nodes,
          connections: tree.connections,
          updatedAt: Date.now(),
        });
        results.push({ name: tree.name, action: "updated" });
      } else {
        await ctx.db.insert("storyTrees", {
          name: tree.name,
          chapter: tree.chapter,
          nodes: tree.nodes,
          connections: tree.connections,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        results.push({ name: tree.name, action: "created" });
      }
    }
    
    return results;
  },
});