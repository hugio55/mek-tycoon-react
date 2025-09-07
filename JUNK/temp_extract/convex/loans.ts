import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Apply for a loan
export const applyForLoan = mutation({
  args: {
    userId: v.id("users"),
    loanAmount: v.number(),
    duration: v.number(), // Days
    collateralType: v.optional(v.union(
      v.literal("mek"),
      v.literal("essence"),
      v.literal("items")
    )),
    collateralId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.loanAmount <= 0) {
      throw new Error("Loan amount must be positive");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get bank account to check loan limit
    const account = await ctx.db
      .query("bankAccounts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!account) {
      throw new Error("Bank account required for loans");
    }

    const maxLoanAmount = account.maxLoanAmount || 0;
    if (args.loanAmount > maxLoanAmount) {
      throw new Error(`Loan amount exceeds maximum limit of ${maxLoanAmount}`);
    }

    // Check for existing active loans
    const activeLoans = await ctx.db
      .query("loans")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const totalExistingDebt = activeLoans.reduce((sum, loan) => sum + loan.remainingAmount, 0);

    if (totalExistingDebt + args.loanAmount > maxLoanAmount) {
      throw new Error(`Total debt would exceed maximum limit of ${maxLoanAmount}`);
    }

    // Calculate interest rate based on account level and collateral
    let interestRate = 5; // Base 5% interest
    
    switch (account.accountLevel) {
      case "diamond":
        interestRate = 2;
        break;
      case "platinum":
        interestRate = 2.5;
        break;
      case "gold":
        interestRate = 3;
        break;
      case "silver":
        interestRate = 4;
        break;
    }

    // Reduce interest if collateral provided
    if (args.collateralType) {
      interestRate *= 0.8; // 20% reduction with collateral
    }

    // Calculate daily payment
    const totalWithInterest = args.loanAmount * (1 + interestRate / 100);
    const dailyPayment = Math.ceil(totalWithInterest / args.duration);

    // Calculate collateral value if provided
    let collateralValue = 0;
    if (args.collateralType === "mek" && args.collateralId) {
      const collateralId = args.collateralId; // TypeScript narrowing
      const mek = await ctx.db
        .query("meks")
        .withIndex("by_asset_id", (q) => q.eq("assetId", collateralId))
        .first();
      
      if (mek) {
        collateralValue = mek.marketValue || 10000; // Default mek value
      }
    }

    // Create the loan
    const loanId = await ctx.db.insert("loans", {
      userId: args.userId,
      loanAmount: args.loanAmount,
      remainingAmount: totalWithInterest,
      interestRate,
      dailyPayment,
      collateralType: args.collateralType,
      collateralId: args.collateralId,
      collateralValue,
      startDate: Date.now(),
      dueDate: Date.now() + (args.duration * 24 * 60 * 60 * 1000),
      status: "active",
      defaultCount: 0,
    });

    // Disburse loan amount to user
    await ctx.db.patch(args.userId, {
      gold: user.gold + args.loanAmount,
    });

    // Record transaction
    await ctx.db.insert("bankTransactions", {
      userId: args.userId,
      type: "loan_disbursement",
      amount: args.loanAmount,
      balanceBefore: user.gold,
      balanceAfter: user.gold + args.loanAmount,
      description: `Loan approved for ${args.loanAmount} gold`,
      relatedId: loanId,
      timestamp: Date.now(),
      status: "completed",
    });

    return {
      success: true,
      loanId,
      loanAmount: args.loanAmount,
      totalToRepay: totalWithInterest,
      dailyPayment,
      interestRate,
    };
  },
});

// Make loan payment
export const makeLoanPayment = mutation({
  args: {
    userId: v.id("users"),
    loanId: v.id("loans"),
    amount: v.optional(v.number()), // If not specified, pays daily amount
  },
  handler: async (ctx, args) => {
    const loan = await ctx.db.get(args.loanId);
    if (!loan) {
      throw new Error("Loan not found");
    }

    if (loan.userId !== args.userId) {
      throw new Error("Unauthorized");
    }

    if (loan.status !== "active") {
      throw new Error("Loan is not active");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const paymentAmount = args.amount || loan.dailyPayment;
    
    if (user.gold < paymentAmount) {
      throw new Error("Insufficient gold for payment");
    }

    const actualPayment = Math.min(paymentAmount, loan.remainingAmount);
    const newRemaining = loan.remainingAmount - actualPayment;

    // Update user gold
    await ctx.db.patch(args.userId, {
      gold: user.gold - actualPayment,
    });

    // Update loan
    const updates: any = {
      remainingAmount: newRemaining,
      lastPaymentDate: Date.now(),
    };

    if (newRemaining <= 0) {
      updates.status = "paid";
      
      // Return collateral if any
      if (loan.collateralType === "mek" && loan.collateralId) {
        // Mark mek as no longer collateral
        const collateralId = loan.collateralId; // TypeScript narrowing
        const mek = await ctx.db
          .query("meks")
          .withIndex("by_asset_id", (q) => q.eq("assetId", collateralId))
          .first();
        
        if (mek) {
          await ctx.db.patch(mek._id, {
            isStaked: false,
          });
        }
      }
    }

    await ctx.db.patch(args.loanId, updates);

    // Record transaction
    await ctx.db.insert("bankTransactions", {
      userId: args.userId,
      type: "loan_payment",
      amount: actualPayment,
      balanceBefore: user.gold,
      balanceAfter: user.gold - actualPayment,
      description: `Loan payment of ${actualPayment} gold`,
      relatedId: args.loanId,
      timestamp: Date.now(),
      status: "completed",
    });

    return {
      success: true,
      amountPaid: actualPayment,
      remainingDebt: newRemaining,
      loanStatus: newRemaining <= 0 ? "paid" : "active",
    };
  },
});

// Get user's loans
export const getUserLoans = query({
  args: {
    userId: v.id("users"),
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("paid"),
      v.literal("defaulted"),
      v.literal("forgiven")
    )),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("loans")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    const loans = await query.collect();

    // Calculate additional info for each loan
    return loans.map(loan => {
      const daysRemaining = Math.max(0, Math.ceil((loan.dueDate - Date.now()) / (1000 * 60 * 60 * 24)));
      const isOverdue = Date.now() > loan.dueDate && loan.status === "active";
      const progressPercentage = ((loan.loanAmount * (1 + loan.interestRate / 100) - loan.remainingAmount) / 
                                  (loan.loanAmount * (1 + loan.interestRate / 100))) * 100;

      return {
        ...loan,
        daysRemaining,
        isOverdue,
        progressPercentage: Math.round(progressPercentage),
      };
    });
  },
});

// Check for overdue loans and apply penalties
export const checkOverdueLoans = mutation({
  args: {},
  handler: async (ctx) => {
    const overdueLoans = await ctx.db
      .query("loans")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .filter((q) => q.lt(q.field("dueDate"), Date.now()))
      .collect();

    for (const loan of overdueLoans) {
      // Increment default count
      const currentDefaultCount = loan.defaultCount || 0;
      await ctx.db.patch(loan._id, {
        defaultCount: currentDefaultCount + 1,
      });

      // After 3 defaults, mark as defaulted
      if (currentDefaultCount >= 2) {
        await ctx.db.patch(loan._id, {
          status: "defaulted",
        });

        // Lock bank account
        const account = await ctx.db
          .query("bankAccounts")
          .withIndex("by_user", (q) => q.eq("userId", loan.userId))
          .first();

        if (account) {
          await ctx.db.patch(account._id, {
            isLocked: true,
          });
        }

        // Seize collateral if any
        if (loan.collateralType === "mek" && loan.collateralId) {
          // Transfer mek ownership to bank
          const collateralId = loan.collateralId; // TypeScript narrowing
          const mek = await ctx.db
            .query("meks")
            .withIndex("by_asset_id", (q) => q.eq("assetId", collateralId))
            .first();
          
          if (mek) {
            await ctx.db.patch(mek._id, {
              owner: "bank_seized",
            });
          }
        }
      }
    }

    return {
      processedCount: overdueLoans.length,
    };
  },
});

// Get loan summary statistics
export const getLoanStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const loans = await ctx.db
      .query("loans")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const activeLoans = loans.filter(l => l.status === "active");
    const paidLoans = loans.filter(l => l.status === "paid");
    const defaultedLoans = loans.filter(l => l.status === "defaulted");

    const totalBorrowed = loans.reduce((sum, l) => sum + l.loanAmount, 0);
    const totalRepaid = paidLoans.reduce((sum, l) => sum + l.loanAmount * (1 + l.interestRate / 100), 0);
    const currentDebt = activeLoans.reduce((sum, l) => sum + l.remainingAmount, 0);
    const dailyPaymentsDue = activeLoans.reduce((sum, l) => sum + l.dailyPayment, 0);

    return {
      totalLoans: loans.length,
      activeLoans: activeLoans.length,
      paidLoans: paidLoans.length,
      defaultedLoans: defaultedLoans.length,
      totalBorrowed,
      totalRepaid,
      currentDebt,
      dailyPaymentsDue,
      creditScore: calculateCreditScore(loans),
    };
  },
});

// Calculate credit score based on loan history
function calculateCreditScore(loans: any[]): number {
  if (loans.length === 0) return 500; // Default score

  let score = 500;
  
  // Positive factors
  const paidLoans = loans.filter(l => l.status === "paid").length;
  score += paidLoans * 50; // +50 for each paid loan

  // Negative factors
  const defaultedLoans = loans.filter(l => l.status === "defaulted").length;
  score -= defaultedLoans * 100; // -100 for each default

  const activeDefaults = loans
    .filter(l => l.status === "active")
    .reduce((sum, l) => sum + l.defaultCount, 0);
  score -= activeDefaults * 25; // -25 for each missed payment

  // Cap between 0 and 1000
  return Math.max(0, Math.min(1000, score));
}