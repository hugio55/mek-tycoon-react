import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Seed the shop with example listings
export const seedShopListings = mutation({
  args: {},
  handler: async (ctx) => {
    // First, get or create demo users to act as sellers
    const demoSellers = [];
    const sellerNames = ["MekTrader42", "EssenceKing", "PartsMaster", "ChromeLord", "RareCollector"];
    
    for (const name of sellerNames) {
      let user = await ctx.db
        .query("users")
        .withIndex("", (q: any) => q.eq("username", name))
        .first();
      
      if (!user) {
        // Create demo user
        const userId = await ctx.db.insert("users", {
          walletAddress: `demo_${name.toLowerCase()}`,
          username: name,
          totalEssence: {
            stone: 100,
            disco: 100,
            paul: 100,
            cartoon: 100,
            candy: 100,
            tiles: 100,
            moss: 100,
            bullish: 100,
            journalist: 100,
            laser: 100,
            flashbulb: 100,
            accordion: 100,
            turret: 100,
            drill: 100,
            security: 100,
          },
          gold: 50000,
          craftingSlots: 3,
          lastLogin: Date.now(),
          createdAt: Date.now(),
        });
        user = await ctx.db.get(userId);
      }
      
      if (user) {
        demoSellers.push(user._id);
      }
    }
    
    // Clear existing active listings (optional)
    const existingListings = await ctx.db
      .query("marketListings")
      .withIndex("", (q: any) => q.eq("status", "active"))
      .collect();
    
    for (const listing of existingListings) {
      await ctx.db.patch(listing._id, { status: "cancelled" });
    }
    
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    // ESSENCE LISTINGS (15)
    const essenceTypes = ["stone", "disco", "paul", "cartoon", "candy", "tiles", "moss", "bullish", 
                         "journalist", "laser", "flashbulb", "accordion", "turret", "drill", "security"];
    const essenceListings = [
      { type: "stone", amount: 0.5, pricePerUnit: 800 },
      { type: "disco", amount: 1.2, pricePerUnit: 1200 },
      { type: "paul", amount: 0.3, pricePerUnit: 2500 },
      { type: "cartoon", amount: 2.5, pricePerUnit: 600 },
      { type: "candy", amount: 0.8, pricePerUnit: 1500 },
      { type: "tiles", amount: 1.0, pricePerUnit: 1000 },
      { type: "moss", amount: 3.7, pricePerUnit: 450 },
      { type: "bullish", amount: 0.1, pricePerUnit: 5000 },
      { type: "journalist", amount: 1.5, pricePerUnit: 1100 },
      { type: "laser", amount: 0.7, pricePerUnit: 1800 },
      { type: "flashbulb", amount: 2.0, pricePerUnit: 700 },
      { type: "accordion", amount: 0.4, pricePerUnit: 2200 },
      { type: "turret", amount: 1.3, pricePerUnit: 950 },
      { type: "drill", amount: 0.9, pricePerUnit: 1600 },
      { type: "security", amount: 0.2, pricePerUnit: 3500 },
    ];
    
    for (const essence of essenceListings) {
      await ctx.db.insert("marketListings", {
        sellerId: demoSellers[Math.floor(Math.random() * demoSellers.length)],
        itemType: "essence",
        essenceType: essence.type,
        itemVariation: `${essence.type} essence`,
        quantity: essence.amount,
        pricePerUnit: essence.pricePerUnit,
        listedAt: now - Math.random() * dayInMs * 3, // Random time in last 3 days
        expiresAt: now + dayInMs * (1 + Math.random() * 6), // Expires in 1-7 days
        status: "active",
      });
    }
    
    // HEAD LISTINGS (15)
    const heads = [
      { name: "Chrome", price: 5000 },
      { name: "Maps", price: 4500 },
      { name: "Gold Plated", price: 8000 },
      { name: "Matte Black", price: 3500 },
      { name: "Rust", price: 1200 },
      { name: "Diamond", price: 12000 },
      { name: "Bronze", price: 2000 },
      { name: "Silver", price: 3000 },
      { name: "Copper", price: 1800 },
      { name: "Titanium", price: 7500 },
      { name: "Carbon Fiber", price: 6000 },
      { name: "Neon", price: 4000 },
      { name: "Holographic", price: 9000 },
      { name: "Stealth", price: 5500 },
      { name: "Crystal", price: 10000 },
    ];
    
    for (const head of heads) {
      await ctx.db.insert("marketListings", {
        sellerId: demoSellers[Math.floor(Math.random() * demoSellers.length)],
        itemType: "head",
        itemVariation: head.name,
        quantity: 1,
        pricePerUnit: head.price,
        listedAt: now - Math.random() * dayInMs * 3,
        expiresAt: now + dayInMs * (1 + Math.random() * 6),
        status: "active",
      });
    }
    
    // BODY LISTINGS (15)
    const bodies = [
      { name: "Heavy Armor", price: 6000 },
      { name: "Light Frame", price: 3000 },
      { name: "Medium Build", price: 4500 },
      { name: "Tank Class", price: 8000 },
      { name: "Scout Type", price: 3500 },
      { name: "Assault Model", price: 5500 },
      { name: "Support Frame", price: 4000 },
      { name: "Stealth Chassis", price: 7000 },
      { name: "Reinforced", price: 5000 },
      { name: "Aerodynamic", price: 4200 },
      { name: "Industrial", price: 2800 },
      { name: "Military Grade", price: 9000 },
      { name: "Prototype", price: 11000 },
      { name: "Standard Issue", price: 2000 },
      { name: "Elite Series", price: 7500 },
    ];
    
    for (const body of bodies) {
      await ctx.db.insert("marketListings", {
        sellerId: demoSellers[Math.floor(Math.random() * demoSellers.length)],
        itemType: "body",
        itemVariation: body.name,
        quantity: 1,
        pricePerUnit: body.price,
        listedAt: now - Math.random() * dayInMs * 3,
        expiresAt: now + dayInMs * (1 + Math.random() * 6),
        status: "active",
      });
    }
    
    // TRAIT LISTINGS (15)
    const traits = [
      { name: "Speed Boost", price: 3000 },
      { name: "Double Jump", price: 2500 },
      { name: "Shield Generator", price: 4500 },
      { name: "Radar Jammer", price: 3500 },
      { name: "Energy Regeneration", price: 4000 },
      { name: "Critical Strike", price: 5000 },
      { name: "Damage Reduction", price: 3800 },
      { name: "Cloak", price: 6000 },
      { name: "Overdrive", price: 5500 },
      { name: "Auto Repair", price: 4200 },
      { name: "EMP Blast", price: 7000 },
      { name: "Teleport", price: 8000 },
      { name: "Force Field", price: 4800 },
      { name: "Berserker Mode", price: 5200 },
      { name: "Tactical Scanner", price: 3200 },
    ];
    
    for (const trait of traits) {
      await ctx.db.insert("marketListings", {
        sellerId: demoSellers[Math.floor(Math.random() * demoSellers.length)],
        itemType: "trait",
        itemVariation: trait.name,
        quantity: 1,
        pricePerUnit: trait.price,
        listedAt: now - Math.random() * dayInMs * 3,
        expiresAt: now + dayInMs * (1 + Math.random() * 6),
        status: "active",
      });
    }
    
    // OVER EXPOSED LISTINGS (15)
    const overExposed = [
      { name: "Glitch Frame #001", price: 15000 },
      { name: "Corrupted Data Pack", price: 12000 },
      { name: "Neon Dreams Edition", price: 18000 },
      { name: "Static Burst Kit", price: 10000 },
      { name: "Pixel Perfect Set", price: 20000 },
      { name: "Distortion Field", price: 14000 },
      { name: "RGB Overflow", price: 16000 },
      { name: "Saturated Chrome", price: 13000 },
      { name: "Bloom Effect Plus", price: 11000 },
      { name: "HDR Maximum", price: 17000 },
      { name: "Lens Flare Deluxe", price: 9000 },
      { name: "Chromatic Aberration", price: 15500 },
      { name: "Light Leak Special", price: 12500 },
      { name: "Double Exposure Kit", price: 19000 },
      { name: "Vintage Filter Pack", price: 8500 },
    ];
    
    for (const item of overExposed) {
      await ctx.db.insert("marketListings", {
        sellerId: demoSellers[Math.floor(Math.random() * demoSellers.length)],
        itemType: "overexposed",
        itemVariation: item.name,
        quantity: 1,
        pricePerUnit: item.price,
        listedAt: now - Math.random() * dayInMs * 3,
        expiresAt: now + dayInMs * (1 + Math.random() * 6),
        status: "active",
      });
    }
    
    return {
      message: "Successfully seeded shop with 75 example listings (15 per category)",
      essenceCount: 15,
      headCount: 15,
      bodyCount: 15,
      traitCount: 15,
      overExposedCount: 15,
    };
  },
});