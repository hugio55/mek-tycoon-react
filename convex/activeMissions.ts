import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Query to get all active missions
export const getActiveMissions = query({
  args: {},
  handler: async (ctx) => {
    const missions = await ctx.db
      .query("activeMissions")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Filter out expired missions
    const now = Date.now();
    const activeMissions = missions.filter(mission => {
      const endTime = mission.startTime + mission.duration;
      return endTime > now;
    });

    // Note: Expired missions should be updated via a separate mutation
    // Cannot update from within a query

    return activeMissions;
  },
});

// Query to get a specific active mission by node ID
export const getActiveMissionByNodeId = query({
  args: { nodeId: v.string() },
  handler: async (ctx, args) => {
    const mission = await ctx.db
      .query("activeMissions")
      .filter((q) =>
        q.and(
          q.eq(q.field("nodeId"), args.nodeId),
          q.eq(q.field("status"), "active")
        )
      )
      .first();

    if (!mission) return null;

    // Check if mission is expired
    const now = Date.now();
    const endTime = mission.startTime + mission.duration;

    if (endTime <= now) {
      // Mission expired (should be marked as completed via mutation)
      return null;
    }

    return mission;
  },
});

// Mutation to start a new mission
export const startMission = mutation({
  args: {
    nodeId: v.string(),
    nodeType: v.string(),
    nodeName: v.string(),
    duration: v.number(), // Duration in milliseconds
    contractFee: v.number(),
    expectedRewards: v.object({
      gold: v.optional(v.number()),
      essence: v.optional(v.number()),
      chipT1: v.optional(v.number()),
      special: v.optional(v.number()),
    }),
    selectedMeks: v.array(v.object({
      id: v.string(),
      name: v.string(),
      rank: v.number(),
      matchedTraits: v.optional(v.array(v.object({
        id: v.string(),
        name: v.string(),
        image: v.string(),
        bonus: v.string(),
      }))),
    })),
    difficulty: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if there's already an active mission for this node
    const existingMission = await ctx.db
      .query("activeMissions")
      .filter((q) =>
        q.and(
          q.eq(q.field("nodeId"), args.nodeId),
          q.eq(q.field("status"), "active")
        )
      )
      .first();

    if (existingMission) {
      throw new Error("Mission already active for this node");
    }

    // Create new mission
    const missionId = await ctx.db.insert("activeMissions", {
      nodeId: args.nodeId,
      nodeType: args.nodeType,
      nodeName: args.nodeName,
      startTime: Date.now(),
      duration: args.duration,
      contractFee: args.contractFee,
      expectedRewards: args.expectedRewards,
      selectedMeks: args.selectedMeks,
      difficulty: args.difficulty,
      status: "active",
    });

    return missionId;
  },
});

// Debug: Force clear all active missions
export const forceCleanupMissions = mutation({
  args: {},
  handler: async (ctx) => {
    const missions = await ctx.db
      .query("activeMissions")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    let cleanedCount = 0;
    for (const mission of missions) {
      await ctx.db.patch(mission._id, { status: "cancelled" });
      cleanedCount++;
    }

    return { cleanedCount, message: `Cleaned ${cleanedCount} stuck missions` };
  },
});

// Mutation to cancel an active mission
export const cancelMission = mutation({
  args: {
    nodeId: v.string(),
  },
  handler: async (ctx, args) => {
    const mission = await ctx.db
      .query("activeMissions")
      .filter((q) =>
        q.and(
          q.eq(q.field("nodeId"), args.nodeId),
          q.eq(q.field("status"), "active")
        )
      )
      .first();

    if (!mission) {
      throw new Error("No active mission found for this node");
    }

    // Mark mission as cancelled
    await ctx.db.patch(mission._id, {
      status: "cancelled",
      cancelledAt: Date.now(),
    });

    return { success: true };
  },
});

// Mutation to complete a mission (when timer expires naturally)
export const completeMission = mutation({
  args: {
    nodeId: v.string(),
  },
  handler: async (ctx, args) => {
    const mission = await ctx.db
      .query("activeMissions")
      .filter((q) =>
        q.and(
          q.eq(q.field("nodeId"), args.nodeId),
          q.eq(q.field("status"), "active")
        )
      )
      .first();

    if (!mission) {
      throw new Error("No active mission found for this node");
    }

    // Mark mission as completed
    await ctx.db.patch(mission._id, {
      status: "completed",
      completedAt: Date.now(),
    });

    // TODO: Grant rewards to the player

    return { success: true, rewards: mission.expectedRewards };
  },
});