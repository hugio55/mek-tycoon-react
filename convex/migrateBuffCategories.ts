import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Delete all existing buff categories without schema validation
export const deleteAllOldBuffCategories = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all documents from the buffCategories table
    const allCategories = await ctx.db.query("buffCategories").collect();
    
    let deletedCount = 0;
    
    // Delete each one
    for (const category of allCategories) {
      await ctx.db.delete(category._id);
      deletedCount++;
    }
    
    return { 
      success: true, 
      deletedCount,
      message: `Successfully deleted ${deletedCount} old buff categories`
    };
  },
});