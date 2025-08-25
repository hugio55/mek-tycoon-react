import { v } from "convex/values";
import { mutation, query, action, internalMutation, internalAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Trading window configuration
const TRADING_WINDOW = {
  CUTOFF_HOUR_UTC: 10, // 10 AM UTC daily cutoff for trades
  REVEAL_HOUR_UTC: 12, // 12 PM UTC when sunspot data is fetched
  LOCK_DURATION_MS: 2 * 60 * 60 * 1000, // 2 hour lock period
  MAX_POSITION_SIZE: 100000, // Max gold per position
};

// Create a trading commitment (user places their bet before data is known)
export const commitTrade = mutation({
  args: {
    userId: v.id("users"),
    prediction: v.union(v.literal("up"), v.literal("down"), v.literal("neutral")),
    amount: v.number(),
    targetDate: v.string(), // YYYY-MM-DD format
  },
  handler: async (ctx, args) => {
    const now = new Date();
    const currentHour = now.getUTCHours();
    
    // Check if we're in the trading window (before cutoff)
    if (currentHour >= TRADING_WINDOW.CUTOFF_HOUR_UTC) {
      throw new Error(`Trading closed for today. Trading reopens at midnight UTC and closes at ${TRADING_WINDOW.CUTOFF_HOUR_UTC}:00 UTC`);
    }
    
    // Verify user has enough gold
    const user = await ctx.db.get(args.userId);
    if (!user || user.gold < args.amount) {
      throw new Error("Insufficient gold balance");
    }
    
    // Check for existing commitment for this date
    const existing = await ctx.db
      .query("sunspotCommitments")
      .withIndex("by_user_date", (q) => 
        q.eq("userId", args.userId).eq("targetDate", args.targetDate)
      )
      .first();
    
    if (existing) {
      throw new Error("You already have a position for this date");
    }
    
    // Verify amount is within limits
    if (args.amount > TRADING_WINDOW.MAX_POSITION_SIZE) {
      throw new Error(`Maximum position size is ${TRADING_WINDOW.MAX_POSITION_SIZE} gold`);
    }
    
    // Create commitment hash (for audit trail)
    const commitmentData = {
      userId: args.userId,
      prediction: args.prediction,
      amount: args.amount,
      targetDate: args.targetDate,
      timestamp: Date.now(),
      nonce: Math.random().toString(36),
    };
    
    // Store the commitment
    await ctx.db.insert("sunspotCommitments", {
      ...commitmentData,
      status: "pending",
      lockedUntil: new Date(args.targetDate).getTime() + TRADING_WINDOW.LOCK_DURATION_MS,
    });
    
    // Deduct gold from user (locked in escrow)
    await ctx.db.patch(args.userId, {
      gold: user.gold - args.amount,
    });
    
    // Record the escrow
    await ctx.db.insert("goldEscrow", {
      userId: args.userId,
      amount: args.amount,
      type: "sunspot_bet",
      targetDate: args.targetDate,
      createdAt: Date.now(),
    });
    
    return {
      success: true,
      commitment: {
        prediction: args.prediction,
        amount: args.amount,
        targetDate: args.targetDate,
        lockedUntil: new Date(args.targetDate).setUTCHours(TRADING_WINDOW.REVEAL_HOUR_UTC, 0, 0, 0),
      },
    };
  },
});

// Reveal and settle trades (called by scheduled action)
export const revealAndSettle = internalMutation({
  args: {
    date: v.string(),
    actualCount: v.number(),
    fetchedAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Get yesterday's sunspot count for comparison
    const yesterday = new Date(args.date);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const yesterdayData = await ctx.db
      .query("sunspotData")
      .withIndex("by_date", (q) => q.eq("date", yesterdayStr))
      .first();
    
    if (!yesterdayData) {
      console.error("No yesterday data to compare against");
      return { error: "No baseline data" };
    }
    
    // Determine market direction
    const percentChange = ((args.actualCount - yesterdayData.count) / yesterdayData.count) * 100;
    let marketDirection: "up" | "down" | "neutral";
    
    if (percentChange > 5) {
      marketDirection = "up";
    } else if (percentChange < -5) {
      marketDirection = "down";
    } else {
      marketDirection = "neutral";
    }
    
    // Store the official sunspot data
    await ctx.db.insert("sunspotData", {
      date: args.date,
      count: args.actualCount,
      timestamp: args.fetchedAt,
      percentChange,
      marketDirection,
      isOfficial: true,
    });
    
    // Get all pending commitments for this date
    const commitments = await ctx.db
      .query("sunspotCommitments")
      .withIndex("by_date_status", (q) => 
        q.eq("targetDate", args.date).eq("status", "pending")
      )
      .collect();
    
    // Process each commitment
    for (const commitment of commitments) {
      const won = commitment.prediction === marketDirection;
      let payout = 0;
      
      if (won) {
        // Calculate payout based on prediction accuracy
        if (marketDirection === "neutral") {
          payout = commitment.amount * 1.5; // 1.5x for neutral (harder to predict)
        } else {
          payout = commitment.amount * 2; // 2x for directional
        }
      }
      
      // Update commitment status
      await ctx.db.patch(commitment._id, {
        status: "settled",
        settledAt: Date.now(),
        marketDirection,
        actualCount: args.actualCount,
        percentChange,
        won,
        payout,
      });
      
      // Return funds to user
      if (payout > 0) {
        const user = await ctx.db.get(commitment.userId);
        if (user) {
          await ctx.db.patch(commitment.userId, {
            gold: user.gold + payout,
          });
          
          // Record transaction
          await ctx.db.insert("goldTransactions", {
            userId: commitment.userId,
            amount: payout,
            type: "sunspot_win",
            description: `Won sunspot bet: ${commitment.prediction} was correct (${percentChange.toFixed(1)}% change)`,
            timestamp: Date.now(),
          });
        }
      }
      
      // Remove from escrow
      const escrow = await ctx.db
        .query("goldEscrow")
        .withIndex("by_user_date", (q) => 
          q.eq("userId", commitment.userId).eq("targetDate", args.date)
        )
        .first();
      
      if (escrow) {
        await ctx.db.delete(escrow._id);
      }
    }
    
    // Update MRK stock price based on sunspot count
    await ctx.runMutation(internal.sunspotAntiCheat.updateMRKPrice, {
      sunspotCount: args.actualCount,
      date: args.date,
    });
    
    return {
      success: true,
      settled: commitments.length,
      marketDirection,
      percentChange,
    };
  },
});

// Scheduled action to fetch sunspot data at reveal time
export const scheduledSunspotFetch = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // Check if we already fetched today's data
    const existing = await ctx.runQuery(api.sunspotAntiCheat.checkDataExists, {
      date: todayStr,
    });
    
    if (existing) {
      return { message: "Already fetched today's data" };
    }
    
    try {
      // In production, fetch from SIDC API
      // For now, simulate with realistic data
      const sunspotCount = Math.floor(Math.random() * 150) + 20;
      
      // Settle all commitments with the official data
      await ctx.runMutation(internal.sunspotAntiCheat.revealAndSettle, {
        date: todayStr,
        actualCount: sunspotCount,
        fetchedAt: Date.now(),
      });
      
      return { success: true, count: sunspotCount };
    } catch (error) {
      console.error("Failed to fetch sunspot data:", error);
      return { error: String(error) };
    }
  },
});

// Internal query to check if data exists
export const checkDataExists = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const data = await ctx.db
      .query("sunspotData")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .filter((q) => q.eq(q.field("isOfficial"), true))
      .first();
    
    return !!data;
  },
});

// Get user's active commitments
export const getUserCommitments = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const commitments = await ctx.db
      .query("sunspotCommitments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(10);
    
    return commitments;
  },
});

// Get trading window status
export const getTradingStatus = query({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    const currentHour = now.getUTCHours();
    const todayStr = now.toISOString().split('T')[0];
    
    // Check if trading is open
    const tradingOpen = currentHour < TRADING_WINDOW.CUTOFF_HOUR_UTC;
    
    // Check if today's data has been revealed
    const todayData = await ctx.db
      .query("sunspotData")
      .withIndex("by_date", (q) => q.eq("date", todayStr))
      .filter((q) => q.eq(q.field("isOfficial"), true))
      .first();
    
    // Get next reveal time
    let nextReveal = new Date();
    if (currentHour >= TRADING_WINDOW.REVEAL_HOUR_UTC) {
      // Next reveal is tomorrow
      nextReveal.setDate(nextReveal.getDate() + 1);
    }
    nextReveal.setUTCHours(TRADING_WINDOW.REVEAL_HOUR_UTC, 0, 0, 0);
    
    // Get next trading window
    let nextTradingWindow = new Date();
    if (!tradingOpen) {
      // Trading reopens tomorrow at midnight
      nextTradingWindow.setDate(nextTradingWindow.getDate() + 1);
    }
    nextTradingWindow.setUTCHours(0, 0, 0, 0);
    
    return {
      tradingOpen,
      currentHour,
      cutoffHour: TRADING_WINDOW.CUTOFF_HOUR_UTC,
      revealHour: TRADING_WINDOW.REVEAL_HOUR_UTC,
      todayRevealed: !!todayData,
      nextReveal: nextReveal.getTime(),
      nextTradingWindow: nextTradingWindow.getTime(),
      maxPositionSize: TRADING_WINDOW.MAX_POSITION_SIZE,
    };
  },
});

// Update MRK price based on sunspot data (internal)
export const updateMRKPrice = internalMutation({
  args: {
    sunspotCount: v.number(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const mrkStock = await ctx.db
      .query("stockCompanies")
      .withIndex("by_symbol", (q) => q.eq("symbol", "MRK"))
      .first();
    
    if (!mrkStock) {
      return { error: "MRK stock not found" };
    }
    
    // Calculate price impact
    let priceMultiplier = 1;
    let trend = 0;
    
    if (args.sunspotCount < 50) {
      priceMultiplier = 0.8 + (args.sunspotCount / 50) * 0.2;
      trend = -0.5 + (args.sunspotCount / 50) * 0.5;
    } else if (args.sunspotCount < 100) {
      priceMultiplier = 0.9 + ((args.sunspotCount - 50) / 50) * 0.2;
      trend = ((args.sunspotCount - 50) / 50) * 0.5 - 0.25;
    } else if (args.sunspotCount < 150) {
      priceMultiplier = 1.0 + ((args.sunspotCount - 100) / 50) * 0.2;
      trend = ((args.sunspotCount - 100) / 50) * 0.5;
    } else {
      priceMultiplier = 1.1 + ((Math.min(args.sunspotCount, 200) - 150) / 50) * 0.2;
      trend = 0.5 + ((Math.min(args.sunspotCount, 200) - 150) / 50) * 0.5;
    }
    
    const basePrice = 150;
    const targetPrice = basePrice * priceMultiplier;
    const currentPrice = mrkStock.currentPrice;
    const newPrice = currentPrice + (targetPrice - currentPrice) * 0.3;
    
    await ctx.db.patch(mrkStock._id, {
      currentPrice: newPrice,
      trend: trend,
      lastUpdated: Date.now(),
      lastSunspotCount: args.sunspotCount,
    });
    
    // Record in price history
    await ctx.db.insert("stockPriceHistory", {
      companyId: mrkStock._id,
      symbol: "MRK",
      timestamp: Date.now(),
      open: currentPrice,
      high: Math.max(currentPrice, newPrice) * 1.01,
      low: Math.min(currentPrice, newPrice) * 0.99,
      close: newPrice,
      volume: Math.floor(Math.random() * 5000) + 1000,
      period: "1d" as const,
      sunspots: args.sunspotCount,
    });
    
    return { success: true, newPrice };
  },
});