import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get all spells
export const getAllSpells = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("spells").collect();
  },
});

// Get active spells only
export const getActiveSpells = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("spells")
      .withIndex("", (q: any) => q.eq("isActive", true))
      .collect();
  },
});

// Get spells by category
export const getSpellsByCategory = query({
  args: {
    category: v.union(
      v.literal("offensive"),
      v.literal("defensive"),
      v.literal("utility"),
      v.literal("ultimate")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("spells")
      .withIndex("", (q: any) => q.eq("category", args.category))
      .collect();
  },
});

// Get a single spell
export const getSpell = query({
  args: {
    id: v.id("spells"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Save or update a spell
export const saveSpell = mutation({
  args: {
    id: v.optional(v.id("spells")),
    name: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("offensive"),
      v.literal("defensive"),
      v.literal("utility"),
      v.literal("ultimate")
    ),
    manaCost: v.number(),
    cooldown: v.number(),
    castTime: v.number(),
    range: v.number(),
    effects: v.array(v.object({
      type: v.union(
        v.literal("damage"),
        v.literal("heal"),
        v.literal("buff"),
        v.literal("debuff"),
        v.literal("summon"),
        v.literal("aoe"),
        v.literal("dot"),
        v.literal("hot"),
        v.literal("shield"),
        v.literal("stun"),
        v.literal("slow"),
        v.literal("speed")
      ),
      value: v.number(),
      duration: v.optional(v.number()),
      radius: v.optional(v.number()),
      tickRate: v.optional(v.number()),
    })),
    visuals: v.object({
      particleType: v.union(
        v.literal("fire"),
        v.literal("ice"),
        v.literal("lightning"),
        v.literal("nature"),
        v.literal("arcane"),
        v.literal("shadow"),
        v.literal("holy"),
        v.literal("physical")
      ),
      particleCount: v.number(),
      particleSpeed: v.number(),
      particleSize: v.number(),
      color1: v.string(),
      color2: v.string(),
      color3: v.optional(v.string()),
      emissionPattern: v.union(
        v.literal("burst"),
        v.literal("stream"),
        v.literal("spiral"),
        v.literal("rain"),
        v.literal("orbit"),
        v.literal("wave")
      ),
      trailEffect: v.boolean(),
      glowIntensity: v.number(),
    }),
    soundEffect: v.optional(v.string()),
    icon: v.optional(v.string()),
    requiredLevel: v.number(),
    requiredClass: v.optional(v.string()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { id, ...spellData } = args;
    
    if (id) {
      // Update existing spell
      await ctx.db.patch(id, {
        ...spellData,
        updatedAt: Date.now(),
      });
      return id;
    } else {
      // Create new spell
      return await ctx.db.insert("spells", {
        ...spellData,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

// Delete a spell
export const deleteSpell = mutation({
  args: {
    id: v.id("spells"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Get spells suitable for a specific level
export const getSpellsForLevel = query({
  args: {
    level: v.number(),
  },
  handler: async (ctx, args) => {
    const allSpells = await ctx.db
      .query("spells")
      .withIndex("", (q: any) => q.eq("isActive", true))
      .collect();
    
    // Filter spells that the player can use at this level
    return allSpells.filter(spell => spell.requiredLevel <= args.level);
  },
});

// Batch create sample spells
export const createSampleSpells = mutation({
  args: {},
  handler: async (ctx) => {
    const sampleSpells = [
      {
        name: "Fireball",
        description: "Launches a blazing orb of fire that explodes on impact",
        category: "offensive" as const,
        manaCost: 20,
        cooldown: 3,
        castTime: 1.5,
        range: 15,
        effects: [
          { type: "damage" as const, value: 75 },
          { type: "aoe" as const, value: 25, radius: 3 }
        ],
        visuals: {
          particleType: "fire" as const,
          particleCount: 100,
          particleSpeed: 8,
          particleSize: 1.5,
          color1: "#ff6b35",
          color2: "#ff9558",
          color3: "#ffc93c",
          emissionPattern: "burst" as const,
          trailEffect: true,
          glowIntensity: 0.7,
        },
        requiredLevel: 1,
        isActive: true,
      },
      {
        name: "Frost Shield",
        description: "Surrounds the caster with protective ice crystals",
        category: "defensive" as const,
        manaCost: 15,
        cooldown: 8,
        castTime: 0.5,
        range: 0,
        effects: [
          { type: "shield" as const, value: 100, duration: 10 },
          { type: "slow" as const, value: 30, duration: 3, radius: 5 }
        ],
        visuals: {
          particleType: "ice" as const,
          particleCount: 75,
          particleSpeed: 3,
          particleSize: 2,
          color1: "#60a5fa",
          color2: "#93c5fd",
          color3: "#dbeafe",
          emissionPattern: "orbit" as const,
          trailEffect: false,
          glowIntensity: 0.4,
        },
        requiredLevel: 3,
        isActive: true,
      },
      {
        name: "Lightning Strike",
        description: "Calls down a bolt of lightning to strike a target",
        category: "offensive" as const,
        manaCost: 30,
        cooldown: 5,
        castTime: 0.2,
        range: 20,
        effects: [
          { type: "damage" as const, value: 120 },
          { type: "stun" as const, value: 1, duration: 1.5 }
        ],
        visuals: {
          particleType: "lightning" as const,
          particleCount: 50,
          particleSpeed: 20,
          particleSize: 0.8,
          color1: "#fbbf24",
          color2: "#fde047",
          color3: "#ffffff",
          emissionPattern: "stream" as const,
          trailEffect: true,
          glowIntensity: 0.9,
        },
        requiredLevel: 5,
        isActive: true,
      },
      {
        name: "Healing Wave",
        description: "Restores health to the caster and nearby allies",
        category: "defensive" as const,
        manaCost: 25,
        cooldown: 6,
        castTime: 2,
        range: 10,
        effects: [
          { type: "heal" as const, value: 80 },
          { type: "hot" as const, value: 20, duration: 5, tickRate: 1 }
        ],
        visuals: {
          particleType: "holy" as const,
          particleCount: 60,
          particleSpeed: 4,
          particleSize: 1.2,
          color1: "#fef3c7",
          color2: "#fde68a",
          color3: "#fbbf24",
          emissionPattern: "wave" as const,
          trailEffect: false,
          glowIntensity: 0.6,
        },
        requiredLevel: 2,
        isActive: true,
      },
      {
        name: "Meteor Storm",
        description: "Summons a devastating barrage of meteors from the sky",
        category: "ultimate" as const,
        manaCost: 100,
        cooldown: 30,
        castTime: 3,
        range: 25,
        effects: [
          { type: "damage" as const, value: 200 },
          { type: "aoe" as const, value: 100, radius: 8 },
          { type: "dot" as const, value: 25, duration: 5, tickRate: 1 }
        ],
        visuals: {
          particleType: "fire" as const,
          particleCount: 200,
          particleSpeed: 15,
          particleSize: 3,
          color1: "#dc2626",
          color2: "#ff6b35",
          color3: "#fbbf24",
          emissionPattern: "rain" as const,
          trailEffect: true,
          glowIntensity: 1,
        },
        requiredLevel: 10,
        isActive: true,
      },
    ];

    // Create each sample spell
    const createdIds = [];
    for (const spell of sampleSpells) {
      const id = await ctx.db.insert("spells", {
        ...spell,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      createdIds.push(id);
    }

    return createdIds;
  },
});

// Toggle spell active status
export const toggleSpellActive = mutation({
  args: {
    id: v.id("spells"),
  },
  handler: async (ctx, args) => {
    const spell = await ctx.db.get(args.id);
    if (!spell) {
      throw new Error("Spell not found");
    }
    
    await ctx.db.patch(args.id, {
      isActive: !spell.isActive,
      updatedAt: Date.now(),
    });
    
    return !spell.isActive;
  },
});

// Duplicate a spell
export const duplicateSpell = mutation({
  args: {
    id: v.id("spells"),
  },
  handler: async (ctx, args) => {
    const spell = await ctx.db.get(args.id);
    if (!spell) {
      throw new Error("Spell not found");
    }
    
    // Remove id and timestamps, add "Copy" to name
    const { _id, _creationTime, createdAt, updatedAt, ...spellData } = spell;
    
    return await ctx.db.insert("spells", {
      ...spellData,
      name: `${spellData.name} (Copy)`,
      isActive: false, // Start copies as inactive
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});