import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * ADMIN: Force unlock a slot for testing
 */
export const forceUnlockSlot = mutation({
  args: {
    walletAddress: v.string(),
    slotNumber: v.number()
  },
  handler: async (ctx, args) => {
    const slot = await ctx.db
      .query("essenceSlots")
      .withIndex("by_wallet_and_slot", (q) =>
        q.eq("walletAddress", args.walletAddress).eq("slotNumber", args.slotNumber)
      )
      .first();

    if (!slot) {
      throw new Error(`Slot ${args.slotNumber} not found for wallet`);
    }

    const now = Date.now();
    await ctx.db.patch(slot._id, {
      isUnlocked: true,
      unlockedAt: now,
      lastModified: now,
    });

    return {
      success: true,
      message: `Slot ${args.slotNumber} unlocked`,
      slot
    };
  }
});
