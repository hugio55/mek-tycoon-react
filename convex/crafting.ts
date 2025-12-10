import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { checkMultipleEssenceRequirements, deductMultipleEssence } from "./lib/userEssenceHelpers";

// Get all available recipes for a user
export const getRecipes = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const recipes = await ctx.db.query("craftingRecipes").collect();
    
    // If userId provided, check unlock requirements
    if (args.userId) {
      const user = await ctx.db.get(args.userId);
      // Filter based on user level, achievements, etc.
      // For now, return all recipes
    }
    
    return recipes;
  },
});

// Get user's active crafting sessions
export const getActiveSessions = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("craftingSessions")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .filter((q) => q.neq(q.field("status"), "claimed"))
      .collect();
    
    // Join with recipe data
    const sessionsWithRecipes = await Promise.all(
      sessions.map(async (session) => {
        const recipe = await ctx.db.get(session.recipeId);
        return { ...session, recipe };
      })
    );
    
    return sessionsWithRecipes;
  },
});

// Start a new crafting session
export const startCrafting = mutation({
  args: {
    userId: v.id("users"),
    recipeId: v.id("craftingRecipes"),
    slotNumber: v.number(),
  },
  handler: async (ctx, args) => {
    // Get user and recipe
    const user = await ctx.db.get(args.userId);
    const recipe = await ctx.db.get(args.recipeId);
    
    if (!user || !recipe) {
      throw new Error("User or recipe not found");
    }

    if (!user.stakeAddress) {
      throw new Error("User does not have a stake address");
    }
    
    // Check if slot is available
    const existingSession = await ctx.db
      .query("craftingSessions")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .filter((q) => 
        q.and(
          q.eq(q.field("slotNumber"), args.slotNumber),
          q.eq(q.field("status"), "crafting")
        )
      )
      .first();
    
    if (existingSession) {
      throw new Error("Slot already in use");
    }
    
    // Check if user has enough slots
    if (args.slotNumber > user.craftingSlots) {
      throw new Error("Slot not unlocked");
    }
    
    // Check essence costs using userEssence table (Phase II)
    const essenceCost = recipe.essenceCost as Record<string, number>;
    const essenceCheck = await checkMultipleEssenceRequirements(
      ctx,
      user.stakeAddress,
      essenceCost
    );
    if (!essenceCheck.sufficient) {
      const missingStr = Object.entries(essenceCheck.missing)
        .map(([type, amt]) => `${type}: need ${amt} more`)
        .join(", ");
      throw new Error(`Not enough essence. Missing: ${missingStr}`);
    }

    // Check gold cost
    if (recipe.goldCost && recipe.goldCost > 0) {
      if (user.gold < recipe.goldCost) {
        throw new Error("Not enough gold");
      }
    }

    // Deduct essence from userEssence table (Phase II)
    await deductMultipleEssence(ctx, user.stakeAddress, essenceCost, "crafting");

    // Deduct gold
    await ctx.db.patch(args.userId, {
      gold: user.gold - (recipe.goldCost || 0),
    });
    
    // Create crafting session
    const now = Date.now();
    const completesAt = now + recipe.cooldownMinutes * 60 * 1000;
    
    const sessionId = await ctx.db.insert("craftingSessions", {
      userId: args.userId,
      recipeId: args.recipeId,
      startedAt: now,
      completesAt,
      status: "crafting",
      slotNumber: args.slotNumber,
    });
    
    // Log transaction
    await ctx.db.insert("transactions", {
      type: "craft",
      userId: args.userId,
      itemType: recipe.outputType,
      itemVariation: recipe.outputVariation,
      details: `Started crafting ${recipe.name}`,
      timestamp: now,
    });
    
    return sessionId;
  },
});

// Claim completed crafting
export const claimCrafting = mutation({
  args: {
    sessionId: v.id("craftingSessions"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    
    if (!session || session.userId !== args.userId) {
      throw new Error("Session not found or unauthorized");
    }
    
    if (session.status !== "crafting") {
      throw new Error("Session already claimed or failed");
    }
    
    const now = Date.now();
    if (now < session.completesAt) {
      throw new Error("Crafting not complete yet");
    }
    
    const recipe = await ctx.db.get(session.recipeId);
    if (!recipe) {
      throw new Error("Recipe not found");
    }
    
    // Check success rate
    const random = Math.random() * 100;
    const success = random <= recipe.successRate;
    
    if (success) {
      // Add to inventory
      const existingItem = await ctx.db
        .query("inventory")
        .withIndex("by_type", (q: any) => q.eq("userId", args.userId))
        .filter((q) =>
          q.and(
            q.eq(q.field("itemType"), recipe.outputType),
            q.eq(q.field("itemVariation"), recipe.outputVariation)
          )
        )
        .first();
      
      if (existingItem) {
        await ctx.db.patch(existingItem._id, {
          quantity: existingItem.quantity + 1,
        });
      } else {
        await ctx.db.insert("inventory", {
          userId: args.userId,
          itemType: recipe.outputType,
          itemVariation: recipe.outputVariation,
          quantity: 1,
          craftedAt: now,
        });
      }
      
      // Update session status
      await ctx.db.patch(args.sessionId, {
        status: "claimed",
      });
      
      // Log success
      await ctx.db.insert("transactions", {
        type: "craft",
        userId: args.userId,
        itemType: recipe.outputType,
        itemVariation: recipe.outputVariation,
        details: `Successfully crafted ${recipe.name}`,
        timestamp: now,
      });
      
      return { success: true, item: recipe.outputVariation };
    } else {
      // Crafting failed
      await ctx.db.patch(args.sessionId, {
        status: "failed",
      });
      
      // Log failure
      await ctx.db.insert("transactions", {
        type: "craft",
        userId: args.userId,
        details: `Failed to craft ${recipe.name}`,
        timestamp: now,
      });
      
      return { success: false, item: null };
    }
  },
});

// Speed up crafting with gold
export const speedUpCrafting = mutation({
  args: {
    sessionId: v.id("craftingSessions"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    const user = await ctx.db.get(args.userId);
    
    if (!session || !user || session.userId !== args.userId) {
      throw new Error("Invalid session or user");
    }
    
    if (session.status !== "crafting") {
      throw new Error("Session not active");
    }
    
    const now = Date.now();
    const remainingTime = Math.max(0, session.completesAt - now);
    const speedUpCost = Math.ceil(remainingTime / 60000); // 1 gold per minute
    
    if (user.gold < speedUpCost) {
      throw new Error("Not enough gold");
    }
    
    // Deduct gold and complete immediately
    await ctx.db.patch(args.userId, {
      gold: user.gold - speedUpCost,
    });
    
    await ctx.db.patch(args.sessionId, {
      completesAt: now,
    });
    
    return { cost: speedUpCost };
  },
});