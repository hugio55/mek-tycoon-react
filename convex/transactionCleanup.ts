import { internalMutation } from "./_generated/server";

/**
 * Transaction History Cleanup - Cleanup old transaction records
 *
 * Transaction tables can grow unbounded without cleanup, consuming storage.
 * We keep longer retention for financial records (90 days) for audit purposes.
 */

// Clean up old stock price history (keep 90 days for charts)
export const cleanupOldStockPriceHistory = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const daysToKeep = 90;
    const cutoffTime = now - (daysToKeep * 24 * 60 * 60 * 1000);

    try {
      console.log(`Starting stock price history cleanup: removing records older than ${new Date(cutoffTime).toLocaleString()}`);

      const oldRecords = await ctx.db
        .query("stockPriceHistory")
        .filter((q) => q.lt(q.field("timestamp"), cutoffTime))
        .collect();

      let deletedCount = 0;
      for (const record of oldRecords) {
        await ctx.db.delete(record._id);
        deletedCount++;
      }

      console.log(`Stock price history cleanup: ${deletedCount} records deleted`);

      return {
        success: true,
        deletedRecords: deletedCount,
        cutoffDate: new Date(cutoffTime).toLocaleString(),
      };
    } catch (error) {
      console.error("Stock price history cleanup failed:", error);
      return { success: false, error: String(error) };
    }
  },
});

// Clean up old gold transactions (keep 90 days)
export const cleanupOldGoldTransactions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const daysToKeep = 90;
    const cutoffTime = now - (daysToKeep * 24 * 60 * 60 * 1000);

    try {
      console.log(`Starting gold transaction cleanup: removing records older than ${new Date(cutoffTime).toLocaleString()}`);

      const oldRecords = await ctx.db
        .query("goldTransactions")
        .filter((q) => q.lt(q.field("timestamp"), cutoffTime))
        .collect();

      let deletedCount = 0;
      for (const record of oldRecords) {
        await ctx.db.delete(record._id);
        deletedCount++;
      }

      console.log(`Gold transaction cleanup: ${deletedCount} records deleted`);

      return {
        success: true,
        deletedRecords: deletedCount,
        cutoffDate: new Date(cutoffTime).toLocaleString(),
      };
    } catch (error) {
      console.error("Gold transaction cleanup failed:", error);
      return { success: false, error: String(error) };
    }
  },
});

// Clean up old bank transactions (keep 90 days for financial records)
export const cleanupOldBankTransactions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const daysToKeep = 90;
    const cutoffTime = now - (daysToKeep * 24 * 60 * 60 * 1000);

    try {
      console.log(`Starting bank transaction cleanup: removing records older than ${new Date(cutoffTime).toLocaleString()}`);

      const oldRecords = await ctx.db
        .query("bankTransactions")
        .filter((q) => q.lt(q.field("timestamp"), cutoffTime))
        .collect();

      let deletedCount = 0;
      for (const record of oldRecords) {
        await ctx.db.delete(record._id);
        deletedCount++;
      }

      console.log(`Bank transaction cleanup: ${deletedCount} records deleted`);

      return {
        success: true,
        deletedRecords: deletedCount,
        cutoffDate: new Date(cutoffTime).toLocaleString(),
      };
    } catch (error) {
      console.error("Bank transaction cleanup failed:", error);
      return { success: false, error: String(error) };
    }
  },
});

// Clean up old stock transactions (keep 90 days)
export const cleanupOldStockTransactions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const daysToKeep = 90;
    const cutoffTime = now - (daysToKeep * 24 * 60 * 60 * 1000);

    try {
      console.log(`Starting stock transaction cleanup: removing records older than ${new Date(cutoffTime).toLocaleString()}`);

      const oldRecords = await ctx.db
        .query("stockTransactions")
        .filter((q) => q.lt(q.field("timestamp"), cutoffTime))
        .collect();

      let deletedCount = 0;
      for (const record of oldRecords) {
        await ctx.db.delete(record._id);
        deletedCount++;
      }

      console.log(`Stock transaction cleanup: ${deletedCount} records deleted`);

      return {
        success: true,
        deletedRecords: deletedCount,
        cutoffDate: new Date(cutoffTime).toLocaleString(),
      };
    } catch (error) {
      console.error("Stock transaction cleanup failed:", error);
      return { success: false, error: String(error) };
    }
  },
});
