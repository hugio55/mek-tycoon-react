// Quick admin fix to set Lightning's variation ID
import { mutation } from "./_generated/server";

export const fixLightning = mutation({
  args: {},
  handler: async (ctx) => {
    // Find all slots with Lightning head but missing ID
    const allSlots = await ctx.db.query("essenceSlots").collect();

    let fixed = 0;
    for (const slot of allSlots) {
      if (slot.headVariationName === "Lightning" && !slot.headVariationId) {
        // Lightning is variation ID 94
        await ctx.db.patch(slot._id, {
          headVariationId: 94,
          lastModified: Date.now()
        });
        console.log(`✅ Fixed slot ${slot.slotNumber}: Lightning ID set to 94`);
        fixed++;
      }
    }

    return { success: true, fixed };
  }
});
