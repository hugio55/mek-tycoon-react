import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Query to get all phase cards ordered by their order field
export const getAllPhaseCards = query({
  args: {},
  handler: async (ctx) => {
    const phases = await ctx.db
      .query("phaseCards")
      .withIndex("by_order")
      .order("asc")
      .collect();
    return phases;
  },
});

// Mutation to create a new phase card
export const createPhaseCard = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    locked: v.boolean(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const phaseId = await ctx.db.insert("phaseCards", {
      title: args.title,
      description: args.description,
      locked: args.locked,
      order: args.order,
      createdAt: now,
      updatedAt: now,
    });
    return phaseId;
  },
});

// Mutation to update an existing phase card
export const updatePhaseCard = mutation({
  args: {
    id: v.id("phaseCards"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    locked: v.optional(v.boolean()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Only include defined fields in the update
    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.locked !== undefined) updateData.locked = updates.locked;
    if (updates.order !== undefined) updateData.order = updates.order;

    await ctx.db.patch(id, updateData);
    return id;
  },
});

// Mutation to delete a phase card
export const deletePhaseCard = mutation({
  args: {
    id: v.id("phaseCards"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Mutation to reorder phase cards (bulk update)
export const reorderPhaseCards = mutation({
  args: {
    cardOrders: v.array(
      v.object({
        id: v.id("phaseCards"),
        order: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    for (const { id, order } of args.cardOrders) {
      await ctx.db.patch(id, {
        order,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

// Mutation to initialize default phase cards (if none exist)
export const initializeDefaultPhaseCards = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if any phase cards exist
    const existing = await ctx.db.query("phaseCards").first();

    if (existing) {
      return { message: "Phase cards already exist", initialized: false };
    }

    // Create default phase cards matching current hardcoded data
    const now = Date.now();
    const defaultPhases = [
      {
        title: "Phase I",
        description: "Gold Generation and Corporation Creation",
        locked: false,
        order: 1,
      },
      {
        title: "Phase II",
        description: "Under Construction",
        locked: false,
        order: 2,
      },
      {
        title: "Phase III",
        description: undefined,
        locked: true,
        order: 3,
      },
      {
        title: "Phase IV",
        description: undefined,
        locked: true,
        order: 4,
      },
      {
        title: "Phase V",
        description: undefined,
        locked: true,
        order: 5,
      },
    ];

    for (const phase of defaultPhases) {
      await ctx.db.insert("phaseCards", {
        ...phase,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { message: "Default phase cards initialized", initialized: true };
  },
});
