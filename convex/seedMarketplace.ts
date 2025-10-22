import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const seedMarketplaceListings = mutation({
  args: {},
  handler: async (ctx) => {
    // Get or create demo seller user
    let demoSeller = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", "marketplace_demo_seller"))
      .first();
    
    if (!demoSeller) {
      const demoSellerId = await ctx.db.insert("users", {
        walletAddress: "marketplace_demo_seller",
        username: "Market Vendor",
        gold: 100000,
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
        craftingSlots: 3,
        lastLogin: Date.now(),
      });
      demoSeller = await ctx.db.get(demoSellerId);
    }
    
    if (!demoSeller) return { message: "Failed to create demo seller" };
    
    const now = Date.now();
    
    // Mock chip listings
    const chipListings = [
      // Heads
      { type: "head", variation: "Acid A", price: 250, qty: 3 },
      { type: "head", variation: "Chrome S", price: 1500, qty: 1 },
      { type: "head", variation: "Burnt B", price: 450, qty: 2 },
      { type: "head", variation: "Carving C", price: 350, qty: 5 },
      { type: "head", variation: "Boss SS", price: 3500, qty: 1 },
      { type: "head", variation: "Arcade D", price: 180, qty: 8 },
      
      // Bodies
      { type: "body", variation: "Carbon A", price: 300, qty: 4 },
      { type: "body", variation: "Damascus S", price: 2000, qty: 1 },
      { type: "body", variation: "Arctic B", price: 550, qty: 3 },
      { type: "body", variation: "Concrete C", price: 280, qty: 6 },
      { type: "body", variation: "Crystal Clear SS", price: 4500, qty: 1 },
      { type: "body", variation: "Denim D", price: 150, qty: 10 },
      
      // Traits
      { type: "trait", variation: "007 A", price: 400, qty: 2 },
      { type: "trait", variation: "24K S", price: 2500, qty: 1 },
      { type: "trait", variation: "Abominable B", price: 650, qty: 2 },
      { type: "trait", variation: "Baby C", price: 220, qty: 7 },
      { type: "trait", variation: "Broadcast SS", price: 5000, qty: 1 },
      { type: "trait", variation: "Cotton Candy D", price: 120, qty: 12 },
    ];
    
    // Add chip listings
    for (const listing of chipListings) {
      await ctx.db.insert("marketListings", {
        sellerId: demoSeller._id,
        itemType: listing.type as "head" | "body" | "trait",
        itemVariation: listing.variation,
        quantity: listing.qty,
        pricePerUnit: listing.price,
        status: "active",
        listedAt: now - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in past week
        expiresAt: now + 30 * 24 * 60 * 60 * 1000, // 30 days from now
      });
    }
    
    // Mock essence listings with diverse countdown timers
    // Color thresholds: White (12+ hrs), Yellow (5-12 hrs), Orange (1-5 hrs), Red (0-1 hr & expired)
    const essenceListings = [
      // EXPIRED (Red) - only one
      { type: "stone", price: 122, qty: 3.0, expiresIn: -1000 }, // Expired

      // WHITE (12+ hours)
      { type: "tiles", price: 600, qty: 8.0, expiresIn: 25 * 24 * 60 * 60 * 1000 }, // 25 days
      { type: "candy", price: 900, qty: 6.0, expiresIn: 18 * 24 * 60 * 60 * 1000 }, // 18 days
      { type: "moss", price: 1500, qty: 4.0, expiresIn: 3 * 24 * 60 * 60 * 1000 }, // 3 days
      { type: "disco", price: 1800, qty: 3.0, expiresIn: 36 * 60 * 60 * 1000 }, // 36 hours
      { type: "paul", price: 2000, qty: 5.0, expiresIn: 18 * 60 * 60 * 1000 }, // 18 hours
      { type: "cartoon", price: 2200, qty: 2.0, expiresIn: 13 * 60 * 60 * 1000 }, // 13 hours

      // YELLOW (5-12 hours)
      { type: "bullish", price: 2500, qty: 1.0, expiresIn: 11 * 60 * 60 * 1000 }, // 11 hours
      { type: "journalist", price: 2800, qty: 1.5, expiresIn: 9 * 60 * 60 * 1000 }, // 9 hours
      { type: "laser", price: 3200, qty: 2.5, expiresIn: 7 * 60 * 60 * 1000 }, // 7 hours
      { type: "flashbulb", price: 3600, qty: 3.5, expiresIn: 5.5 * 60 * 60 * 1000 }, // 5.5 hours

      // ORANGE (1-5 hours)
      { type: "accordion", price: 4000, qty: 4.5, expiresIn: 4 * 60 * 60 * 1000 }, // 4 hours
      { type: "turret", price: 4500, qty: 5.5, expiresIn: 2.5 * 60 * 60 * 1000 }, // 2.5 hours
      { type: "drill", price: 5000, qty: 6.5, expiresIn: 1.5 * 60 * 60 * 1000 }, // 1.5 hours

      // RED (0-1 hour)
      { type: "security", price: 5500, qty: 7.5, expiresIn: 55 * 60 * 1000 }, // 55 minutes
      { type: "stone", price: 6000, qty: 8.5, expiresIn: 25 * 60 * 1000 }, // 25 minutes
      { type: "tiles", price: 6500, qty: 9.5, expiresIn: 3 * 60 * 1000 }, // 3 minutes
      { type: "candy", price: 7000, qty: 10.5, expiresIn: 45 * 1000 }, // 45 seconds
    ];

    for (const listing of essenceListings) {
      await ctx.db.insert("marketListings", {
        sellerId: demoSeller._id,
        itemType: "essence",
        itemVariation: `${listing.type} essence`,
        essenceType: listing.type,
        quantity: listing.qty,
        pricePerUnit: listing.price,
        status: "active",
        listedAt: now - Math.floor(Math.random() * 3 * 24 * 60 * 60 * 1000), // Random time in past 3 days
        expiresAt: now + listing.expiresIn,
      });
    }
    
    // Mock OE items
    const oeListings = [
      { 
        variation: "OE Signature Mek #042", 
        desc: "Ultra-rare Over Exposed collectible with enhanced stats",
        price: 25000
      },
      { 
        variation: "OE Genesis Pack", 
        desc: "Contains 5 random OE-enhanced chips",
        price: 15000
      },
      { 
        variation: "OE Limited Badge", 
        desc: "Exclusive badge showing OE supporter status",
        price: 8000
      },
    ];
    
    for (const oe of oeListings) {
      await ctx.db.insert("marketListings", {
        sellerId: demoSeller._id,
        itemType: "overexposed",
        itemVariation: oe.variation,
        itemDescription: oe.desc,
        quantity: 1,
        pricePerUnit: oe.price,
        status: "active",
        listedAt: now - Math.floor(Math.random() * 14 * 24 * 60 * 60 * 1000), // Random time in past 2 weeks
        expiresAt: now + 60 * 24 * 60 * 60 * 1000, // 60 days from now
      });
    }
    
    // Mock Frames listings
    const frameListings = [
      { variation: "frame-gold-industrial", desc: "Industrial gold-plated frame with sharp edges", price: 1200, qty: 3 },
      { variation: "frame-diamond-plate", desc: "Heavy-duty diamond plate steel frame", price: 800, qty: 5 },
      { variation: "frame-hazard-stripes", desc: "Warning-striped safety frame", price: 650, qty: 8 },
      { variation: "frame-hex-tech", desc: "High-tech hexagonal pattern frame", price: 1500, qty: 2 },
      { variation: "frame-circuit-board", desc: "Electronic circuit board aesthetic frame", price: 2000, qty: 2 },
      { variation: "frame-legendary-prism", desc: "Prismatic legendary frame with holographic effect", price: 5000, qty: 1 },
      { variation: "frame-plasma-core", desc: "Glowing plasma energy frame", price: 3500, qty: 1 },
      { variation: "frame-riveted-steel", desc: "Industrial riveted steel frame", price: 500, qty: 10 },
      { variation: "frame-corrupted-data", desc: "Glitched digital corruption frame", price: 2800, qty: 2 },
      { variation: "frame-energy-shield", desc: "Protective energy shield frame", price: 4000, qty: 1 },
    ];
    
    for (const frame of frameListings) {
      await ctx.db.insert("marketListings", {
        sellerId: demoSeller._id,
        itemType: "enclosure",
        itemVariation: frame.variation,
        itemDescription: frame.desc,
        quantity: frame.qty,
        pricePerUnit: frame.price,
        status: "active",
        listedAt: now - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in past week
        expiresAt: now + 30 * 24 * 60 * 60 * 1000, // 30 days from now
      });
    }
    
    // Mock OEM (Film Canisters) listings
    const oemListings = [
      { variation: "Kodak Gold 200", desc: "Classic 35mm film canister - warm tones", price: 350, qty: 12 },
      { variation: "Kodak Portra 400", desc: "Professional portrait film canister", price: 550, qty: 8 },
      { variation: "Kodak Ektar 100", desc: "Ultra-sharp landscape film canister", price: 450, qty: 10 },
      { variation: "Kodak Tri-X 400", desc: "Black & white film canister - high contrast", price: 400, qty: 15 },
      { variation: "Kodak ColorPlus 200", desc: "Budget-friendly color film canister", price: 250, qty: 20 },
      { variation: "Kodak UltraMax 400", desc: "Versatile all-purpose film canister", price: 300, qty: 18 },
      { variation: "Kodak T-MAX 100", desc: "Fine grain B&W film canister", price: 500, qty: 6 },
      { variation: "Kodak Ektachrome E100", desc: "Slide film canister - vivid colors", price: 650, qty: 4 },
    ];
    
    for (const oem of oemListings) {
      await ctx.db.insert("marketListings", {
        sellerId: demoSeller._id,
        itemType: "oem",
        itemVariation: oem.variation,
        itemDescription: oem.desc,
        quantity: oem.qty,
        pricePerUnit: oem.price,
        status: "active",
        listedAt: now - Math.floor(Math.random() * 10 * 24 * 60 * 60 * 1000), // Random time in past 10 days
        expiresAt: now + 45 * 24 * 60 * 60 * 1000, // 45 days from now
      });
    }
    
    return {
      message: "Successfully seeded marketplace with mock listings",
      chipListings: chipListings.length,
      essenceListings: essenceListings.length,
      oeListings: oeListings.length,
      frameListings: frameListings.length,
      oemListings: oemListings.length,
    };
  },
});

// Clear all marketplace listings (for testing)
export const clearMarketplaceListings = mutation({
  args: {},
  handler: async (ctx) => {
    const listings = await ctx.db
      .query("marketListings")
      .collect();
    
    for (const listing of listings) {
      await ctx.db.delete(listing._id);
    }
    
    return { message: `Cleared ${listings.length} listings` };
  },
});