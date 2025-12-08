import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List all saved slot configurations
export const listSlotConfigurations = query({
  args: {},
  handler: async (ctx) => {
    const configs = await ctx.db.query("slotConfigurations").collect();
    return configs.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

// Get the currently active configuration
export const getActiveConfiguration = query({
  args: {},
  handler: async (ctx) => {
    const active = await ctx.db
      .query("slotConfigurations")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();
    return active;
  },
});

// Save a slot configuration
export const saveSlotConfiguration = mutation({
  args: {
    name: v.string(),
    basicSlot: v.array(v.number()),
    advancedSlot: v.array(v.number()),
    masterSlot: v.array(v.number()),
    curveFactor: v.number(),
    roundingOption: v.number(),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { name, basicSlot, advancedSlot, masterSlot, curveFactor, roundingOption, isActive } = args;
    const now = Date.now();

    // If setting as active, deactivate others
    if (isActive) {
      const activeConfigs = await ctx.db
        .query("slotConfigurations")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .collect();

      for (const config of activeConfigs) {
        await ctx.db.patch(config._id, { isActive: false });
      }
    }

    const id = await ctx.db.insert("slotConfigurations", {
      name,
      basicSlot,
      advancedSlot,
      masterSlot,
      curveFactor,
      roundingOption,
      isActive: isActive ?? false,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, id };
  },
});

// Load a specific slot configuration (set it as active)
export const loadSlotConfiguration = mutation({
  args: {
    configId: v.id("slotConfigurations"),
  },
  handler: async (ctx, args) => {
    const config = await ctx.db.get(args.configId);
    if (!config) {
      throw new Error("Configuration not found");
    }

    // Deactivate all other configs
    const activeConfigs = await ctx.db
      .query("slotConfigurations")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    for (const c of activeConfigs) {
      await ctx.db.patch(c._id, { isActive: false });
    }

    // Activate the selected config
    await ctx.db.patch(args.configId, { isActive: true });

    return config;
  },
});

// Update an existing configuration
export const updateSlotConfiguration = mutation({
  args: {
    configId: v.id("slotConfigurations"),
    name: v.optional(v.string()),
    basicSlot: v.optional(v.array(v.number())),
    advancedSlot: v.optional(v.array(v.number())),
    masterSlot: v.optional(v.array(v.number())),
    curveFactor: v.optional(v.number()),
    roundingOption: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { configId, isActive, ...updates } = args;
    const now = Date.now();

    // If setting as active, deactivate others
    if (isActive) {
      const activeConfigs = await ctx.db
        .query("slotConfigurations")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .collect();

      for (const config of activeConfigs) {
        if (config._id !== configId) {
          await ctx.db.patch(config._id, { isActive: false });
        }
      }
    }

    const patchData: Record<string, unknown> = { updatedAt: now };
    if (updates.name !== undefined) patchData.name = updates.name;
    if (updates.basicSlot !== undefined) patchData.basicSlot = updates.basicSlot;
    if (updates.advancedSlot !== undefined) patchData.advancedSlot = updates.advancedSlot;
    if (updates.masterSlot !== undefined) patchData.masterSlot = updates.masterSlot;
    if (updates.curveFactor !== undefined) patchData.curveFactor = updates.curveFactor;
    if (updates.roundingOption !== undefined) patchData.roundingOption = updates.roundingOption;
    if (isActive !== undefined) patchData.isActive = isActive;

    await ctx.db.patch(configId, patchData);

    return { success: true };
  },
});

// Delete a slot configuration
export const deleteSlotConfiguration = mutation({
  args: {
    configId: v.id("slotConfigurations"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.configId);
    return { success: true };
  },
});
