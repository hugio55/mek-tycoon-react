import { v } from "convex/values";
import { mutation, query, action, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";

// Store solar flare data
export const storeSolarFlare = mutation({
  args: {
    date: v.string(),
    timestamp: v.number(),
    class: v.string(),
    peakTime: v.string(),
    intensity: v.optional(v.number()),
    region: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if we already have this flare
    const existing = await ctx.db
      .query("solarFlares")
      .withIndex("by_timestamp", (q) => q.eq("timestamp", args.timestamp))
      .first();

    if (!existing) {
      await ctx.db.insert("solarFlares", args);
    }
    
    return { success: true };
  },
});

// Store sunspot data
export const storeSunspotData = mutation({
  args: {
    date: v.string(), // Format: "YYYY-MM-DD"
    count: v.number(),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if we already have data for this date
    const existing = await ctx.db
      .query("sunspotData")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .first();

    if (existing) {
      // Update existing record
      await ctx.db.patch(existing._id, {
        count: args.count,
        timestamp: args.timestamp,
      });
    } else {
      // Insert new record
      await ctx.db.insert("sunspotData", {
        date: args.date,
        count: args.count,
        timestamp: args.timestamp,
      });
    }

    // Update MRK stock based on sunspot activity
    const mrkStock = await ctx.db
      .query("stockCompanies")
      .withIndex("by_symbol", (q) => q.eq("symbol", "MRK"))
      .first();

    if (mrkStock) {
      // Sunspot count affects MRK stock price
      // 0-50 sunspots = bearish (-20% to 0%)
      // 50-100 sunspots = neutral (-10% to +10%)
      // 100-150 sunspots = bullish (0% to +20%)
      // 150+ sunspots = very bullish (+10% to +30%)
      
      let priceMultiplier = 1;
      let trend = 0;
      
      if (args.count < 50) {
        priceMultiplier = 0.8 + (args.count / 50) * 0.2; // 0.8 to 1.0
        trend = -0.5 + (args.count / 50) * 0.5; // -0.5 to 0
      } else if (args.count < 100) {
        priceMultiplier = 0.9 + ((args.count - 50) / 50) * 0.2; // 0.9 to 1.1
        trend = ((args.count - 50) / 50) * 0.5 - 0.25; // -0.25 to 0.25
      } else if (args.count < 150) {
        priceMultiplier = 1.0 + ((args.count - 100) / 50) * 0.2; // 1.0 to 1.2
        trend = ((args.count - 100) / 50) * 0.5; // 0 to 0.5
      } else {
        priceMultiplier = 1.1 + ((Math.min(args.count, 200) - 150) / 50) * 0.2; // 1.1 to 1.3
        trend = 0.5 + ((Math.min(args.count, 200) - 150) / 50) * 0.5; // 0.5 to 1.0
      }

      // Apply sunspot influence to base price (150)
      const basePrice = 150; // MRK's original price
      const targetPrice = basePrice * priceMultiplier;
      
      // Gradually move towards target price
      const currentPrice = mrkStock.currentPrice;
      const newPrice = currentPrice + (targetPrice - currentPrice) * 0.3; // 30% movement towards target
      
      await ctx.db.patch(mrkStock._id, {
        currentPrice: newPrice,
        trend: trend,
        lastUpdated: Date.now(),
      });

      // Add a note in the price history
      await ctx.db.insert("stockPriceHistory", {
        companyId: mrkStock._id,
        symbol: "MRK",
        timestamp: Date.now(),
        open: currentPrice,
        high: Math.max(currentPrice, newPrice) * 1.01,
        low: Math.min(currentPrice, newPrice) * 0.99,
        close: newPrice,
        volume: Math.floor(Math.random() * 5000) + 1000,
        period: "5m",
      });
    }

    return { success: true, date: args.date, count: args.count };
  },
});

// Get latest sunspot data
export const getLatestSunspotData = query({
  args: {},
  handler: async (ctx) => {
    const latest = await ctx.db
      .query("sunspotData")
      .order("desc")
      .first();
    
    return latest;
  },
});

// Get sunspot history
export const getSunspotHistory = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const history = await ctx.db
      .query("sunspotData")
      .order("desc")
      .take(days);
    
    return history.reverse();
  },
});

// Fetch sunspot data from external source (mutation for now, as action requires external API)
export const fetchSunspotData = mutation({
  args: {},
  handler: async (ctx) => {
    try {
      // Note: In production, you'd fetch from the actual SIDC website
      // For now, we'll simulate with realistic data
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      
      // Simulate sunspot count (realistic range: 0-200)
      // Real implementation would scrape from https://sidc.be/SILSO/home
      const sunspotCount = Math.floor(Math.random() * 150) + 20;
      
      // Check if we already have data for this date
      const existing = await ctx.db
        .query("sunspotData")
        .withIndex("by_date", (q) => q.eq("date", dateStr))
        .first();

      if (existing) {
        // Update existing record
        await ctx.db.patch(existing._id, {
          count: sunspotCount,
          timestamp: Date.now(),
        });
      } else {
        // Insert new record
        await ctx.db.insert("sunspotData", {
          date: dateStr,
          count: sunspotCount,
          timestamp: Date.now(),
        });
      }

      // Update MRK stock based on sunspot activity
      const mrkStock = await ctx.db
        .query("stockCompanies")
        .withIndex("by_symbol", (q) => q.eq("symbol", "MRK"))
        .first();

      if (mrkStock) {
        // Sunspot count affects MRK stock price
        let priceMultiplier = 1;
        let trend = 0;
        
        if (sunspotCount < 50) {
          priceMultiplier = 0.8 + (sunspotCount / 50) * 0.2; // 0.8 to 1.0
          trend = -0.5 + (sunspotCount / 50) * 0.5; // -0.5 to 0
        } else if (sunspotCount < 100) {
          priceMultiplier = 0.9 + ((sunspotCount - 50) / 50) * 0.2; // 0.9 to 1.1
          trend = ((sunspotCount - 50) / 50) * 0.5 - 0.25; // -0.25 to 0.25
        } else if (sunspotCount < 150) {
          priceMultiplier = 1.0 + ((sunspotCount - 100) / 50) * 0.2; // 1.0 to 1.2
          trend = ((sunspotCount - 100) / 50) * 0.5; // 0 to 0.5
        } else {
          priceMultiplier = 1.1 + ((Math.min(sunspotCount, 200) - 150) / 50) * 0.2; // 1.1 to 1.3
          trend = 0.5 + ((Math.min(sunspotCount, 200) - 150) / 50) * 0.5; // 0.5 to 1.0
        }

        // Apply sunspot influence to base price (150)
        const basePrice = 150; // MRK's original price
        const targetPrice = basePrice * priceMultiplier;
        
        // Gradually move towards target price
        const currentPrice = mrkStock.currentPrice;
        const newPrice = currentPrice + (targetPrice - currentPrice) * 0.3; // 30% movement towards target
        
        await ctx.db.patch(mrkStock._id, {
          currentPrice: newPrice,
          trend: trend,
          lastUpdated: Date.now(),
        });

        // Add a note in the price history with sunspot data
        await ctx.db.insert("stockPriceHistory", {
          companyId: mrkStock._id,
          symbol: "MRK",
          timestamp: Date.now(),
          open: currentPrice,
          high: Math.max(currentPrice, newPrice) * 1.01,
          low: Math.min(currentPrice, newPrice) * 0.99,
          close: newPrice,
          volume: Math.floor(Math.random() * 5000) + 1000,
          period: "5m",
          sunspots: sunspotCount, // Store sunspot count with price data
        });
      }
      
      return { success: true, date: dateStr, count: sunspotCount };
    } catch (error) {
      console.error("Error fetching sunspot data:", error);
      return { success: false, error: String(error) };
    }
  },
});