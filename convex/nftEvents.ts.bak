import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ==========================================
// QUERIES
// ==========================================

// Get all events with optional filters
export const getAllEvents = query({
  args: {
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("archived")
    )),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("nftEvents");

    // Apply filters
    if (args.status) {
      query = query.withIndex("", (q: any) => q.eq("status", args.status));
    } else if (args.isActive !== undefined) {
      query = query.withIndex("", (q: any) => q.eq("isActive", args.isActive));
    }

    const events = await query.collect();

    // Sort by event number descending (newest first)
    return events.sort((a, b) => b.eventNumber - a.eventNumber);
  },
});

// Get event by ID
export const getEventById = query({
  args: { eventId: v.id("nftEvents") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    return event;
  },
});

// Get event by event number
export const getEventByNumber = query({
  args: { eventNumber: v.number() },
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("nftEvents")
      .withIndex("", (q: any) => q.eq("eventNumber", args.eventNumber))
      .first();

    return event;
  },
});

// Get event by slug
export const getEventBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("nftEvents")
      .withIndex("", (q: any) => q.eq("eventSlug", args.slug))
      .first();

    return event;
  },
});

// Get event with all its variations
export const getEventWithVariations = query({
  args: { eventId: v.id("nftEvents") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) return null;

    const variations = await ctx.db
      .query("nftVariations")
      .withIndex("", (q: any) => q.eq("eventId", args.eventId))
      .collect();

    // Sort by display order (easy, medium, hard)
    const sortedVariations = variations.sort((a, b) => a.displayOrder - b.displayOrder);

    return {
      ...event,
      variations: sortedVariations,
    };
  },
});

// Get event statistics
export const getEventStats = query({
  args: { eventId: v.id("nftEvents") },
  handler: async (ctx, args) => {
    // Get all variations for this event
    const variations = await ctx.db
      .query("nftVariations")
      .withIndex("", (q: any) => q.eq("eventId", args.eventId))
      .collect();

    // Get all purchases for this event
    const purchases = await ctx.db
      .query("nftPurchases")
      .withIndex("", (q: any) => q.eq("eventId", args.eventId))
      .collect();

    // Calculate statistics
    const totalSupply = variations.reduce((sum, v) => sum + v.supplyTotal, 0);
    const totalMinted = variations.reduce((sum, v) => sum + v.supplyMinted, 0);
    const totalRemaining = variations.reduce((sum, v) => sum + v.supplyRemaining, 0);

    const totalRevenue = purchases
      .filter((p: any) => p.status === "completed")
      .reduce((sum, p) => sum + p.priceAda, 0);

    const uniqueBuyers = new Set(purchases.map((p: any) => p.walletAddress)).size;

    return {
      totalSupply,
      totalMinted,
      totalRemaining,
      totalRevenue,
      totalPurchases: purchases.length,
      uniqueBuyers,
      completionRate: totalSupply > 0 ? (totalMinted / totalSupply) * 100 : 0,
    };
  },
});

// ==========================================
// MUTATIONS
// ==========================================

// Create new event
export const createEvent = mutation({
  args: {
    eventNumber: v.number(),
    eventName: v.string(),
    eventSlug: v.string(),
    storyNodeId: v.optional(v.string()),
    storyContext: v.optional(v.string()),
    nmkrProjectId: v.optional(v.string()),
    nmkrProjectName: v.optional(v.string()),
    createdBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if event number already exists
    const existing = await ctx.db
      .query("nftEvents")
      .withIndex("", (q: any) => q.eq("eventNumber", args.eventNumber))
      .first();

    if (existing) {
      throw new Error(`Event number ${args.eventNumber} already exists`);
    }

    const now = Date.now();

    const eventId = await ctx.db.insert("nftEvents", {
      eventNumber: args.eventNumber,
      eventName: args.eventName,
      eventSlug: args.eventSlug,
      storyNodeId: args.storyNodeId,
      storyContext: args.storyContext,
      status: "draft", // Start as draft
      isActive: false, // Start inactive
      nmkrProjectId: args.nmkrProjectId,
      nmkrProjectName: args.nmkrProjectName,
      createdAt: now,
      updatedAt: now,
      createdBy: args.createdBy,
    });

    return eventId;
  },
});

// Update event
export const updateEvent = mutation({
  args: {
    eventId: v.id("nftEvents"),
    eventName: v.optional(v.string()),
    eventSlug: v.optional(v.string()),
    storyNodeId: v.optional(v.string()),
    storyContext: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("archived")
    )),
    isActive: v.optional(v.boolean()),
    nmkrProjectId: v.optional(v.string()),
    nmkrProjectName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { eventId, ...updates } = args;

    const event = await ctx.db.get(eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    await ctx.db.patch(eventId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return eventId;
  },
});

// Toggle event active status
export const toggleEventActive = mutation({
  args: {
    eventId: v.id("nftEvents"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    await ctx.db.patch(args.eventId, {
      isActive: !event.isActive,
      updatedAt: Date.now(),
    });

    return { success: true, newStatus: !event.isActive };
  },
});

// Archive event
export const archiveEvent = mutation({
  args: {
    eventId: v.id("nftEvents"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    await ctx.db.patch(args.eventId, {
      status: "archived",
      isActive: false,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Delete event (and all associated data)
export const deleteEvent = mutation({
  args: {
    eventId: v.id("nftEvents"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Check if there are any purchases
    const purchases = await ctx.db
      .query("nftPurchases")
      .withIndex("", (q: any) => q.eq("eventId", args.eventId))
      .first();

    if (purchases) {
      throw new Error("Cannot delete event with existing purchases. Archive instead.");
    }

    // Delete all variations
    const variations = await ctx.db
      .query("nftVariations")
      .withIndex("", (q: any) => q.eq("eventId", args.eventId))
      .collect();

    for (const variation of variations) {
      await ctx.db.delete(variation._id);
    }

    // Delete the event
    await ctx.db.delete(args.eventId);

    return { success: true };
  },
});
