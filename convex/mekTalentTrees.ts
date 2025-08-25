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
  const nodes = [];
  const connections = [];

  // Start node
  nodes.push({
    id: "start",
    name: "Core",
    x: 400,
    y: 50,
    tier: 0,
    desc: `${mek.assetName}'s core systems`,
    xp: 0,
    unlocked: true,
  });

  // Branch based on head type
  if (mek.headVariation) {
    nodes.push({
      id: "head-branch",
      name: mek.headVariation,
      x: 200,
      y: 150,
      tier: 1,
      desc: `Enhance ${mek.headVariation} capabilities`,
      xp: 50,
      nodeType: "stat" as const,
      statBonus: { attack: 5 }
    });
    connections.push({ from: "start", to: "head-branch" });

    // Add sub-nodes
    nodes.push({
      id: "head-upgrade-1",
      name: "Advanced Optics",
      x: 150,
      y: 250,
      tier: 2,
      desc: "Improved targeting systems",
      xp: 75,
      nodeType: "stat" as const,
      statBonus: { critChance: 10 }
    });
    connections.push({ from: "head-branch", to: "head-upgrade-1" });
  }

  // Branch based on body type
  if (mek.bodyVariation) {
    nodes.push({
      id: "body-branch",
      name: mek.bodyVariation,
      x: 400,
      y: 150,
      tier: 1,
      desc: `Enhance ${mek.bodyVariation} systems`,
      xp: 50,
      nodeType: "stat" as const,
      statBonus: { health: 20 }
    });
    connections.push({ from: "start", to: "body-branch" });

    // Add sub-nodes
    nodes.push({
      id: "body-upgrade-1",
      name: "Reinforced Plating",
      x: 400,
      y: 250,
      tier: 2,
      desc: "Increased durability",
      xp: 75,
      nodeType: "stat" as const,
      statBonus: { defense: 10 }
    });
    connections.push({ from: "body-branch", to: "body-upgrade-1" });
  }

  // Branch based on item/trait
  if (mek.itemVariation) {
    nodes.push({
      id: "item-branch",
      name: mek.itemVariation,
      x: 600,
      y: 150,
      tier: 1,
      desc: `Master ${mek.itemVariation} techniques`,
      xp: 50,
      nodeType: "ability" as const,
      abilityId: "special-move-1"
    });
    connections.push({ from: "start", to: "item-branch" });

    // Add sub-nodes
    nodes.push({
      id: "item-upgrade-1",
      name: "Overcharge",
      x: 650,
      y: 250,
      tier: 2,
      desc: "Boost all abilities",
      xp: 75,
      nodeType: "passive" as const,
      passiveEffect: "All abilities +25% effectiveness"
    });
    connections.push({ from: "item-branch", to: "item-upgrade-1" });
  }

  // Add some universal nodes
  nodes.push({
    id: "evolution-1",
    name: "Evolution",
    x: 400,
    y: 350,
    tier: 3,
    desc: "Unlock next evolution stage",
    xp: 150,
    nodeType: "special" as const
  });

  // Connect evolution to multiple branches
  if (mek.headVariation) connections.push({ from: "head-upgrade-1", to: "evolution-1" });
  if (mek.bodyVariation) connections.push({ from: "body-upgrade-1", to: "evolution-1" });
  if (mek.itemVariation) connections.push({ from: "item-upgrade-1", to: "evolution-1" });

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