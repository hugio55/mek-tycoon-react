import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Sample mek data - replace with your actual data
const SAMPLE_MEKS = [
  {
    assetId: "mek_001",
    assetName: "Mek Warrior #001",
    owner: "wallet_address_here",
    headVariation: "laser",
    bodyVariation: "stone",
    rarityTier: "Rare",
  },
  {
    assetId: "mek_002", 
    assetName: "Mek Guardian #002",
    owner: "wallet_address_here",
    headVariation: "bullish",
    bodyVariation: "disco",
    rarityTier: "Epic",
  },
  // Add more meks here
];

export const seedMeks = mutation({
  args: {},
  handler: async (ctx) => {
    const existingMeks = await ctx.db.query("meks").collect();
    
    if (existingMeks.length > 0) {
      console.log("Meks already seeded");
      return { message: "Database already contains meks", count: existingMeks.length };
    }
    
    let insertedCount = 0;
    
    for (const mekData of SAMPLE_MEKS) {
      await ctx.db.insert("meks", {
        ...mekData,
        verified: false,
        iconUrl: `/images/meks/${mekData.assetId}.png`,
        
        // Set default values for optional fields
        level: 1,
        experience: 0,
        health: 100,
        maxHealth: 100,
        attack: 10 + Math.floor(Math.random() * 20),
        defense: 10 + Math.floor(Math.random() * 20),
        speed: 10 + Math.floor(Math.random() * 20),
        energy: 100,
        maxEnergy: 100,
        wins: 0,
        losses: 0,
        draws: 0,
        winStreak: 0,
        powerScore: 100 + Math.floor(Math.random() * 200),
        scrapValue: 50 + Math.floor(Math.random() * 100),
        inBattle: false,
        isStaked: false,
        lastUpdated: Date.now(),
      });
      insertedCount++;
    }
    
    return { message: "Meks seeded successfully", count: insertedCount };
  },
});

// Import meks from JSON data
export const importMeksFromJSON = mutation({
  args: {
    meksData: v.array(v.object({
      assetId: v.string(),
      assetName: v.string(),
      owner: v.string(),
      headGroup: v.optional(v.string()),
      headVariation: v.string(),
      bodyGroup: v.optional(v.string()),
      bodyVariation: v.string(),
      armsGroup: v.optional(v.string()),
      armsVariation: v.optional(v.string()),
      legsGroup: v.optional(v.string()),
      legsVariation: v.optional(v.string()),
      boosterGroup: v.optional(v.string()),
      boosterVariation: v.optional(v.string()),
      rarityRank: v.optional(v.number()),
    }))
  },
  handler: async (ctx, args) => {
    let imported = 0;
    let updated = 0;
    
    for (const mek of args.meksData) {
      const existing = await ctx.db
        .query("meks")
        .withIndex("by_asset_id", (q) => q.eq("assetId", mek.assetId))
        .first();
      
      const mekDocument = {
        ...mek,
        verified: true,
        iconUrl: `/images/meks/${mek.assetId}.png`,
        
        // Calculate rarity tier based on rank
        rarityTier: getRarityTier(mek.rarityRank),
        
        // Set default game stats
        level: 1,
        experience: 0,
        health: 100,
        maxHealth: 100,
        attack: calculateStat(mek.headVariation, "attack"),
        defense: calculateStat(mek.bodyVariation, "defense"),
        speed: calculateStat(mek.legsVariation || "standard", "speed"),
        energy: 100,
        maxEnergy: 100,
        wins: 0,
        losses: 0,
        draws: 0,
        winStreak: 0,
        powerScore: calculatePowerScore(mek),
        scrapValue: calculateScrapValue(mek.rarityRank),
        inBattle: false,
        isStaked: false,
        lastUpdated: Date.now(),
      };
      
      if (existing) {
        await ctx.db.patch(existing._id, mekDocument);
        updated++;
      } else {
        await ctx.db.insert("meks", mekDocument);
        imported++;
      }
    }
    
    return { 
      message: "Import complete", 
      imported, 
      updated,
      total: imported + updated 
    };
  },
});

// Helper functions
function getRarityTier(rank?: number): string {
  if (!rank) return "Common";
  if (rank <= 100) return "Legendary";
  if (rank <= 500) return "Epic";
  if (rank <= 1500) return "Rare";
  if (rank <= 3000) return "Uncommon";
  return "Common";
}

function calculateStat(variation: string, statType: string): number {
  const baseStats: Record<string, Record<string, number>> = {
    attack: {
      laser: 25,
      turret: 22,
      drill: 20,
      bullish: 18,
      security: 15,
      standard: 10,
    },
    defense: {
      stone: 25,
      tiles: 22,
      moss: 20,
      candy: 15,
      disco: 12,
      standard: 10,
    },
    speed: {
      flashbulb: 25,
      journalist: 20,
      accordion: 15,
      standard: 10,
    },
  };
  
  return baseStats[statType]?.[variation] || 10;
}

function calculatePowerScore(mek: any): number {
  let score = 100;
  
  // Rarity bonus
  if (mek.rarityRank) {
    if (mek.rarityRank <= 100) score += 200;
    else if (mek.rarityRank <= 500) score += 100;
    else if (mek.rarityRank <= 1500) score += 50;
  }
  
  // Part bonuses
  const rareParts = ["laser", "turret", "stone", "tiles", "flashbulb"];
  if (rareParts.includes(mek.headVariation)) score += 25;
  if (rareParts.includes(mek.bodyVariation)) score += 25;
  
  return score;
}

function calculateScrapValue(rank?: number): number {
  if (!rank) return 50;
  if (rank <= 100) return 500;
  if (rank <= 500) return 250;
  if (rank <= 1500) return 150;
  if (rank <= 3000) return 100;
  return 50;
}