import { mutation } from "./_generated/server";

export const fixMek3412Image = mutation({
  args: {},
  handler: async (ctx) => {
    // Find Mek #3412
    const mek3412 = await ctx.db
      .query("meks")
      .withIndex("by_asset_id", (q) => q.eq("assetId", "3412"))
      .first();
    
    if (mek3412) {
      // Fix the iconUrl to use 000-000-000 (the correct source key)
      await ctx.db.patch(mek3412._id, {
        iconUrl: "/meks/000-000-000.jpg",
        sourceKeyBase: "000-000-000"
      });
      
      return { 
        success: true, 
        message: "Fixed Mek #3412 to use 000-000-000",
        previousUrl: mek3412.iconUrl
      };
    }
    
    // Also fix any other meks that might be using 101-010-101
    const meksWithWrongImage = await ctx.db
      .query("meks")
      .collect();
    
    let fixedCount = 0;
    for (const mek of meksWithWrongImage) {
      if (mek.iconUrl?.includes("101-010-101")) {
        await ctx.db.patch(mek._id, {
          iconUrl: "/meks/000-000-000.jpg",
          sourceKeyBase: "000-000-000"
        });
        fixedCount++;
      }
    }
    
    return { 
      success: true, 
      message: `Fixed ${fixedCount} meks to use correct 000-000-000 image`,
      mek3412Fixed: !!mek3412
    };
  },
});