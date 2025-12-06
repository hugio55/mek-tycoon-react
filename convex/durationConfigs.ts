import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Type for duration time object
const durationTimeSchema = v.object({
  days: v.number(),
  hours: v.number(),
  minutes: v.number(),
  seconds: v.number(),
});

// Type for node duration settings
const nodeDurationSchema = v.object({
  min: durationTimeSchema,
  max: durationTimeSchema,
  curve: v.number(),
});

// Save a new duration configuration
export const saveDurationConfig = mutation({
  args: {
    name: v.string(),
    normal: nodeDurationSchema,
    challenger: nodeDurationSchema,
    miniboss: nodeDurationSchema,
    event: nodeDurationSchema,
    finalboss: nodeDurationSchema,
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if a config with this name already exists
    const existing = await ctx.db
      .query("durationConfigs")
      .withIndex("by_name", q => q.eq("name", args.name))
      .first();

    if (existing) {
      throw new Error(`Configuration "${args.name}" already exists. Use update instead.`);
    }

    // Create new configuration
    const configId = await ctx.db.insert("durationConfigs", {
      name: args.name,
      isActive: false,
      normal: args.normal,
      challenger: args.challenger,
      miniboss: args.miniboss,
      event: args.event,
      finalboss: args.finalboss,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, configId };
  },
});

// Update an existing duration configuration
export const updateDurationConfig = mutation({
  args: {
    name: v.string(),
    normal: nodeDurationSchema,
    challenger: nodeDurationSchema,
    miniboss: nodeDurationSchema,
    event: nodeDurationSchema,
    finalboss: nodeDurationSchema,
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Find the existing configuration
    const existing = await ctx.db
      .query("durationConfigs")
      .withIndex("by_name", q => q.eq("name", args.name))
      .first();

    if (!existing) {
      throw new Error(`Configuration "${args.name}" not found. Use save to create it.`);
    }

    // Update the configuration
    await ctx.db.patch(existing._id, {
      normal: args.normal,
      challenger: args.challenger,
      miniboss: args.miniboss,
      event: args.event,
      finalboss: args.finalboss,
      updatedAt: now,
    });

    return { success: true, configId: existing._id };
  },
});

// Load a duration configuration by name
export const loadDurationConfig = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("durationConfigs")
      .withIndex("by_name", q => q.eq("name", args.name))
      .first();

    return config;
  },
});

// Get all available duration configurations
export const listDurationConfigs = query({
  args: {},
  handler: async (ctx) => {
    const configs = await ctx.db
      .query("durationConfigs")
      .order("desc")
      .collect();

    return configs.map((config: any) => ({
      name: config.name,
      isActive: config.isActive,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
      deployedAt: config.deployedAt,
    }));
  },
});

// Deploy a configuration to Story Climb (make it active)
export const deployDurationConfig = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Find the configuration to deploy
    const configToDeploy = await ctx.db
      .query("durationConfigs")
      .withIndex("by_name", q => q.eq("name", args.name))
      .first();

    if (!configToDeploy) {
      throw new Error(`Configuration "${args.name}" not found.`);
    }

    // Deactivate any currently active configuration
    const currentActive = await ctx.db
      .query("durationConfigs")
      .withIndex("by_active", q => q.eq("isActive", true))
      .collect();

    for (const config of currentActive) {
      await ctx.db.patch(config._id, {
        isActive: false,
        updatedAt: now,
      });
    }

    // Activate the selected configuration
    await ctx.db.patch(configToDeploy._id, {
      isActive: true,
      deployedAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      message: `Configuration "${args.name}" has been deployed to Story Climb.`
    };
  },
});

// Get the currently active duration configuration
export const getActiveDurationConfig = query({
  args: {},
  handler: async (ctx) => {
    const activeConfig = await ctx.db
      .query("durationConfigs")
      .withIndex("by_active", q => q.eq("isActive", true))
      .first();

    if (!activeConfig) return null;

    // Return the full configuration with min/max/curve for client-side interpolation
    return {
      normal: activeConfig.normal,
      challenger: activeConfig.challenger,
      event: activeConfig.event,
      miniboss: activeConfig.miniboss,
      finalboss: activeConfig.finalboss,
    };
  },
});

// Delete a duration configuration
export const deleteDurationConfig = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    // Find the configuration
    const config = await ctx.db
      .query("durationConfigs")
      .withIndex("by_name", q => q.eq("name", args.name))
      .first();

    if (!config) {
      throw new Error(`Configuration "${args.name}" not found.`);
    }

    if (config.isActive) {
      throw new Error(`Cannot delete active configuration "${args.name}". Deploy a different configuration first.`);
    }

    await ctx.db.delete(config._id);

    return { success: true, message: `Configuration "${args.name}" deleted.` };
  },
});