import { mutation } from "./_generated/server";

type Category = "gold" | "essence" | "rarity_bias" | "xp" | "mek_slot" | "market" | "reward_chance";
type UnitType = "flat_number" | "rate_change" | "rate_percentage" | "flat_percentage";
type ApplicationType = "universal" | "attachable";

export const seedAll = mutation({
  args: {},
  handler: async (ctx) => {
    const buffCategories: Array<{
      name: string;
      description: string;
      category: Category;
      unitType: UnitType;
      applicationType: ApplicationType;
      isActive: boolean;
    }> = [
      // Gold-related buffs
      { name: "Gold Flat", description: "Flat gold bonus amount", category: "gold", unitType: "flat_number", applicationType: "universal", isActive: true },
      { name: "Gold Rate Mek", description: "Increases gold generation rate for Meks", category: "gold", unitType: "rate_change", applicationType: "attachable", isActive: true },
      { name: "Interest Rate Bank", description: "Increases bank interest rate", category: "gold", unitType: "rate_percentage", applicationType: "universal", isActive: true },
      { name: "Auction House Fee Reduction", description: "Reduces auction house transaction fees", category: "market", unitType: "flat_percentage", applicationType: "universal", isActive: true },
      { name: "CircuTree Gold Cost Reduction %", description: "Reduces gold cost for CircuTree upgrades", category: "gold", unitType: "flat_percentage", applicationType: "attachable", isActive: true },
      { name: "Discount on OE Items", description: "Discount on overexposed items", category: "market", unitType: "flat_percentage", applicationType: "universal", isActive: true },
      { name: "Scrapyard Gold Reward Increase", description: "Increases gold rewards from scrapyard missions", category: "gold", unitType: "flat_percentage", applicationType: "universal", isActive: true },
      { name: "Crafting Fee Reduction", description: "Reduces crafting fees", category: "market", unitType: "flat_percentage", applicationType: "universal", isActive: true },
      
      // Essence-related buffs
      { name: "CircuTree Essence Cost Reduction %", description: "Reduces essence cost for CircuTree upgrades", category: "essence", unitType: "flat_percentage", applicationType: "attachable", isActive: true },
      { name: "Essence Rate Global", description: "Global essence generation rate increase", category: "essence", unitType: "rate_change", applicationType: "universal", isActive: true },
      { name: "Essence Rate Specific", description: "Specific essence type generation rate", category: "essence", unitType: "rate_change", applicationType: "attachable", isActive: true },
      { name: "Scrapyard Essence Reward Increase", description: "Increases essence rewards from scrapyard", category: "essence", unitType: "flat_percentage", applicationType: "universal", isActive: true },
      { name: "Flat Rewards of Essence", description: "Flat essence reward bonus", category: "essence", unitType: "flat_number", applicationType: "universal", isActive: true },
      { name: "Essence Bar Cap Increase", description: "Increases maximum essence storage capacity", category: "essence", unitType: "flat_number", applicationType: "universal", isActive: true },
      { name: "Crafting Essence Cost Reduction", description: "Reduces essence cost for crafting", category: "essence", unitType: "flat_percentage", applicationType: "universal", isActive: true },
      
      // Looter-related buffs
      { name: "Scrap Yard Loot Chance Increase", description: "Increases chance of loot from scrapyard", category: "reward_chance", unitType: "flat_percentage", applicationType: "universal", isActive: true },
      { name: "Rarity Bias", description: "Increases chance of rare items", category: "rarity_bias", unitType: "flat_percentage", applicationType: "universal", isActive: true },
      { name: "Fight Cooldown Timer Reduction", description: "Reduces cooldown between fights", category: "reward_chance", unitType: "flat_percentage", applicationType: "attachable", isActive: true },
      { name: "Various Perks to Fight Mechanics", description: "Various combat improvements", category: "reward_chance", unitType: "flat_percentage", applicationType: "attachable", isActive: true },
      { name: "XP Gain Bank", description: "Increases XP gained from banking", category: "xp", unitType: "flat_percentage", applicationType: "universal", isActive: true },
      { name: "XP Gain Scrap Yard", description: "Increases XP gained from scrapyard", category: "xp", unitType: "flat_percentage", applicationType: "universal", isActive: true },
      { name: "Glyph Duration", description: "Increases glyph effect duration", category: "reward_chance", unitType: "flat_percentage", applicationType: "attachable", isActive: true },
      
      // Ambiguous/Misc buffs
      { name: "Mek Slots", description: "Additional Mek equipment slots", category: "mek_slot", unitType: "flat_number", applicationType: "attachable", isActive: true },
    ];

    // Insert all buff categories
    const results = [];
    for (const category of buffCategories) {
      const id = await ctx.db.insert("buffCategories", {
        name: category.name,
        description: category.description,
        category: category.category,
        unitType: category.unitType,
        applicationType: category.applicationType,
        isActive: category.isActive,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      results.push(id);
    }

    return { 
      success: true, 
      count: results.length,
      message: `Successfully added ${results.length} buff categories`
    };
  },
});