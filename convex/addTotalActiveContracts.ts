import { mutation } from "./_generated/server";

export const addTotalActiveContracts = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if it already exists
    const existing = await ctx.db
      .query("buffCategories")
      .filter((q) => q.eq(q.field("name"), "Total Active Contracts"))
      .first();

    if (existing) {
      return {
        success: false,
        message: "Total Active Contracts already exists"
      };
    }

    // Add the new buff category
    const id = await ctx.db.insert("buffCategories", {
      name: "Total Active Contracts",
      description: "Additional active contract slots for scrap yard missions",
      category: "mek_slot",
      unitType: "flat_number",
      applicationType: "universal",
      tierStart: 1,
      tierEnd: 10,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      success: true,
      id,
      message: "Successfully added Total Active Contracts buff category"
    };
  },
});