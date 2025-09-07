import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Create a new chip definition
export const createChipDefinition = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("attack"),
      v.literal("defense"),
      v.literal("utility"),
      v.literal("economy"),
      v.literal("special")
    ),
    tier: v.number(), // 1-7
    imageUrl: v.optional(v.string()),
    possibleBuffs: v.array(v.object({
      buffType: v.string(),
      minValue: v.number(),
      maxValue: v.number(),
      weight: v.number(),
    })),
    rankScaling: v.record(v.string(), v.object({
      buffMultiplier: v.number(),
      rollChances: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const chipId = await ctx.db.insert("chipDefinitions", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return chipId;
  },
});

// Update an existing chip definition
export const updateChipDefinition = mutation({
  args: {
    id: v.id("chipDefinitions"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.union(
      v.literal("attack"),
      v.literal("defense"),
      v.literal("utility"),
      v.literal("economy"),
      v.literal("special")
    )),
    tier: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
    possibleBuffs: v.optional(v.array(v.object({
      buffType: v.string(),
      minValue: v.number(),
      maxValue: v.number(),
      weight: v.number(),
    }))),
    rankScaling: v.optional(v.record(v.string(), v.object({
      buffMultiplier: v.number(),
      rollChances: v.number(),
    }))),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Delete a chip definition
export const deleteChipDefinition = mutation({
  args: {
    id: v.id("chipDefinitions"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Get all chip definitions
export const getAllChipDefinitions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("chipDefinitions").collect();
  },
});

// Get chip definitions by tier
export const getChipDefinitionsByTier = query({
  args: {
    tier: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chipDefinitions")
      .filter((q) => q.eq(q.field("tier"), args.tier))
      .collect();
  },
});

// Get chip definitions by category
export const getChipDefinitionsByCategory = query({
  args: {
    category: v.union(
      v.literal("attack"),
      v.literal("defense"),
      v.literal("utility"),
      v.literal("economy"),
      v.literal("special")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chipDefinitions")
      .filter((q) => q.eq(q.field("category"), args.category))
      .collect();
  },
});

// Create a chip instance for a user (when they craft/obtain a chip)
export const createChipInstance = mutation({
  args: {
    userId: v.id("users"),
    chipDefinitionId: v.id("chipDefinitions"),
    rank: v.string(), // D, C, B, A, S, SS, SSS, X, XX, XXX
    rolledBuffs: v.array(v.object({
      buffType: v.string(),
      value: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const instanceId = await ctx.db.insert("chipInstances", {
      ...args,
      equipped: false,
      equippedToMek: undefined,
      createdAt: Date.now(),
    });
    return instanceId;
  },
});

// Equip a chip to a Mek
export const equipChip = mutation({
  args: {
    chipInstanceId: v.id("chipInstances"),
    mekId: v.id("meks"),
    slot: v.number(), // Slot number (1-3 for example)
  },
  handler: async (ctx, args) => {
    // First, unequip any chip currently in this slot
    const existingChips = await ctx.db
      .query("chipInstances")
      .filter((q) => 
        q.and(
          q.eq(q.field("equippedToMek"), args.mekId),
          q.eq(q.field("equipmentSlot"), args.slot)
        )
      )
      .collect();
    
    for (const chip of existingChips) {
      await ctx.db.patch(chip._id, {
        equipped: false,
        equippedToMek: undefined,
        equipmentSlot: undefined,
      });
    }
    
    // Now equip the new chip
    await ctx.db.patch(args.chipInstanceId, {
      equipped: true,
      equippedToMek: args.mekId,
      equipmentSlot: args.slot,
    });
  },
});

// Unequip a chip
export const unequipChip = mutation({
  args: {
    chipInstanceId: v.id("chipInstances"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.chipInstanceId, {
      equipped: false,
      equippedToMek: undefined,
      equipmentSlot: undefined,
    });
  },
});

// Get all chips owned by a user
export const getUserChips = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const chips = await ctx.db
      .query("chipInstances")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
    
    // Fetch the definitions for each chip
    const chipsWithDefinitions = await Promise.all(
      chips.map(async (chip) => {
        const definition = await ctx.db.get(chip.chipDefinitionId);
        return {
          ...chip,
          definition,
        };
      })
    );
    
    return chipsWithDefinitions;
  },
});

// Get chips equipped to a specific Mek
export const getMekChips = query({
  args: {
    mekId: v.id("meks"),
  },
  handler: async (ctx, args) => {
    const chips = await ctx.db
      .query("chipInstances")
      .filter((q) => q.eq(q.field("equippedToMek"), args.mekId))
      .collect();
    
    // Fetch the definitions for each chip
    const chipsWithDefinitions = await Promise.all(
      chips.map(async (chip) => {
        const definition = await ctx.db.get(chip.chipDefinitionId);
        return {
          ...chip,
          definition,
        };
      })
    );
    
    return chipsWithDefinitions.sort((a, b) => 
      (a.equipmentSlot || 0) - (b.equipmentSlot || 0)
    );
  },
});

// Destroy/sell a chip instance
export const destroyChip = mutation({
  args: {
    chipInstanceId: v.id("chipInstances"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.chipInstanceId);
  },
});