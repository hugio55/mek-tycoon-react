import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

export const createContract = mutation({
  args: {
    userId: v.id("users"),
    location: v.string(),
    missionType: v.string(),
    duration: v.number(),
    goldFee: v.number(),
    mekIds: v.array(v.string()),
    biasScore: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    
    if (user.gold < args.goldFee) {
      throw new Error("Insufficient gold");
    }
    
    await ctx.db.patch(args.userId, {
      gold: user.gold - args.goldFee,
    });
    
    const contract = await ctx.db.insert("contracts", {
      userId: args.userId,
      location: args.location,
      missionType: args.missionType,
      duration: args.duration,
      goldFee: args.goldFee,
      mekIds: args.mekIds,
      biasScore: args.biasScore,
      startTime: Date.now(),
      endTime: Date.now() + args.duration,
      status: "active",
    });
    
    return contract;
  },
});

export const getUserContracts = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const contracts = await ctx.db
      .query("contracts")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .collect();
    
    return contracts;
  },
});

export const getActiveContracts = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const contracts = await ctx.db
      .query("contracts")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("status"), "active")
        )
      )
      .collect();
    
    return contracts;
  },
});

export const completeContract = mutation({
  args: { contractId: v.id("contracts") },
  handler: async (ctx, args) => {
    const contract = await ctx.db.get(args.contractId);
    if (!contract) throw new Error("Contract not found");
    
    if (contract.status !== "active") {
      throw new Error("Contract is not active");
    }
    
    if (Date.now() < contract.endTime) {
      throw new Error("Contract is not complete yet");
    }
    
    const goldReward = calculateGoldReward(contract.biasScore);
    const essenceReward = calculateEssenceReward(contract.biasScore);
    
    const user = await ctx.db.get(contract.userId);
    if (!user) throw new Error("User not found");
    
    await ctx.db.patch(contract.userId, {
      gold: user.gold + goldReward,
    });
    
    await ctx.db.patch(args.contractId, {
      status: "completed",
      rewards: {
        gold: goldReward,
        essence: essenceReward,
      },
    });
    
    return {
      gold: goldReward,
      essence: essenceReward,
    };
  },
});

export const cancelContract = mutation({
  args: { contractId: v.id("contracts") },
  handler: async (ctx, args) => {
    const contract = await ctx.db.get(args.contractId);
    if (!contract) throw new Error("Contract not found");
    
    if (contract.status !== "active") {
      throw new Error("Contract is not active");
    }
    
    await ctx.db.patch(args.contractId, {
      status: "cancelled",
    });
    
    return true;
  },
});

function calculateGoldReward(biasScore: number): number {
  const baseReward = 1000;
  const multiplier = 1 + (biasScore / 200);
  const variance = Math.random() * 0.5 + 0.75;
  return Math.floor(baseReward * multiplier * variance);
}

function calculateEssenceReward(biasScore: number): string {
  const essenceTypes = ["common", "uncommon", "rare", "epic", "legendary"];
  const probabilities = calculateProbabilities(biasScore);
  
  const random = Math.random();
  let accumulated = 0;
  
  for (let i = 0; i < probabilities.length; i++) {
    accumulated += probabilities[i];
    if (random <= accumulated) {
      return essenceTypes[i];
    }
  }
  
  return essenceTypes[0];
}

function calculateProbabilities(biasScore: number): number[] {
  const sigma = 0.8;
  const maxBias = 1000;
  const sqrtProgress = Math.sqrt(Math.min(biasScore, maxBias) / maxBias);
  const bellCenter = sqrtProgress * 4;
  
  const probs = [0, 1, 2, 3, 4].map((index) => {
    const distance = index - bellCenter;
    const prob = Math.exp(-0.5 * Math.pow(distance / sigma, 2));
    return prob;
  });
  
  const total = probs.reduce((a, b) => a + b, 0);
  return probs.map(p => p / total);
}