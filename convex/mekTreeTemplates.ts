import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get all templates
export const getAllTemplates = query({
  handler: async (ctx) => {
    return await ctx.db.query("mekTreeTemplates").collect();
  },
});

// Get a single template by ID
export const getTemplate = query({
  args: { templateId: v.id("mekTreeTemplates") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.templateId);
  },
});

// Get template by name
export const getTemplateByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("mekTreeTemplates")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
  },
});

// Create a new template
export const createTemplate = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    category: v.optional(v.string()),
    nodes: v.array(v.object({
      id: v.string(),
      name: v.string(),
      x: v.number(),
      y: v.number(),
      tier: v.number(),
      desc: v.string(),
      xp: v.number(),
      unlocked: v.optional(v.boolean()),
      nodeType: v.optional(v.union(
        v.literal("stat"),
        v.literal("ability"),
        v.literal("passive"),
        v.literal("special")
      )),
      statBonus: v.optional(v.object({
        health: v.optional(v.number()),
        speed: v.optional(v.number()),
        attack: v.optional(v.number()),
        defense: v.optional(v.number()),
        critChance: v.optional(v.number()),
        critDamage: v.optional(v.number()),
      })),
      abilityId: v.optional(v.string()),
      passiveEffect: v.optional(v.string()),
      buffGrant: v.optional(v.object({
        buffType: v.string(),
        baseValue: v.optional(v.number()),
      })),
    })),
    connections: v.array(v.object({
      from: v.string(),
      to: v.string(),
    })),
    viewportDimensions: v.optional(v.object({
      width: v.number(),
      height: v.number(),
    })),
    viewportPosition: v.optional(v.object({
      x: v.number(),
      y: v.number(),
    })),
    conditions: v.optional(v.object({
      headVariations: v.optional(v.array(v.string())),
      bodyVariations: v.optional(v.array(v.string())),
      traitVariations: v.optional(v.array(v.string())),
      rarityTiers: v.optional(v.array(v.string())),
      powerScoreMin: v.optional(v.number()),
      powerScoreMax: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    // Check if template with this name already exists
    const existing = await ctx.db
      .query("mekTreeTemplates")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
    
    if (existing) {
      throw new Error(`Template with name "${args.name}" already exists`);
    }

    return await ctx.db.insert("mekTreeTemplates", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Update an existing template
export const updateTemplate = mutation({
  args: {
    templateId: v.id("mekTreeTemplates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    nodes: v.optional(v.array(v.object({
      id: v.string(),
      name: v.string(),
      x: v.number(),
      y: v.number(),
      tier: v.number(),
      desc: v.string(),
      xp: v.number(),
      unlocked: v.optional(v.boolean()),
      nodeType: v.optional(v.union(
        v.literal("stat"),
        v.literal("ability"),
        v.literal("passive"),
        v.literal("special")
      )),
      statBonus: v.optional(v.object({
        health: v.optional(v.number()),
        speed: v.optional(v.number()),
        attack: v.optional(v.number()),
        defense: v.optional(v.number()),
        critChance: v.optional(v.number()),
        critDamage: v.optional(v.number()),
      })),
      abilityId: v.optional(v.string()),
      passiveEffect: v.optional(v.string()),
      buffGrant: v.optional(v.object({
        buffType: v.string(),
        baseValue: v.optional(v.number()),
      })),
    }))),
    connections: v.optional(v.array(v.object({
      from: v.string(),
      to: v.string(),
    }))),
    viewportDimensions: v.optional(v.object({
      width: v.number(),
      height: v.number(),
    })),
    viewportPosition: v.optional(v.object({
      x: v.number(),
      y: v.number(),
    })),
    conditions: v.optional(v.object({
      headVariations: v.optional(v.array(v.string())),
      bodyVariations: v.optional(v.array(v.string())),
      traitVariations: v.optional(v.array(v.string())),
      rarityTiers: v.optional(v.array(v.string())),
      powerScoreMin: v.optional(v.number()),
      powerScoreMax: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const { templateId, ...updates } = args;
    
    await ctx.db.patch(templateId, {
      ...updates,
      updatedAt: Date.now(),
    });
    
    return await ctx.db.get(templateId);
  },
});

// Delete a template
export const deleteTemplate = mutation({
  args: { templateId: v.id("mekTreeTemplates") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.templateId);
    return true;
  },
});

// Find the best matching template for a Mek
export const findTemplateForMek = query({
  args: { mekId: v.id("meks") },
  handler: async (ctx, args) => {
    const mek = await ctx.db.get(args.mekId);
    if (!mek) return null;

    const templates = await ctx.db.query("mekTreeTemplates").collect();
    
    // Score each template based on how well it matches the Mek
    let bestTemplate = null;
    let bestScore = -1;

    for (const template of templates) {
      let score = 0;
      const conditions = template.conditions;
      
      if (!conditions) {
        // Template with no conditions is a fallback
        if (score === 0) score = 1;
        continue;
      }

      // Check head variation match
      if (conditions.headVariations?.includes(mek.headVariation)) {
        score += 10;
      }

      // Check body variation match  
      if (conditions.bodyVariations?.includes(mek.bodyVariation)) {
        score += 10;
      }

      // Check trait/item variation match
      if (mek.itemVariation && conditions.traitVariations?.includes(mek.itemVariation)) {
        score += 10;
      }

      // Check rarity tier match
      if (mek.rarityTier && conditions.rarityTiers?.includes(mek.rarityTier)) {
        score += 5;
      }

      // Check power score range
      if (mek.powerScore) {
        const min = conditions.powerScoreMin || 0;
        const max = conditions.powerScoreMax || Infinity;
        if (mek.powerScore >= min && mek.powerScore <= max) {
          score += 3;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestTemplate = template;
      }
    }

    return bestTemplate;
  },
});

// Create default templates (run once to seed the database)
export const createDefaultTemplates = mutation({
  handler: async (ctx) => {
    const templates = [
      {
        name: "Offensive Build",
        description: "Focus on attack power and critical damage",
        category: "offensive",
        nodes: [
          {
            id: "core-gold",
            name: "Gold Path",
            x: 250,
            y: 110,
            tier: 0,
            desc: "Focus on gold generation",
            xp: 0,
          },
          {
            id: "core-essence",
            name: "Essence Path",
            x: 410,
            y: 110,
            tier: 0,
            desc: "Master essence collection",
            xp: 0,
          },
          {
            id: "core-lootder",
            name: "Lootder Path",
            x: 570,
            y: 110,
            tier: 0,
            desc: "Maximize loot drops",
            xp: 0,
          },
          {
            id: "attack-1",
            name: "Basic Attack",
            x: 200,
            y: 150,
            tier: 1,
            desc: "Increase base attack power",
            xp: 50,
            nodeType: "stat" as const,
            statBonus: { attack: 10 },
          },
          {
            id: "crit-1",
            name: "Critical Strike",
            x: 300,
            y: 150,
            tier: 1,
            desc: "Increase critical chance",
            xp: 50,
            nodeType: "stat" as const,
            statBonus: { critChance: 5 },
          },
          {
            id: "attack-2",
            name: "Advanced Attack",
            x: 300,
            y: 250,
            tier: 2,
            desc: "Further increase attack power",
            xp: 100,
            nodeType: "stat" as const,
            statBonus: { attack: 20 },
          },
          {
            id: "crit-2",
            name: "Critical Damage",
            x: 500,
            y: 250,
            tier: 2,
            desc: "Increase critical damage",
            xp: 100,
            nodeType: "stat" as const,
            statBonus: { critDamage: 25 },
          },
          {
            id: "ultimate",
            name: "Berserker Mode",
            x: 400,
            y: 350,
            tier: 3,
            desc: "Ultimate offensive ability",
            xp: 200,
            nodeType: "ability" as const,
            abilityId: "berserker",
          },
        ],
        connections: [
          { from: "core-gold", to: "attack-1" },
          { from: "core-gold", to: "crit-1" },
          { from: "attack-1", to: "attack-2" },
          { from: "crit-1", to: "crit-2" },
          { from: "attack-2", to: "ultimate" },
          { from: "crit-2", to: "ultimate" },
        ],
      },
      {
        name: "Defensive Build",
        description: "Focus on health and damage reduction",
        category: "defensive",
        nodes: [
          {
            id: "start",
            name: "Core",
            x: 400,
            y: 50,
            tier: 0,
            desc: "Mek core systems",
            xp: 0,
          },
          {
            id: "health-1",
            name: "Vitality",
            x: 300,
            y: 150,
            tier: 1,
            desc: "Increase maximum health",
            xp: 50,
            nodeType: "stat" as const,
            statBonus: { health: 50 },
          },
          {
            id: "defense-1",
            name: "Armor",
            x: 500,
            y: 150,
            tier: 1,
            desc: "Increase defense",
            xp: 50,
            nodeType: "stat" as const,
            statBonus: { defense: 10 },
          },
          {
            id: "health-2",
            name: "Enhanced Vitality",
            x: 300,
            y: 250,
            tier: 2,
            desc: "Further increase health",
            xp: 100,
            nodeType: "stat" as const,
            statBonus: { health: 100 },
          },
          {
            id: "defense-2",
            name: "Reinforced Armor",
            x: 500,
            y: 250,
            tier: 2,
            desc: "Further increase defense",
            xp: 100,
            nodeType: "stat" as const,
            statBonus: { defense: 20 },
          },
          {
            id: "shield",
            name: "Energy Shield",
            x: 400,
            y: 350,
            tier: 3,
            desc: "Passive damage reduction",
            xp: 200,
            nodeType: "passive" as const,
            passiveEffect: "Reduce all damage by 15%",
          },
        ],
        connections: [
          { from: "start", to: "health-1" },
          { from: "start", to: "defense-1" },
          { from: "health-1", to: "health-2" },
          { from: "defense-1", to: "defense-2" },
          { from: "health-2", to: "shield" },
          { from: "defense-2", to: "shield" },
        ],
      },
      {
        name: "Speed Build",
        description: "Focus on speed and evasion",
        category: "speed",
        nodes: [
          {
            id: "start",
            name: "Core",
            x: 400,
            y: 50,
            tier: 0,
            desc: "Mek core systems",
            xp: 0,
          },
          {
            id: "speed-1",
            name: "Agility",
            x: 400,
            y: 150,
            tier: 1,
            desc: "Increase movement speed",
            xp: 50,
            nodeType: "stat" as const,
            statBonus: { speed: 10 },
          },
          {
            id: "speed-2",
            name: "Swift Strike",
            x: 300,
            y: 250,
            tier: 2,
            desc: "Attack speed and movement",
            xp: 100,
            nodeType: "stat" as const,
            statBonus: { speed: 15, attack: 5 },
          },
          {
            id: "dodge",
            name: "Evasion",
            x: 500,
            y: 250,
            tier: 2,
            desc: "Chance to dodge attacks",
            xp: 100,
            nodeType: "passive" as const,
            passiveEffect: "15% chance to dodge",
          },
          {
            id: "flash",
            name: "Flash Step",
            x: 400,
            y: 350,
            tier: 3,
            desc: "Teleport ability",
            xp: 200,
            nodeType: "ability" as const,
            abilityId: "flash-step",
          },
        ],
        connections: [
          { from: "start", to: "speed-1" },
          { from: "speed-1", to: "speed-2" },
          { from: "speed-1", to: "dodge" },
          { from: "speed-2", to: "flash" },
          { from: "dodge", to: "flash" },
        ],
      },
      {
        name: "Gold Path Build",
        description: "Focus on gold generation and banking",
        category: "economy",
        nodes: [
          {
            id: "start",
            name: "Core",
            x: 400,
            y: 50,
            tier: 0,
            desc: "Mek core systems",
            xp: 0,
          },
          {
            id: "gold-gen-1",
            name: "Basic Gold Generation",
            x: 300,
            y: 150,
            tier: 1,
            desc: "Increase gold earning rate",
            xp: 50,
            nodeType: "passive" as const,
            buffGrant: {
              buffType: "gold_rate",
              baseValue: 10,
            },
          },
          {
            id: "bank-cap-tier2",
            name: "Bank Expansion",
            x: 500,
            y: 150,
            tier: 2,
            desc: "Increase daily bank deposit limit",
            xp: 75,
            nodeType: "special" as const,
            buffGrant: {
              buffType: "bank_deposit_cap",
            },
          },
          {
            id: "gold-gen-2",
            name: "Advanced Gold Generation",
            x: 300,
            y: 250,
            tier: 3,
            desc: "Further increase gold earning",
            xp: 100,
            nodeType: "passive" as const,
            buffGrant: {
              buffType: "gold_rate",
              baseValue: 20,
            },
          },
          {
            id: "gold-find",
            name: "Gold Find",
            x: 400,
            y: 250,
            tier: 3,
            desc: "Chance to find extra gold",
            xp: 100,
            nodeType: "passive" as const,
            passiveEffect: "10% chance for double gold",
          },
          {
            id: "bank-cap-tier5",
            name: "Bank Mastery",
            x: 500,
            y: 350,
            tier: 5,
            desc: "Major bank deposit limit increase",
            xp: 150,
            nodeType: "special" as const,
            buffGrant: {
              buffType: "bank_deposit_cap",
            },
          },
          {
            id: "gold-mastery",
            name: "Gold Mastery",
            x: 400,
            y: 350,
            tier: 4,
            desc: "Master of gold generation",
            xp: 200,
            nodeType: "passive" as const,
            buffGrant: {
              buffType: "gold_rate",
              baseValue: 50,
            },
          },
          {
            id: "bank-interest",
            name: "Interest Boost",
            x: 300,
            y: 350,
            tier: 4,
            desc: "Increase bank interest rate",
            xp: 125,
            nodeType: "passive" as const,
            passiveEffect: "+0.5% daily interest",
          },
        ],
        connections: [
          { from: "start", to: "gold-gen-1" },
          { from: "start", to: "bank-cap-tier2" },
          { from: "gold-gen-1", to: "gold-gen-2" },
          { from: "gold-gen-1", to: "gold-find" },
          { from: "bank-cap-tier2", to: "bank-cap-tier5" },
          { from: "bank-cap-tier2", to: "gold-find" },
          { from: "gold-gen-2", to: "gold-mastery" },
          { from: "gold-gen-2", to: "bank-interest" },
          { from: "gold-find", to: "gold-mastery" },
          { from: "gold-find", to: "bank-cap-tier5" },
          { from: "bank-interest", to: "bank-cap-tier5" },
        ],
      },
    ];

    const created = [];
    for (const template of templates) {
      try {
        const id = await ctx.db.insert("mekTreeTemplates", {
          ...template,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isDefault: true,
        });
        created.push({ id, name: template.name });
      } catch (e) {
        // Template might already exist
      }
    }

    return created;
  },
});