import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================
// JOB UMBRELLAS
// ============================================

// Get all umbrellas
export const getUmbrellas = query({
  args: {},
  handler: async (ctx) => {
    const umbrellas = await ctx.db
      .query("jobUmbrellas")
      .withIndex("by_active")
      .collect();
    return umbrellas.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  },
});

// Get active umbrellas only
export const getActiveUmbrellas = query({
  args: {},
  handler: async (ctx) => {
    const umbrellas = await ctx.db
      .query("jobUmbrellas")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    return umbrellas.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  },
});

// Create a new umbrella
export const createUmbrella = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get current max sort order
    const existing = await ctx.db.query("jobUmbrellas").collect();
    const maxSort = existing.reduce((max, u) => Math.max(max, u.sortOrder ?? 0), 0);

    const now = Date.now();
    return await ctx.db.insert("jobUmbrellas", {
      name: args.name,
      description: args.description,
      icon: args.icon,
      color: args.color,
      sortOrder: maxSort + 1,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update an umbrella
export const updateUmbrella = mutation({
  args: {
    id: v.id("jobUmbrellas"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    return await ctx.db.patch(id, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
  },
});

// Delete an umbrella (and optionally reassign jobs)
export const deleteUmbrella = mutation({
  args: {
    id: v.id("jobUmbrellas"),
  },
  handler: async (ctx, args) => {
    // First, update any jobs that reference this umbrella to be one-offs
    const jobs = await ctx.db
      .query("jobTypes")
      .withIndex("by_umbrella", (q) => q.eq("umbrellaId", args.id))
      .collect();

    for (const job of jobs) {
      await ctx.db.patch(job._id, {
        isOneOff: true,
        umbrellaId: undefined,
        updatedAt: Date.now(),
      });
    }

    return await ctx.db.delete(args.id);
  },
});

// ============================================
// JOB TYPES
// ============================================

// Get all jobs
export const getJobs = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("jobTypes").collect();
  },
});

// Get active jobs only
export const getActiveJobs = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("jobTypes")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

// Get jobs by umbrella
export const getJobsByUmbrella = query({
  args: {
    umbrellaId: v.id("jobUmbrellas"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("jobTypes")
      .withIndex("by_umbrella", (q) => q.eq("umbrellaId", args.umbrellaId))
      .collect();
  },
});

// Get one-off jobs only
export const getOneOffJobs = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("jobTypes")
      .withIndex("by_one_off", (q) => q.eq("isOneOff", true))
      .collect();
  },
});

// Get jobs with their umbrella data
export const getJobsWithUmbrellas = query({
  args: {},
  handler: async (ctx) => {
    const jobs = await ctx.db.query("jobTypes").collect();
    const umbrellas = await ctx.db.query("jobUmbrellas").collect();

    const umbrellaMap = new Map(umbrellas.map(u => [u._id, u]));

    return jobs.map(job => ({
      ...job,
      umbrella: job.umbrellaId ? umbrellaMap.get(job.umbrellaId) : null,
    }));
  },
});

// Create a new job
export const createJob = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    isOneOff: v.boolean(),
    umbrellaId: v.optional(v.id("jobUmbrellas")),
    baseGoldPerHour: v.number(),
    attaboyMin: v.number(),
    attaboyMax: v.number(),
    pitStopCount: v.number(),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    tier: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("jobTypes", {
      name: args.name,
      description: args.description,
      isOneOff: args.isOneOff,
      umbrellaId: args.isOneOff ? undefined : args.umbrellaId,
      baseGoldPerHour: args.baseGoldPerHour,
      attaboyMin: args.attaboyMin,
      attaboyMax: args.attaboyMax,
      pitStopCount: args.pitStopCount,
      icon: args.icon,
      color: args.color,
      tier: args.tier,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update a job
export const updateJob = mutation({
  args: {
    id: v.id("jobTypes"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isOneOff: v.optional(v.boolean()),
    umbrellaId: v.optional(v.id("jobUmbrellas")),
    baseGoldPerHour: v.optional(v.number()),
    attaboyMin: v.optional(v.number()),
    attaboyMax: v.optional(v.number()),
    pitStopCount: v.optional(v.number()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    tier: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // If switching to one-off, remove umbrella reference
    if (updates.isOneOff === true) {
      updates.umbrellaId = undefined;
    }

    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    return await ctx.db.patch(id, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
  },
});

// Delete a job
export const deleteJob = mutation({
  args: {
    id: v.id("jobTypes"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});

// Toggle job active status
export const toggleJobActive = mutation({
  args: {
    id: v.id("jobTypes"),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.id);
    if (!job) throw new Error("Job not found");

    return await ctx.db.patch(args.id, {
      isActive: !job.isActive,
      updatedAt: Date.now(),
    });
  },
});

// Seed mining profession jobs
export const seedMiningJobs = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Check if Mining umbrella already exists
    const umbrellas = await ctx.db.query("jobUmbrellas").collect();
    let miningUmbrella = umbrellas.find(u => u.name === "Mining");

    // Create Mining umbrella if it doesn't exist
    if (!miningUmbrella) {
      const maxSort = umbrellas.reduce((max, u) => Math.max(max, u.sortOrder ?? 0), 0);
      const umbrellaId = await ctx.db.insert("jobUmbrellas", {
        name: "Mining",
        description: "Resource extraction professions",
        icon: "⛏️",
        color: "amber",
        sortOrder: maxSort + 1,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      miningUmbrella = await ctx.db.get(umbrellaId);
    }

    if (!miningUmbrella) {
      throw new Error("Failed to create/find Mining umbrella");
    }

    // Check which jobs already exist
    const existingJobs = await ctx.db.query("jobTypes").collect();
    const existingNames = new Set(existingJobs.map(j => j.name));

    const minerJobs = [
      {
        name: "Slag Miner",
        description: "Extracts low-value refuse and slag from mine tunnels",
        tier: "tier1",
        baseGoldPerHour: 10,
        attaboyMin: 5,
        attaboyMax: 25,
        pitStopCount: 3,
      },
      {
        name: "Ore Miner",
        description: "Skilled at extracting valuable metal ores",
        tier: "tier2",
        baseGoldPerHour: 25,
        attaboyMin: 15,
        attaboyMax: 50,
        pitStopCount: 5,
      },
      {
        name: "Gem Miner",
        description: "Master at locating and extracting precious stones",
        tier: "tier3",
        baseGoldPerHour: 50,
        attaboyMin: 30,
        attaboyMax: 100,
        pitStopCount: 8,
      },
    ];

    const created: string[] = [];
    const skipped: string[] = [];

    for (const job of minerJobs) {
      if (existingNames.has(job.name)) {
        skipped.push(job.name);
        continue;
      }

      await ctx.db.insert("jobTypes", {
        name: job.name,
        description: job.description,
        isOneOff: false,
        umbrellaId: miningUmbrella._id,
        baseGoldPerHour: job.baseGoldPerHour,
        attaboyMin: job.attaboyMin,
        attaboyMax: job.attaboyMax,
        pitStopCount: job.pitStopCount,
        tier: job.tier,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      created.push(job.name);
    }

    return {
      message: `Mining jobs seeded`,
      created,
      skipped,
      umbrellaCreated: !umbrellas.find(u => u.name === "Mining"),
    };
  },
});
