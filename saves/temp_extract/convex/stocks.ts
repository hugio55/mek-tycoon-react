import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// The 3 companies in our stock market
const COMPANIES = [
  {
    symbol: "MEK",
    name: "Mek Industries",
    initialPrice: 100,
    volatility: 0.3, // 30% volatility
    description: "Leading manufacturer of combat meks",
  },
  {
    symbol: "ESS",
    name: "Essence Corp",
    initialPrice: 50,
    volatility: 0.5, // 50% volatility - medium risk
    description: "Essence extraction and refinement",
  },
  {
    symbol: "MRK",
    name: "Solar Dynamics Corp",
    initialPrice: 150,
    volatility: 0.7, // 70% volatility - high risk, influenced by sunspots
    description: "Solar energy and space weather technology",
  },
];

// Initialize stock companies (run once)
export const initializeStocks = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already initialized
    const existing = await ctx.db.query("stockCompanies").collect();
    if (existing.length > 0) {
      return { message: "Stocks already initialized" };
    }

    for (const company of COMPANIES) {
      const companyId = await ctx.db.insert("stockCompanies", {
        symbol: company.symbol,
        name: company.name,
        currentPrice: company.initialPrice,
        previousClose: company.initialPrice,
        dayHigh: company.initialPrice,
        dayLow: company.initialPrice,
        volume: 0,
        marketCap: company.initialPrice * 1000000, // 1M shares outstanding
        volatility: company.volatility,
        trend: 0, // Neutral start
        lastUpdated: Date.now(),
      });

      // Generate test candlestick data for the past 30 periods
      let price = company.initialPrice;
      const now = Date.now();
      
      for (let i = 29; i >= 0; i--) {
        // Generate realistic OHLC data
        const changePercent = (Math.random() - 0.5) * company.volatility * 0.1;
        const open = price;
        const close = price * (1 + changePercent);
        
        // High and low should extend beyond open/close
        const highExtra = Math.random() * Math.abs(changePercent) * 0.5;
        const lowExtra = Math.random() * Math.abs(changePercent) * 0.5;
        
        const high = Math.max(open, close) * (1 + highExtra);
        const low = Math.min(open, close) * (1 - lowExtra);
        
        const volume = Math.floor(Math.random() * 10000) + 1000;
        
        await ctx.db.insert("stockPriceHistory", {
          companyId,
          symbol: company.symbol,
          timestamp: now - (i * 5 * 60 * 1000), // 5 minutes apart
          open,
          high,
          low,
          close,
          volume,
          period: "5m",
        });
        
        price = close; // Next candle opens at previous close
      }
    }

    return { message: "Initialized 3 stock companies with test data" };
  },
});

// Get all stock companies with current prices
export const getStockCompanies = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("stockCompanies").collect();
  },
});

// Get price history for candlestick chart
export const getPriceHistory = query({
  args: {
    symbol: v.string(),
    period: v.optional(v.union(v.literal("1m"), v.literal("5m"), v.literal("1h"), v.literal("1d"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const period = args.period || "5m";
    const limit = args.limit || 30;

    const history = await ctx.db
      .query("stockPriceHistory")
      .withIndex("by_symbol_time", (q) => q.eq("symbol", args.symbol))
      .filter((q) => q.eq(q.field("period"), period))
      .order("desc")
      .take(limit);

    return history.reverse(); // Return in chronological order
  },
});

// Get price history for all companies
export const getAllPriceHistory = query({
  args: {
    period: v.optional(v.union(v.literal("1m"), v.literal("5m"), v.literal("1h"), v.literal("1d"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const period = args.period || "5m";
    const limit = args.limit || 30;

    const companies = await ctx.db.query("stockCompanies").collect();
    const allHistory: Record<string, any[]> = {};

    for (const company of companies) {
      const history = await ctx.db
        .query("stockPriceHistory")
        .withIndex("by_symbol_time", (q) => q.eq("symbol", company.symbol))
        .filter((q) => q.eq(q.field("period"), period))
        .order("desc")
        .take(limit);
      
      allHistory[company.symbol] = history.reverse();
    }

    return allHistory;
  },
});

// Buy stocks
export const buyStock = mutation({
  args: {
    userId: v.id("users"),
    symbol: v.string(),
    shares: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.shares <= 0) {
      throw new Error("Shares must be positive");
    }

    // Get user and company
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const company = await ctx.db
      .query("stockCompanies")
      .withIndex("by_symbol", (q) => q.eq("symbol", args.symbol))
      .first();

    if (!company) {
      throw new Error("Company not found");
    }

    const totalCost = company.currentPrice * args.shares;

    if (user.gold < totalCost) {
      throw new Error(`Insufficient gold. Need ${totalCost}, have ${user.gold}`);
    }

    // Deduct gold from user
    await ctx.db.patch(args.userId, {
      gold: user.gold - totalCost,
    });

    // Check if user already has holdings in this stock
    const existingHolding = await ctx.db
      .query("stockHoldings")
      .withIndex("by_user_company", (q) =>
        q.eq("userId", args.userId).eq("companyId", company._id)
      )
      .first();

    if (existingHolding) {
      // Update existing holding
      const newShares = existingHolding.shares + args.shares;
      const newTotalInvested = existingHolding.totalInvested + totalCost;
      const newAverageCost = newTotalInvested / newShares;

      await ctx.db.patch(existingHolding._id, {
        shares: newShares,
        averageCost: newAverageCost,
        totalInvested: newTotalInvested,
        currentValue: newShares * company.currentPrice,
        lastUpdated: Date.now(),
      });
    } else {
      // Create new holding
      await ctx.db.insert("stockHoldings", {
        userId: args.userId,
        companyId: company._id,
        symbol: args.symbol,
        shares: args.shares,
        averageCost: company.currentPrice,
        totalInvested: totalCost,
        currentValue: totalCost,
        realizedProfitLoss: 0,
        lastUpdated: Date.now(),
      });
    }

    // Record transaction
    await ctx.db.insert("stockTransactions", {
      userId: args.userId,
      companyId: company._id,
      symbol: args.symbol,
      type: "buy",
      shares: args.shares,
      pricePerShare: company.currentPrice,
      totalAmount: totalCost,
      timestamp: Date.now(),
    });

    // Update volume and potentially influence price
    await updateStockPrice(ctx, company._id, args.shares, "buy");

    return {
      success: true,
      shares: args.shares,
      price: company.currentPrice,
      totalCost,
    };
  },
});

// Sell stocks
export const sellStock = mutation({
  args: {
    userId: v.id("users"),
    symbol: v.string(),
    shares: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.shares <= 0) {
      throw new Error("Shares must be positive");
    }

    const company = await ctx.db
      .query("stockCompanies")
      .withIndex("by_symbol", (q) => q.eq("symbol", args.symbol))
      .first();

    if (!company) {
      throw new Error("Company not found");
    }

    const holding = await ctx.db
      .query("stockHoldings")
      .withIndex("by_user_company", (q) =>
        q.eq("userId", args.userId).eq("companyId", company._id)
      )
      .first();

    if (!holding || holding.shares < args.shares) {
      throw new Error(`Insufficient shares. You have ${holding?.shares || 0} shares`);
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const totalRevenue = company.currentPrice * args.shares;
    const costBasis = holding.averageCost * args.shares;
    const profitLoss = totalRevenue - costBasis;

    // Update user gold
    await ctx.db.patch(args.userId, {
      gold: user.gold + totalRevenue,
    });

    // Update holding
    const remainingShares = holding.shares - args.shares;
    
    if (remainingShares === 0) {
      // Sold all shares, delete holding
      await ctx.db.delete(holding._id);
    } else {
      // Update holding with remaining shares
      await ctx.db.patch(holding._id, {
        shares: remainingShares,
        currentValue: remainingShares * company.currentPrice,
        realizedProfitLoss: holding.realizedProfitLoss + profitLoss,
        lastUpdated: Date.now(),
      });
    }

    // Record transaction
    await ctx.db.insert("stockTransactions", {
      userId: args.userId,
      companyId: company._id,
      symbol: args.symbol,
      type: "sell",
      shares: args.shares,
      pricePerShare: company.currentPrice,
      totalAmount: totalRevenue,
      timestamp: Date.now(),
    });

    // Update volume and potentially influence price
    await updateStockPrice(ctx, company._id, args.shares, "sell");

    return {
      success: true,
      shares: args.shares,
      price: company.currentPrice,
      totalRevenue,
      profitLoss,
    };
  },
});

// Get user's stock holdings
export const getUserHoldings = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const holdings = await ctx.db
      .query("stockHoldings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Calculate current values and P&L
    const holdingsWithDetails = await Promise.all(
      holdings.map(async (holding) => {
        const company = await ctx.db.get(holding.companyId);
        if (!company) return null;

        const currentValue = holding.shares * company.currentPrice;
        const unrealizedPL = currentValue - holding.totalInvested;
        const percentChange = ((currentValue - holding.totalInvested) / holding.totalInvested) * 100;

        return {
          ...holding,
          companyName: company.name,
          currentPrice: company.currentPrice,
          currentValue,
          unrealizedPL,
          percentChange,
          totalPL: holding.realizedProfitLoss + unrealizedPL,
        };
      })
    );

    return holdingsWithDetails.filter(h => h !== null);
  },
});

// Get portfolio summary
export const getPortfolioSummary = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const holdings = await ctx.db
      .query("stockHoldings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    let totalInvested = 0;
    let totalCurrentValue = 0;
    let totalRealizedPL = 0;

    for (const holding of holdings) {
      const company = await ctx.db.get(holding.companyId);
      if (company) {
        const currentValue = holding.shares * company.currentPrice;
        totalInvested += holding.totalInvested;
        totalCurrentValue += currentValue;
        totalRealizedPL += holding.realizedProfitLoss;
      }
    }

    const totalUnrealizedPL = totalCurrentValue - totalInvested;
    const totalPL = totalRealizedPL + totalUnrealizedPL;

    return {
      totalInvested,
      totalCurrentValue,
      totalRealizedPL,
      totalUnrealizedPL,
      totalPL,
      percentChange: totalInvested > 0 ? (totalUnrealizedPL / totalInvested) * 100 : 0,
    };
  },
});

// Internal function to update stock prices
async function updateStockPrice(
  ctx: any,
  companyId: Id<"stockCompanies">,
  shares: number,
  action: "buy" | "sell"
) {
  const company = await ctx.db.get(companyId);
  if (!company) return;

  // Volume affects price slightly (supply and demand)
  const volumeImpact = shares / 10000; // Every 10k shares = 1% impact
  
  // Buying pressure increases price, selling decreases
  const pressureMultiplier = action === "buy" ? 1 : -1;
  const marketPressure = volumeImpact * pressureMultiplier * 0.01; // Max 1% per trade

  // Random market movement (luck factor)
  const randomFactor = (Math.random() - 0.5) * company.volatility * 0.1; // Up to 10% of volatility

  // Trend influence (momentum)
  const trendInfluence = company.trend * 0.02;

  // Calculate new price
  const priceChange = company.currentPrice * (marketPressure + randomFactor + trendInfluence);
  let newPrice = Math.max(1, company.currentPrice + priceChange); // Price can't go below 1

  // Update trend based on price movement
  const priceMovePercent = (newPrice - company.currentPrice) / company.currentPrice;
  let newTrend = company.trend * 0.9 + priceMovePercent * 10; // Smooth trend update
  newTrend = Math.max(-1, Math.min(1, newTrend)); // Keep between -1 and 1

  // Create new candlestick data
  const open = company.currentPrice;
  const close = newPrice;
  const high = Math.max(open, close) * (1 + Math.random() * 0.02);
  const low = Math.min(open, close) * (1 - Math.random() * 0.02);

  // Update company
  await ctx.db.patch(companyId, {
    currentPrice: newPrice,
    dayHigh: Math.max(company.dayHigh, newPrice),
    dayLow: Math.min(company.dayLow, newPrice),
    volume: company.volume + shares,
    trend: newTrend,
    marketCap: newPrice * 1000000,
    lastUpdated: Date.now(),
  });

  // Record price history (for candlestick)
  await ctx.db.insert("stockPriceHistory", {
    companyId,
    symbol: company.symbol,
    timestamp: Date.now(),
    open,
    high,
    low,
    close,
    volume: shares,
    period: "5m",
  });
}

// Update all stock prices periodically (simulate market movement)
export const simulateMarket = internalMutation({
  args: {},
  handler: async (ctx) => {
    const companies = await ctx.db.query("stockCompanies").collect();

    for (const company of companies) {
      // Random walk with trend and mean reversion
      const randomWalk = (Math.random() - 0.5) * company.volatility * 0.05;
      const trendComponent = company.trend * 0.01;
      
      // Mean reversion (prices tend to return to baseline)
      const baselinePrice = COMPANIES.find(c => c.symbol === company.symbol)?.initialPrice || 100;
      const meanReversion = (baselinePrice - company.currentPrice) / baselinePrice * 0.01;

      // Small chance of big market event
      const marketEvent = Math.random() < 0.05 ? (Math.random() - 0.5) * 0.2 : 0;

      const totalChange = randomWalk + trendComponent + meanReversion + marketEvent;
      const newPrice = Math.max(1, company.currentPrice * (1 + totalChange));

      // Generate OHLC data
      const open = company.currentPrice;
      const close = newPrice;
      const high = Math.max(open, close) * (1 + Math.random() * 0.02);
      const low = Math.min(open, close) * (1 - Math.random() * 0.02);
      const volume = Math.floor(Math.random() * 5000) + 500;

      // Update trend
      let newTrend = company.trend * 0.95 + totalChange * 5;
      newTrend = Math.max(-1, Math.min(1, newTrend));

      await ctx.db.patch(company._id, {
        currentPrice: newPrice,
        dayHigh: Math.max(company.dayHigh, high),
        dayLow: Math.min(company.dayLow, low),
        trend: newTrend,
        marketCap: newPrice * 1000000,
        lastUpdated: Date.now(),
      });

      // Record new candlestick
      await ctx.db.insert("stockPriceHistory", {
        companyId: company._id,
        symbol: company.symbol,
        timestamp: Date.now(),
        open,
        high,
        low,
        close,
        volume,
        period: "5m",
      });
    }
  },
});

// Reset daily stats (run at market open)
export const resetDailyStats = internalMutation({
  args: {},
  handler: async (ctx) => {
    const companies = await ctx.db.query("stockCompanies").collect();

    for (const company of companies) {
      await ctx.db.patch(company._id, {
        previousClose: company.currentPrice,
        dayHigh: company.currentPrice,
        dayLow: company.currentPrice,
        volume: 0,
      });
    }
  },
});