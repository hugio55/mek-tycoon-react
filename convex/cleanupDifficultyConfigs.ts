import { mutation } from "./_generated/server";

// One-time cleanup to remove old difficulty configs with obsolete fields
export const cleanupOldConfigs = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all existing difficulty configs
    const configs = await ctx.db.query("difficultyConfigs").collect();

    let deleted = 0;

    // Delete all old configs that have the obsolete fields
    for (const config of configs) {
      // Check if config has old fields (these were removed from schema)
      const hasOldFields = 'minSlots' in config || 'maxSlots' in config || 'singleSlotChance' in config;

      if (hasOldFields) {
        await ctx.db.delete(config._id);
        deleted++;
      }
    }

    return {
      success: true,
      message: `Deleted ${deleted} old difficulty configurations. Please run initializeDefaults to create new ones.`,
      deletedCount: deleted
    };
  },
});