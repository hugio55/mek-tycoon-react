import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Phase Cards Management
 *
 * Convex database functions for managing landing page phase info cards.
 * Supports dynamic number of cards with full CRUD operations and reordering.
 */

// ===== QUERIES =====

/**
 * Get all phase cards ordered by their display order
 * Used by PhaseCarousel component to render phase cards dynamically
 */
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

/**
 * Get a single phase card by ID
 */
export const getPhaseCard = query({
  args: { id: v.id("phaseCards") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Check if phase cards table is empty
 * Used to determine if default seed data should be initialized
 */
export const isPhaseCardsEmpty = query({
  args: {},
  handler: async (ctx) => {
    const firstCard = await ctx.db.query("phaseCards").first();
    return firstCard === null;
  },
});

// ===== MUTATIONS =====

/**
 * Create a new phase card
 * Automatically adds to the end unless order is specified
 */
export const createPhaseCard = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    locked: v.boolean(),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // If order not specified, add to end
    let order = args.order;
    if (order === undefined) {
      const allCards = await ctx.db.query("phaseCards").collect();
      order = allCards.length;
    }

    const phaseId = await ctx.db.insert("phaseCards", {
      title: args.title,
      description: args.description,
      locked: args.locked,
      order,
      createdAt: now,
      updatedAt: now,
    });
    return phaseId;
  },
});

/**
 * Update an existing phase card
 * Only updates fields that are provided (partial update)
 */
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

    // Verify card exists
    const card = await ctx.db.get(id);
    if (!card) {
      throw new Error(`Phase card with id ${id} not found`);
    }

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

/**
 * Delete a phase card
 * Automatically reorders remaining cards to fill the gap
 */
export const deletePhaseCard = mutation({
  args: {
    id: v.id("phaseCards"),
  },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.id);
    if (!card) {
      throw new Error(`Phase card with id ${args.id} not found`);
    }

    await ctx.db.delete(args.id);

    // Reorder remaining cards to fill the gap
    const allCards = await ctx.db
      .query("phaseCards")
      .withIndex("by_order")
      .order("asc")
      .collect();

    const now = Date.now();
    for (let i = 0; i < allCards.length; i++) {
      if (allCards[i].order !== i) {
        await ctx.db.patch(allCards[i]._id, {
          order: i,
          updatedAt: now,
        });
      }
    }

    return args.id;
  },
});

/**
 * Reorder phase cards (bulk update)
 * Pass array of {id, order} objects to set new order
 */
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

/**
 * Swap the order of two phase cards
 * Useful for "move up/down" buttons in admin UI
 */
export const swapPhaseCardOrder = mutation({
  args: {
    id1: v.id("phaseCards"),
    id2: v.id("phaseCards"),
  },
  handler: async (ctx, args) => {
    const card1 = await ctx.db.get(args.id1);
    const card2 = await ctx.db.get(args.id2);

    if (!card1 || !card2) {
      throw new Error("One or both phase cards not found");
    }

    const now = Date.now();

    // Swap order values
    await ctx.db.patch(args.id1, {
      order: card2.order,
      updatedAt: now,
    });

    await ctx.db.patch(args.id2, {
      order: card1.order,
      updatedAt: now,
    });

    return { id1: args.id1, id2: args.id2 };
  },
});

/**
 * Initialize default phase cards (seed data)
 * Only runs if table is empty
 * Matches the hardcoded phases from PhaseCarousel component
 */
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
        order: 0,
      },
      {
        title: "Phase II",
        description: "Under Construction",
        locked: false,
        order: 1,
      },
      {
        title: "Phase III",
        description: undefined,
        locked: true,
        order: 2,
      },
      {
        title: "Phase IV",
        description: undefined,
        locked: true,
        order: 3,
      },
      {
        title: "Phase V",
        description: undefined,
        locked: true,
        order: 4,
      },
    ];

    const insertedIds = [];
    for (const phase of defaultPhases) {
      const id = await ctx.db.insert("phaseCards", {
        ...phase,
        createdAt: now,
        updatedAt: now,
      });
      insertedIds.push(id);
    }

    return {
      message: "Default phase cards initialized",
      initialized: true,
      count: insertedIds.length,
      ids: insertedIds,
    };
  },
});

/**
 * Bulk update all phase cards
 * Useful for admin interface mass edits
 */
export const bulkUpdatePhaseCards = mutation({
  args: {
    updates: v.array(
      v.object({
        id: v.id("phaseCards"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        locked: v.optional(v.boolean()),
        order: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const updatedIds = [];

    for (const update of args.updates) {
      const { id, ...fields } = update;

      const card = await ctx.db.get(id);
      if (!card) {
        console.warn(`Phase card ${id} not found, skipping`);
        continue;
      }

      const updateData: any = { updatedAt: now };
      if (fields.title !== undefined) updateData.title = fields.title;
      if (fields.description !== undefined) updateData.description = fields.description;
      if (fields.locked !== undefined) updateData.locked = fields.locked;
      if (fields.order !== undefined) updateData.order = fields.order;

      await ctx.db.patch(id, updateData);
      updatedIds.push(id);
    }

    return {
      success: true,
      updatedCount: updatedIds.length,
      ids: updatedIds,
    };
  },
});
