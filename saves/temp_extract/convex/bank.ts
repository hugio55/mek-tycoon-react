import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get or create bank account for user
export const getOrCreateAccount = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("bankAccounts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      return existing;
    }

    // Create new bank account with default values
    const accountId = await ctx.db.insert("bankAccounts", {
      userId: args.userId,
      balance: 0,
      interestRate: 1.0, // 1% daily interest
      lastInterestPaid: Date.now(),
      totalDeposited: 0,
      totalWithdrawn: 0,
      totalInterestEarned: 0,
      createdAt: Date.now(),
    });

    return await ctx.db.get(accountId);
  },
});

// Get bank account details
export const getAccount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bankAccounts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// Deposit gold into bank
export const deposit = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.amount <= 0) {
      throw new Error("Deposit amount must be positive");
    }

    // Get user and bank account
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.gold < args.amount) {
      throw new Error("Insufficient gold");
    }

    const account = await ctx.db
      .query("bankAccounts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!account) {
      throw new Error("Bank account not found");
    }


    const balanceBefore = account.balance;
    const balanceAfter = balanceBefore + args.amount;

    // Update user gold
    await ctx.db.patch(args.userId, {
      gold: user.gold - args.amount,
    });

    // Update bank account
    await ctx.db.patch(account._id, {
      balance: balanceAfter,
      totalDeposited: account.totalDeposited + args.amount,
    });

    // Record transaction
    await ctx.db.insert("bankTransactions", {
      userId: args.userId,
      type: "deposit",
      amount: args.amount,
      balanceBefore,
      balanceAfter,
      description: `Deposited ${args.amount} gold`,
      timestamp: Date.now(),
      status: "completed",
    });


    return { success: true, newBalance: balanceAfter };
  },
});

// Withdraw gold from bank
export const withdraw = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.amount <= 0) {
      throw new Error("Withdrawal amount must be positive");
    }

    const account = await ctx.db
      .query("bankAccounts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!account) {
      throw new Error("Bank account not found");
    }


    if (account.balance < args.amount) {
      throw new Error("Insufficient bank balance");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const balanceBefore = account.balance;
    const balanceAfter = balanceBefore - args.amount;

    // Update bank account
    await ctx.db.patch(account._id, {
      balance: balanceAfter,
      totalWithdrawn: account.totalWithdrawn + args.amount,
    });

    // Update user gold
    await ctx.db.patch(args.userId, {
      gold: user.gold + args.amount,
    });

    // Record transaction
    await ctx.db.insert("bankTransactions", {
      userId: args.userId,
      type: "withdraw",
      amount: args.amount,
      balanceBefore,
      balanceAfter,
      description: `Withdrew ${args.amount} gold`,
      timestamp: Date.now(),
      status: "completed",
    });

    return { success: true, newBalance: balanceAfter };
  },
});

// Calculate and pay interest
export const calculateInterest = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query("bankAccounts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!account) {
      throw new Error("Bank account not found");
    }

    const now = Date.now();
    const hoursSinceLastPayment = (now - account.lastInterestPaid) / (1000 * 60 * 60);
    
    // Interest paid every 24 hours
    if (hoursSinceLastPayment < 24) {
      return {
        success: false,
        message: `Interest will be paid in ${Math.ceil(24 - hoursSinceLastPayment)} hours`,
      };
    }

    const interestAmount = Math.floor(account.balance * (account.interestRate / 100));
    
    if (interestAmount > 0) {
      const balanceBefore = account.balance;
      const balanceAfter = balanceBefore + interestAmount;

      await ctx.db.patch(account._id, {
        balance: balanceAfter,
        lastInterestPaid: now,
        totalInterestEarned: account.totalInterestEarned + interestAmount,
      });

      await ctx.db.insert("bankTransactions", {
        userId: args.userId,
        type: "interest_payment",
        amount: interestAmount,
        balanceBefore,
        balanceAfter,
        description: `Daily interest payment (${account.interestRate}%)`,
        timestamp: now,
        status: "completed",
      });

      return {
        success: true,
        interestEarned: interestAmount,
        newBalance: balanceAfter,
      };
    }

    return {
      success: false,
      message: "No interest earned (balance too low)",
    };
  },
});

// Get recent transactions
export const getTransactions = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    return await ctx.db
      .query("bankTransactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
  },
});


// Get account stats
export const getAccountStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query("bankAccounts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!account) {
      return null;
    }

    // Calculate next interest payment
    const hoursUntilInterest = Math.max(
      0,
      24 - (Date.now() - account.lastInterestPaid) / (1000 * 60 * 60)
    );

    const nextInterestAmount = Math.floor(account.balance * (account.interestRate / 100));

    return {
      account,
      hoursUntilInterest: Math.ceil(hoursUntilInterest),
      nextInterestAmount,
    };
  },
});