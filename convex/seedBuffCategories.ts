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
      tierStart: number;
      tierEnd: number;
      isActive: boolean;
    }> = [
      // Gold & Market buffs
      { name: "Gold Flat", description: "Flat gold bonus amount", category: "gold", unitType: "flat_number", applicationType: "universal", tierStart: 1, tierEnd: 10, isActive: true },
      { name: "Gold Rate Mek", description: "Increases gold generation rate for Meks", category: "gold", unitType: "rate_change", applicationType: "attachable", tierStart: 1, tierEnd: 10, isActive: true },
      { name: "Interest Rate Bank", description: "Increases bank interest rate", category: "gold", unitType: "rate_percentage", applicationType: "universal", tierStart: 1, tierEnd: 10, isActive: true },
      { name: "Auction House Fee Reduction", description: "Reduces auction house transaction fees", category: "market", unitType: "flat_percentage", applicationType: "universal", tierStart: 1, tierEnd: 10, isActive: true },
      { name: "CircuTree Gold Cost Reduction %", description: "Reduces gold cost for CircuTree upgrades", category: "gold", unitType: "flat_percentage", applicationType: "attachable", tierStart: 1, tierEnd: 10, isActive: true },
      { name: "Discount on OE Items", description: "Discount on overexposed items", category: "market", unitType: "flat_percentage", applicationType: "universal", tierStart: 1, tierEnd: 10, isActive: true },
      { name: "Scrapyard Gold Reward Increase", description: "Increases gold rewards from scrapyard missions", category: "gold", unitType: "flat_percentage", applicationType: "universal", tierStart: 1, tierEnd: 10, isActive: true },
      { name: "Crafting Fee Reduction", description: "Reduces crafting fees", category: "market", unitType: "flat_percentage", applicationType: "universal", tierStart: 1, tierEnd: 10, isActive: true },
      
      // Essence buffs
      { name: "CircuTree Essence Cost Reduction %", description: "Reduces essence cost for CircuTree upgrades", category: "essence", unitType: "flat_percentage", applicationType: "attachable", tierStart: 1, tierEnd: 10, isActive: true },
      { name: "Essence Rate Global", description: "Global essence generation rate increase", category: "essence", unitType: "rate_change", applicationType: "universal", tierStart: 1, tierEnd: 10, isActive: true },
      { name: "Essence Rate Specific", description: "Specific essence type generation rate", category: "essence", unitType: "rate_change", applicationType: "attachable", tierStart: 1, tierEnd: 10, isActive: true },
      { name: "Scrapyard Essence Reward Increase", description: "Increases essence rewards from scrapyard", category: "essence", unitType: "flat_percentage", applicationType: "universal", tierStart: 1, tierEnd: 10, isActive: true },
      { name: "Flat Rewards of Essence", description: "Flat essence reward bonus", category: "essence", unitType: "flat_number", applicationType: "universal", tierStart: 1, tierEnd: 10, isActive: true },
      { name: "Essence Bar Cap Increase", description: "Increases maximum essence storage capacity", category: "essence", unitType: "flat_number", applicationType: "universal", tierStart: 1, tierEnd: 10, isActive: true },
      { name: "Crafting Glyph Essence Cost Reduction", description: "Reduces essence cost for crafting glyphs", category: "essence", unitType: "flat_percentage", applicationType: "universal", tierStart: 1, tierEnd: 10, isActive: true },
      
      // Looter & Rewards buffs
      { name: "Scrap Yard Loot Chance Increase", description: "Increases chance of loot from scrapyard", category: "reward_chance", unitType: "flat_percentage", applicationType: "universal", tierStart: 1, tierEnd: 10, isActive: true },
      { name: "Rarity Bias", description: "Increases chance of rare items", category: "rarity_bias", unitType: "flat_percentage", applicationType: "universal", tierStart: 1, tierEnd: 10, isActive: true },
      { name: "Fight Cooldown Timer Reduction", description: "Reduces cooldown between fights", category: "reward_chance", unitType: "flat_percentage", applicationType: "attachable", tierStart: 1, tierEnd: 10, isActive: true },
      { name: "Various Perks to Fight Mechanics", description: "Various combat improvements", category: "reward_chance", unitType: "flat_percentage", applicationType: "attachable", tierStart: 1, tierEnd: 10, isActive: true },
      { name: "XP Gain Bank", description: "Increases XP gained from banking", category: "xp", unitType: "flat_percentage", applicationType: "universal", tierStart: 1, tierEnd: 10, isActive: true },
      { name: "XP Gain Scrap Yard", description: "Increases XP gained from scrapyard", category: "xp", unitType: "flat_percentage", applicationType: "universal", tierStart: 1, tierEnd: 10, isActive: true },
      { name: "Glyph Duration", description: "Increases glyph effect duration", category: "reward_chance", unitType: "flat_percentage", applicationType: "attachable", tierStart: 1, tierEnd: 10, isActive: true },
      
      // Other buffs
      { name: "Mek Slots", description: "Additional Mek equipment slots", category: "mek_slot", unitType: "flat_number", applicationType: "attachable", tierStart: 1, tierEnd: 10, isActive: true },
    ];

    // First check if categories already exist to avoid duplicates
    const existingCategories = await ctx.db.query("buffCategories").collect();
    const existingNames = new Set(existingCategories.map(c => c.name));
    
    // Insert all buff categories that don't already exist
    const results = [];
    for (const category of buffCategories) {
      if (!existingNames.has(category.name)) {
        const id = await ctx.db.insert("buffCategories", {
          name: category.name,
          description: category.description,
          category: category.category,
          unitType: category.unitType,
          applicationType: category.applicationType,
          tierStart: category.tierStart,
          tierEnd: category.tierEnd,
          isActive: category.isActive,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        results.push(id);
      }
    }

    return { 
      success: true, 
      count: results.length,
      message: `Successfully added ${results.length} buff categories`
    };
  },
});