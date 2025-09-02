import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get or create a talent tree for a specific Mek
export const getOrCreateMekTree = mutation({
  args: {
    mekId: v.id("meks"),
    ownerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if tree already exists
    const existingTree = await ctx.db
      .query("mekTalentTrees")
      .withIndex("by_mek_owner", (q) => 
        q.eq("mekId", args.mekId).eq("ownerId", args.ownerId)
      )
      .first();

    if (existingTree) {
      return existingTree;
    }

    // Get the Mek to determine its type for tree generation
    const mek = await ctx.db.get(args.mekId);
    if (!mek) {
      throw new Error("Mek not found");
    }

    // Create default tree based on Mek's characteristics
    const defaultTree = generateDefaultTree(mek);

    const newTree = await ctx.db.insert("mekTalentTrees", {
      mekId: args.mekId,
      ownerId: args.ownerId,
      nodes: defaultTree.nodes,
      connections: defaultTree.connections,
      unlockedNodes: ["start"], // Only start node is unlocked initially
      totalXpSpent: 0,
      availableXp: 100, // Starting XP
      treeVersion: 1,
      lastModified: Date.now(),
      createdAt: Date.now(),
    });

    return await ctx.db.get(newTree);
  },
});

// Get a Mek's talent tree
export const getMekTree = query({
  args: {
    mekId: v.id("meks"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("mekTalentTrees")
      .withIndex("by_mek", (q) => q.eq("mekId", args.mekId))
      .first();
  },
});

// Update a Mek's talent tree (for builder)
export const updateMekTree = mutation({
  args: {
    treeId: v.id("mekTalentTrees"),
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
  },
  handler: async (ctx, args) => {
    const tree = await ctx.db.get(args.treeId);
    if (!tree) {
      throw new Error("Tree not found");
    }

    await ctx.db.patch(args.treeId, {
      nodes: args.nodes,
      connections: args.connections,
      lastModified: Date.now(),
    });

    return await ctx.db.get(args.treeId);
  },
});

// Unlock a node in a Mek's talent tree
export const unlockNode = mutation({
  args: {
    treeId: v.id("mekTalentTrees"),
    nodeId: v.string(),
  },
  handler: async (ctx, args) => {
    const tree = await ctx.db.get(args.treeId);
    if (!tree) {
      throw new Error("Tree not found");
    }

    // Find the node
    const node = tree.nodes.find(n => n.id === args.nodeId);
    if (!node) {
      throw new Error("Node not found");
    }

    // Check if already unlocked
    if (tree.unlockedNodes.includes(args.nodeId)) {
      throw new Error("Node already unlocked");
    }

    // Check XP requirement
    if (tree.availableXp < node.xp) {
      throw new Error("Not enough XP");
    }

    // Check prerequisites (must have at least one connected unlocked node)
    const hasPrereq = tree.connections.some(conn => 
      conn.to === args.nodeId && tree.unlockedNodes.includes(conn.from)
    );

    if (!hasPrereq && args.nodeId !== "start") {
      throw new Error("Prerequisites not met");
    }

    // Unlock the node
    await ctx.db.patch(args.treeId, {
      unlockedNodes: [...tree.unlockedNodes, args.nodeId],
      availableXp: tree.availableXp - node.xp,
      totalXpSpent: tree.totalXpSpent + node.xp,
      lastModified: Date.now(),
    });

    // Apply stat bonuses to the Mek if applicable
    if (node.nodeType === "stat" && node.statBonus) {
      const mek = await ctx.db.get(tree.mekId);
      if (mek) {
        await ctx.db.patch(tree.mekId, {
          health: (mek.health || 100) + (node.statBonus.health || 0),
          speed: (mek.speed || 10) + (node.statBonus.speed || 0),
          // Add other stats as needed
        });
      }
    }
    
    // Apply buff if node has buffGrant property
    if (node.buffGrant) {
      // Find the buff type
      const buffType = await ctx.db
        .query("buffTypes")
        .filter((q) => q.eq(q.field("buffType"), node.buffGrant.buffType))
        .first();
      
      if (buffType) {
        // Get the Mek to determine its rank/power score
        const mek = await ctx.db.get(tree.mekId);
        let buffValue = node.buffGrant.baseValue || 10;
        
        // If this is a bank deposit cap buff, scale based on Mek power score and node tier
        if (node.buffGrant.buffType === "bank_deposit_cap" && mek) {
          const powerScore = mek.powerScore || 100;
          const nodeTier = node.tier || 1;
          
          // Determine rank based on power score
          let rankMultiplier = 1;
          if (powerScore >= 3000 && powerScore < 4000) {
            // 3k to 4k rank
            rankMultiplier = [0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4][Math.min(nodeTier - 1, 9)] || 1;
          } else if (powerScore >= 2000 && powerScore < 3000) {
            // 2k to 3k rank
            rankMultiplier = [0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.5][Math.min(nodeTier - 1, 9)] || 1;
          } else if (powerScore >= 1000 && powerScore < 2000) {
            // 1k to 2k rank
            rankMultiplier = [0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7][Math.min(nodeTier - 1, 9)] || 1;
          } else if (powerScore >= 500 && powerScore < 1000) {
            // 500 to 1k rank
            rankMultiplier = [1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9][Math.min(nodeTier - 1, 9)] || 1;
          } else if (powerScore >= 100 && powerScore < 500) {
            // 100 to 500 rank
            rankMultiplier = [1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2, 2.1, 2.2][Math.min(nodeTier - 1, 9)] || 1;
          } else if (powerScore >= 25 && powerScore < 100) {
            // 25 to 100 rank
            rankMultiplier = [1.7, 1.8, 1.9, 2, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6][Math.min(nodeTier - 1, 9)] || 1;
          } else if (powerScore >= 1 && powerScore < 25) {
            // 1 to 25 rank
            rankMultiplier = [2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 3][Math.min(nodeTier - 1, 9)] || 1;
          }
          
          buffValue = rankMultiplier;
        }
        
        // Check if user already has this buff from this source
        const existingBuff = await ctx.db
          .query("activeBuffs")
          .filter((q) =>
            q.and(
              q.eq(q.field("userId"), tree.ownerId),
              q.eq(q.field("sourceId"), `${tree._id}:${node.id}`)
            )
          )
          .first();
        
        if (!existingBuff) {
          // Grant the buff to the user
          await ctx.db.insert("activeBuffs", {
            userId: tree.ownerId,
            buffTypeId: buffType._id,
            source: "mek_talent_tree",
            sourceId: `${tree._id}:${node.id}`,
            value: buffValue,
            stacks: 1,
            startedAt: Date.now(),
            expiresAt: undefined, // Permanent buff from talent tree
            isActive: true,
          });
        }
      }
    }

    return true;
  },
});

// Reset a Mek's talent tree
export const resetMekTree = mutation({
  args: {
    treeId: v.id("mekTalentTrees"),
  },
  handler: async (ctx, args) => {
    const tree = await ctx.db.get(args.treeId);
    if (!tree) {
      throw new Error("Tree not found");
    }

    // Remove all buffs granted by this talent tree
    const treeBuffs = await ctx.db
      .query("activeBuffs")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), tree.ownerId),
          q.eq(q.field("source"), "mek_talent_tree")
        )
      )
      .collect();
    
    for (const buff of treeBuffs) {
      // Check if this buff came from this specific tree
      if (buff.sourceId && buff.sourceId.startsWith(`${args.treeId}:`)) {
        await ctx.db.patch(buff._id, { isActive: false });
      }
    }

    // Refund all spent XP
    const refundedXp = tree.totalXpSpent;

    await ctx.db.patch(args.treeId, {
      unlockedNodes: ["start"],
      availableXp: tree.availableXp + refundedXp,
      totalXpSpent: 0,
      lastModified: Date.now(),
    });

    return true;
  },
});

// Add XP to a Mek's talent tree
export const addMekXp = mutation({
  args: {
    treeId: v.id("mekTalentTrees"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const tree = await ctx.db.get(args.treeId);
    if (!tree) {
      throw new Error("Tree not found");
    }

    await ctx.db.patch(args.treeId, {
      availableXp: tree.availableXp + args.amount,
      lastModified: Date.now(),
    });

    return true;
  },
});

// Helper function to generate a default tree based on Mek characteristics
function generateDefaultTree(mek: any) {
  const nodes: any[] = [];
  const connections: any[] = [];

  // Single start node
  nodes.push({
    id: "start",
    name: "Core",
    x: 400,
    y: 200,
    tier: 0,
    desc: `${mek.assetName}'s core systems`,
    xp: 0,
    unlocked: true,
  });

  return { nodes, connections };
}

// Get all talent trees for a user's Meks
export const getUserMekTrees = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("mekTalentTrees")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.userId))
      .collect();
  },
});