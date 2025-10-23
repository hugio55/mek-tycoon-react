import { internalMutation, action } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * PUBLIC ACTION: Unlock slot 1 for all users
 * Slot 1 should always be unlocked by default, but some users were initialized before this was working
 */
export const unlockSlot1ForAllUsers = action({
  args: {},
  handler: async (ctx) => {
    console.log('[Migration] Unlocking slot 1 for all users...');
    const result = await ctx.runMutation(internal.migrateUnlockSlot1.unlockSlot1);
    return result;
  }
});

/**
 * MIGRATION: Unlock slot 1 for all users who have it locked
 */
export const unlockSlot1 = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log('[Migration] Starting slot 1 unlock...');

    // Get all slot 1 records
    const allSlot1s = await ctx.db
      .query("essenceSlots")
      .filter((q) => q.eq(q.field("slotNumber"), 1))
      .collect();

    console.log(`[Migration] Found ${allSlot1s.length} slot 1 records`);

    let unlockedCount = 0;
    let alreadyUnlockedCount = 0;
    const now = Date.now();

    for (const slot of allSlot1s) {
      if (slot.isUnlocked) {
        alreadyUnlockedCount++;
        console.log(`[Migration] Slot 1 already unlocked for: ${slot.walletAddress.substring(0, 20)}...`);
      } else {
        await ctx.db.patch(slot._id, {
          isUnlocked: true,
          unlockedAt: now,
          lastModified: now,
        });
        unlockedCount++;
        console.log(`[Migration] ✓ Unlocked slot 1 for: ${slot.walletAddress.substring(0, 20)}...`);
      }
    }

    console.log('[Migration] Complete!');
    console.log(`[Migration] Unlocked: ${unlockedCount}`);
    console.log(`[Migration] Already unlocked: ${alreadyUnlockedCount}`);

    return {
      success: true,
      totalSlots: allSlot1s.length,
      unlocked: unlockedCount,
      alreadyUnlocked: alreadyUnlockedCount
    };
  }
});
