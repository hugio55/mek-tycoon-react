import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List all saved slot configurations
export const listSlotConfigurations = query({
  args: {},
  handler: async (ctx) => {
    // Use adminConfigs table with a type filter for slot configurations
    const configs = await ctx.db
      .query("adminConfigs")
      .filter((q) => q.eq(q.field("configType"), "slotConfiguration"))
      .collect();

    return configs.map((c) => ({
      _id: c._id,
      name: c.configKey,
      data: c.configValue,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  },
});

// Save a slot configuration
export const saveSlotConfiguration = mutation({
  args: {
    name: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const { name, data } = args;
    const now = Date.now();

    // Check if config with this name exists
    const existing = await ctx.db
      .query("adminConfigs")
      .filter((q) =>
        q.and(
          q.eq(q.field("configType"), "slotConfiguration"),
          q.eq(q.field("configKey"), name)
        )
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        configValue: data,
        updatedAt: now,
      });
      return { success: true, id: existing._id };
    } else {
      const id = await ctx.db.insert("adminConfigs", {
        configType: "slotConfiguration",
        configKey: name,
        configValue: data,
        createdAt: now,
        updatedAt: now,
      });
      return { success: true, id };
    }
  },
});

// Load a specific slot configuration
export const loadSlotConfiguration = mutation({
  args: {
    configId: v.id("adminConfigs"),
  },
  handler: async (ctx, args) => {
    const config = await ctx.db.get(args.configId);
    if (!config) {
      throw new Error("Configuration not found");
    }
    return {
      name: config.configKey,
      data: config.configValue,
    };
  },
});

// Delete a slot configuration
export const deleteSlotConfiguration = mutation({
  args: {
    configId: v.id("adminConfigs"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.configId);
    return { success: true };
  },
});
