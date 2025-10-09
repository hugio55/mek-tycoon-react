import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const migrateExistingConnections = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all existing discord connections
    const connections = await ctx.db.query("discordConnections").collect();

    let updated = 0;
    let skipped = 0;

    for (const connection of connections) {
      // Check if already migrated (has isPrimary field)
      if (connection.isPrimary !== undefined) {
        skipped++;
        continue;
      }

      // Update with new fields
      await ctx.db.patch(connection._id, {
        isPrimary: true, // All existing connections become primary
        linkedAt: connection._creationTime, // Use creation time as linked time
        // walletNickname is optional, leave undefined
      });

      updated++;
    }

    return {
      success: true,
      updated,
      skipped,
      total: connections.length,
    };
  },
});
