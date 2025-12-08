import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Fix duplicate "Nothing" essence entries by merging them
export const fixNothingDuplicates = mutation({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const { walletAddress } = args;

    // Get all essence balances for this wallet
    const allBalances = await ctx.db
      .query("essenceBalances")
      .withIndex("", (q: any) => q.eq("walletAddress", walletAddress))
      .collect();

    // Filter for "Nothing" variations
    const nothingBalances = allBalances.filter(
      (b) => b.variationName === "Nothing"
    );

    if (nothingBalances.length <= 1) {
      return {
        success: true,
        message: "No duplicates found",
        duplicatesRemoved: 0,
      };
    }

    console.log(
      `[FixDuplicates] Found ${nothingBalances.length} 'Nothing' entries`
    );
    console.log("[FixDuplicates] Details:", nothingBalances);

    // Calculate total accumulated amount across all duplicates
    const totalAmount = nothingBalances.reduce(
      (sum, b) => sum + b.accumulatedAmount,
      0
    );

    // Keep the entry with the earliest creation (smallest _creationTime)
    // Or if one has variationId === 288, keep that one
    const correctVariationId = 288; // "Nothing" trait should be ID 288
    let keepEntry = nothingBalances.find(
      (b) => b.variationId === correctVariationId
    );

    // If no entry has the correct ID, keep the one with highest accumulated amount
    if (!keepEntry) {
      keepEntry = nothingBalances.reduce((prev, current) =>
        current.accumulatedAmount > prev.accumulatedAmount ? current : prev
      );
    }

    // Delete all other entries
    const entriesToDelete = nothingBalances.filter(
      (b) => b._id !== keepEntry!._id
    );

    for (const entry of entriesToDelete) {
      console.log(
        `[FixDuplicates] Deleting duplicate entry:`,
        entry._id,
        entry.variationId
      );
      await ctx.db.delete(entry._id);
    }

    // Update the kept entry with the correct variation ID and total amount
    console.log(
      `[FixDuplicates] Updating kept entry ${keepEntry._id} with total amount ${totalAmount}`
    );
    await ctx.db.patch(keepEntry._id, {
      variationId: correctVariationId,
      variationName: "Nothing",
      variationType: "item",
      accumulatedAmount: totalAmount,
      lastUpdated: Date.now(),
    });

    return {
      success: true,
      message: `Removed ${entriesToDelete.length} duplicate(s) and merged into one entry`,
      duplicatesRemoved: entriesToDelete.length,
      totalAmount,
      keptEntryId: keepEntry._id,
      deletedEntryIds: entriesToDelete.map((e) => e._id),
    };
  },
});
