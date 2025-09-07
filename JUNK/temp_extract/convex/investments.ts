import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Investment product configurations
const INVESTMENT_PRODUCTS: Record<string, {
  name: string;
  minAmount: number;
  interestRate: number;
  maturityDays: number;
  riskLevel: string;
  description: string;
}> = {
  fixed_deposit: {
    name: "Fixed Deposit",
    minAmount: 1000,
    interestRate: 3, // 3% daily
    maturityDays: 7,
    riskLevel: "low" as const,
    description: "Guaranteed returns with fixed interest rate",
  },
  mek_fund: {
    name: "Mek Index Fund",
    minAmount: 5000,
    interestRate: 5, // 5% average daily (variable)
    maturityDays: 14,
    riskLevel: "medium" as const,
    description: "Invest in a diversified portfolio of Meks",
  },
  essence_bonds: {
    name: "Essence Bonds",
    minAmount: 2500,
    interestRate: 4, // 4% daily
    maturityDays: 10,
    riskLevel: "low" as const,
    description: "Backed by essence reserves",
  },
  marketplace_fund: {
    name: "Marketplace Trading Fund",
    minAmount: 10000,
    interestRate: 8, // 8% average daily (high variance)
    maturityDays: 30,
    riskLevel: "high" as const,
    description: "Active trading in the marketplace",
  },
  high_risk: {
    name: "Venture Capital Fund",
    minAmount: 25000,
    interestRate: 15, // 15% potential daily (very high risk)
    maturityDays: 60,
    riskLevel: "extreme" as const,
    description: "High risk, high reward investments",
  },
};

// Get available investment products
export const getInvestmentProducts = query({
  args: {},
  handler: async () => {
    return Object.entries(INVESTMENT_PRODUCTS).map(([type, product]) => ({
      type,
      ...product,
    }));
  },
});

// Create new investment
export const createInvestment = mutation({
  args: {
    userId: v.id("users"),
    investmentType: v.union(
      v.literal("fixed_deposit"),
      v.literal("mek_fund"),
      v.literal("essence_bonds"),
      v.literal("marketplace_fund"),
      v.literal("high_risk")
    ),
    amount: v.number(),
    autoRenew: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const product = INVESTMENT_PRODUCTS[args.investmentType];
    
    if (args.amount < product.minAmount) {
      throw new Error(`Minimum investment amount is ${product.minAmount} gold`);
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.gold < args.amount) {
      throw new Error("Insufficient gold");
    }

    // Check investment limits
    const activeInvestments = await ctx.db
      .query("investments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const totalActiveInvestments = activeInvestments.reduce(
      (sum, inv) => sum + inv.currentValue,
      0
    );

    if (totalActiveInvestments + args.amount > 1000000) {
      throw new Error("Total investment limit of 1,000,000 gold exceeded");
    }

    // Calculate maturity date
    const maturityDate = Date.now() + (product.maturityDays * 24 * 60 * 60 * 1000);

    // Deduct gold from user
    await ctx.db.patch(args.userId, {
      gold: user.gold - args.amount,
    });

    // Create investment
    const investmentId = await ctx.db.insert("investments", {
      userId: args.userId,
      investmentType: args.investmentType,
      principalAmount: args.amount,
      currentValue: args.amount,
      interestRate: product.interestRate,
      maturityDate,
      startDate: Date.now(),
      status: "active",
      autoRenew: args.autoRenew || false,
      riskLevel: product.riskLevel,
    });

    // Record transaction
    await ctx.db.insert("bankTransactions", {
      userId: args.userId,
      type: "investment_purchase",
      amount: args.amount,
      balanceBefore: user.gold,
      balanceAfter: user.gold - args.amount,
      description: `Invested in ${product.name}`,
      relatedId: investmentId,
      timestamp: Date.now(),
      status: "completed",
    });

    return {
      success: true,
      investmentId,
      product: product.name,
      amount: args.amount,
      maturityDate,
      expectedReturn: Math.floor(args.amount * (1 + product.interestRate * product.maturityDays / 100)),
    };
  },
});

// Calculate and update investment values
export const updateInvestmentValues = mutation({
  args: {},
  handler: async (ctx) => {
    const activeInvestments = await ctx.db
      .query("investments")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    for (const investment of activeInvestments) {
      const product = INVESTMENT_PRODUCTS[investment.investmentType];
      const daysSinceStart = Math.floor((Date.now() - investment.startDate) / (1000 * 60 * 60 * 24));
      
      // Calculate value based on risk level
      let growthRate = product.interestRate / 100;
      
      // Add variance for higher risk investments
      if (investment.riskLevel === "medium") {
        growthRate *= (0.8 + Math.random() * 0.4); // 80% to 120% of base rate
      } else if (investment.riskLevel === "high") {
        growthRate *= (0.5 + Math.random() * 1.0); // 50% to 150% of base rate
      } else if (investment.riskLevel === "extreme") {
        const roll = Math.random();
        if (roll < 0.1) {
          growthRate = -0.5; // 10% chance of 50% loss
        } else if (roll < 0.3) {
          growthRate = 0; // 20% chance of no growth
        } else {
          growthRate *= (1.0 + Math.random() * 1.5); // 70% chance of 100% to 250% of base rate
        }
      }

      const newValue = Math.max(
        0,
        Math.floor(investment.currentValue * (1 + growthRate))
      );

      await ctx.db.patch(investment._id, {
        currentValue: newValue,
      });

      // Check for maturity
      if (investment.maturityDate && Date.now() >= investment.maturityDate) {
        await processMaturedInvestment(ctx, investment._id);
      }
    }

    return {
      processedCount: activeInvestments.length,
    };
  },
});

// Process matured investment
async function processMaturedInvestment(ctx: any, investmentId: any) {
  const investment = await ctx.db.get(investmentId);
  if (!investment) return;

  const user = await ctx.db.get(investment.userId);
  if (!user) return;

  if (investment.autoRenew) {
    // Auto-renew the investment
    await ctx.db.patch(investmentId, {
      principalAmount: investment.currentValue,
      startDate: Date.now(),
      maturityDate: Date.now() + (INVESTMENT_PRODUCTS[investment.investmentType as keyof typeof INVESTMENT_PRODUCTS].maturityDays * 24 * 60 * 60 * 1000),
    });
  } else {
    // Pay out the investment
    await ctx.db.patch(investment.userId, {
      gold: user.gold + investment.currentValue,
    });

    await ctx.db.patch(investmentId, {
      status: "matured",
    });

    // Record transaction
    await ctx.db.insert("bankTransactions", {
      userId: investment.userId,
      type: "investment_redemption",
      amount: investment.currentValue,
      balanceBefore: user.gold,
      balanceAfter: user.gold + investment.currentValue,
      description: `Investment matured: ${INVESTMENT_PRODUCTS[investment.investmentType as keyof typeof INVESTMENT_PRODUCTS].name}`,
      relatedId: investmentId,
      timestamp: Date.now(),
      status: "completed",
    });
  }
}

// Withdraw investment early (with penalty)
export const withdrawInvestment = mutation({
  args: {
    userId: v.id("users"),
    investmentId: v.id("investments"),
  },
  handler: async (ctx, args) => {
    const investment = await ctx.db.get(args.investmentId);
    if (!investment) {
      throw new Error("Investment not found");
    }

    if (investment.userId !== args.userId) {
      throw new Error("Unauthorized");
    }

    if (investment.status !== "active") {
      throw new Error("Investment is not active");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Calculate early withdrawal penalty
    const daysRemaining = Math.max(0, Math.ceil((investment.maturityDate! - Date.now()) / (1000 * 60 * 60 * 24)));
    const product = INVESTMENT_PRODUCTS[investment.investmentType];
    const penaltyRate = Math.min(50, daysRemaining * 2); // 2% penalty per day remaining, max 50%
    const penaltyAmount = Math.floor(investment.currentValue * (penaltyRate / 100));
    const withdrawAmount = investment.currentValue - penaltyAmount;

    // Update user gold
    await ctx.db.patch(args.userId, {
      gold: user.gold + withdrawAmount,
    });

    // Update investment status
    await ctx.db.patch(args.investmentId, {
      status: "withdrawn",
    });

    // Record transaction
    await ctx.db.insert("bankTransactions", {
      userId: args.userId,
      type: "investment_redemption",
      amount: withdrawAmount,
      balanceBefore: user.gold,
      balanceAfter: user.gold + withdrawAmount,
      description: `Early withdrawal from ${product.name} (${penaltyRate}% penalty)`,
      relatedId: args.investmentId,
      timestamp: Date.now(),
      status: "completed",
    });

    return {
      success: true,
      withdrawAmount,
      penaltyAmount,
      penaltyRate,
    };
  },
});

// Get user's investments
export const getUserInvestments = query({
  args: {
    userId: v.id("users"),
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("matured"),
      v.literal("withdrawn"),
      v.literal("cancelled")
    )),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("investments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    const investments = await query.collect();

    return investments.map(inv => {
      const product = INVESTMENT_PRODUCTS[inv.investmentType];
      const daysRemaining = inv.maturityDate 
        ? Math.max(0, Math.ceil((inv.maturityDate - Date.now()) / (1000 * 60 * 60 * 24)))
        : 0;
      const roi = ((inv.currentValue - inv.principalAmount) / inv.principalAmount) * 100;

      return {
        ...inv,
        productName: product.name,
        daysRemaining,
        roi: Math.round(roi * 100) / 100, // Round to 2 decimals
        isMatured: inv.maturityDate ? Date.now() >= inv.maturityDate : false,
      };
    });
  },
});

// Get investment portfolio summary
export const getPortfolioSummary = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const investments = await ctx.db
      .query("investments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const activeInvestments = investments.filter(i => i.status === "active");
    const totalInvested = activeInvestments.reduce((sum, i) => sum + i.principalAmount, 0);
    const currentValue = activeInvestments.reduce((sum, i) => sum + i.currentValue, 0);
    const totalReturns = investments.reduce((sum, i) => {
      if (i.status === "matured" || i.status === "withdrawn") {
        return sum + (i.currentValue - i.principalAmount);
      }
      return sum;
    }, 0);

    // Calculate portfolio distribution
    const distribution = activeInvestments.reduce((acc, inv) => {
      const type = inv.investmentType;
      if (!acc[type]) {
        acc[type] = {
          count: 0,
          value: 0,
          percentage: 0,
        };
      }
      acc[type].count++;
      acc[type].value += inv.currentValue;
      return acc;
    }, {} as Record<string, any>);

    // Calculate percentages
    Object.keys(distribution).forEach(type => {
      distribution[type].percentage = (distribution[type].value / currentValue) * 100;
    });

    return {
      activeCount: activeInvestments.length,
      totalInvested,
      currentValue,
      unrealizedGains: currentValue - totalInvested,
      realizedGains: totalReturns,
      totalReturns: currentValue - totalInvested + totalReturns,
      roi: totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0,
      distribution,
    };
  },
});