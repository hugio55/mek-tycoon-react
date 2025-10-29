import { query } from "./_generated/server";

// Get all unique token designs
export const getAllDesigns = query({
  args: {},
  handler: async (ctx) => {
    // Query commemorative tokens to get unique designs
    const tokens = await ctx.db.query("commemorativeTokens").collect();

    // Extract unique designs
    const designs = new Set<string>();
    tokens.forEach(token => {
      if (token.design) {
        designs.add(token.design);
      }
    });

    return Array.from(designs).sort();
  },
});
