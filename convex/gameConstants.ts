import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all game constants (as query for reading)
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const constants = await ctx.db.query("gameConstants").collect();
    return constants.length > 0 ? constants : getDefaultConstants();
  },
});

// Get all game constants (as mutation for manual loading)
export const loadAll = mutation({
  args: {},
  handler: async (ctx) => {
    const constants = await ctx.db.query("gameConstants").collect();
    return constants.length > 0 ? constants : getDefaultConstants();
  },
});

// Save all game constants (replace entire collection)
export const saveAll = mutation({
  args: {
    constants: v.array(v.object({
      category: v.string(),
      setting: v.string(),
      value: v.union(v.string(), v.number()),
      description: v.string(),
      configurable: v.boolean(),
    }))
  },
  handler: async (ctx, args) => {
    // Delete all existing constants
    const existing = await ctx.db.query("gameConstants").collect();
    for (const constant of existing) {
      await ctx.db.delete(constant._id);
    }

    // Insert new constants
    for (const constant of args.constants) {
      await ctx.db.insert("gameConstants", {
        ...constant,
        updatedAt: Date.now(),
      });
    }

    return { success: true, count: args.constants.length };
  },
});

// Helper function to get default constants
function getDefaultConstants() {
  return [
    // Inventory System
    { category: 'Inventory', setting: 'Max Stack Size', value: 99, description: 'Maximum quantity per stackable item slot', configurable: false },
    { category: 'Inventory', setting: 'Slots Per Tab', value: 20, description: 'Number of inventory slots in each tab', configurable: false },
    { category: 'Inventory', setting: 'Max Tabs', value: 10, description: 'Maximum inventory tabs a player can unlock', configurable: false },
    { category: 'Inventory', setting: 'Tab 2 Cost', value: 100, description: 'Gold cost to unlock second tab', configurable: true },
    { category: 'Inventory', setting: 'Tab 3 Cost', value: 500, description: 'Gold cost to unlock third tab', configurable: true },
    { category: 'Inventory', setting: 'Tab 4 Cost', value: 2000, description: 'Gold cost to unlock fourth tab', configurable: true },
    { category: 'Inventory', setting: 'Tab 5 Cost', value: 10000, description: 'Gold cost to unlock fifth tab', configurable: true },
    { category: 'Inventory', setting: 'Tab 6 Cost', value: 50000, description: 'Gold cost to unlock sixth tab', configurable: true },
    { category: 'Inventory', setting: 'Tab 7 Cost', value: 200000, description: 'Gold cost to unlock seventh tab', configurable: true },
    { category: 'Inventory', setting: 'Tab 8 Cost', value: 1000000, description: 'Gold cost to unlock eighth tab', configurable: true },
    { category: 'Inventory', setting: 'Tab 9 Cost', value: 5000000, description: 'Gold cost to unlock ninth tab', configurable: true },
    { category: 'Inventory', setting: 'Tab 10 Cost', value: 25000000, description: 'Gold cost to unlock tenth tab', configurable: true },

    // Starting Resources
    { category: 'New Player', setting: 'Starting Gold', value: 100, description: 'Gold given to new players', configurable: true },
    { category: 'New Player', setting: 'Starting Gold/Hour', value: 50, description: 'Initial passive gold generation rate', configurable: true },
    { category: 'New Player', setting: 'Starting Contract Slots', value: 2, description: 'Number of contracts new players can run', configurable: true },
    { category: 'New Player', setting: 'Starting Crafting Slots', value: 1, description: 'Simultaneous crafts for new players', configurable: true },
    { category: 'New Player', setting: 'Starting Chip Slots/Mek', value: 3, description: 'Chip slots per Mek for new players', configurable: true },

    // Starting Essence
    { category: 'New Player', setting: 'Starting Stone Essence', value: 10, description: 'Stone essence for new players', configurable: true },
    { category: 'New Player', setting: 'Starting Cartoon Essence', value: 5, description: 'Cartoon essence for new players', configurable: true },
    { category: 'New Player', setting: 'Starting Candy Essence', value: 5, description: 'Candy essence for new players', configurable: true },
    { category: 'New Player', setting: 'Starting Tiles Essence', value: 5, description: 'Tiles essence for new players', configurable: true },
    { category: 'New Player', setting: 'Starting Moss Essence', value: 5, description: 'Moss essence for new players', configurable: true },

    // Crafting System
    { category: 'Crafting', setting: 'Base Craft Time', value: '5 min', description: 'Default crafting duration', configurable: true },
    { category: 'Crafting', setting: 'Max Crafting Slots', value: 5, description: 'Maximum crafting slots purchasable', configurable: false },
    { category: 'Crafting', setting: 'Slot Cost Multiplier', value: 2, description: 'Cost multiplies by this for each new slot', configurable: true },
    { category: 'Crafting', setting: 'Success Rate Base', value: '80%', description: 'Base chance for successful craft', configurable: true },

    // Contracts System
    { category: 'Contracts', setting: 'Max Contract Slots', value: 10, description: 'Maximum contract slots with buffs', configurable: false },
    { category: 'Contracts', setting: 'Min Contract Duration', value: '15 min', description: 'Shortest contract time', configurable: true },
    { category: 'Contracts', setting: 'Max Contract Duration', value: '24 hours', description: 'Longest contract time', configurable: true },
    { category: 'Contracts', setting: 'Contract Refresh Rate', value: '1 hour', description: 'New contracts appear every', configurable: true },

    // Mek System
    { category: 'Meks', setting: 'Max Level', value: 100, description: 'Maximum Mek level', configurable: false },
    { category: 'Meks', setting: 'XP Per Level', value: 1000, description: 'Base XP required per level', configurable: true },
    { category: 'Meks', setting: 'Level Scaling', value: 1.15, description: 'XP requirement multiplier per level', configurable: true },
    { category: 'Meks', setting: 'Max Chips Per Mek', value: 6, description: 'Maximum chips with all upgrades', configurable: false },
    { category: 'Meks', setting: 'Employee Gold Rate', value: '10/hr', description: 'Base gold per employee Mek', configurable: true },

    // Chip System
    { category: 'Chips', setting: 'Rank Tiers', value: 'D,C,B,A,S,SS,SSS,X,XX,XXX', description: 'Available chip ranks', configurable: false },
    { category: 'Chips', setting: 'Rank Multipliers', value: '1x,1.5x,2x,3x,5x,7x,10x,15x,20x,30x', description: 'Buff multiplier per rank', configurable: true },
    { category: 'Chips', setting: 'Universal Chip Chance', value: '5%', description: 'Chance to craft universal chip', configurable: true },
    { category: 'Chips', setting: 'Chip Removal Cost', value: 100, description: 'Gold to remove chip without destroying', configurable: true },

    // Banking System
    { category: 'Banking', setting: 'Base Interest Rate', value: '1%', description: 'Daily interest rate', configurable: true },
    { category: 'Banking', setting: 'Silver Account Rate', value: '2%', description: 'Silver tier interest', configurable: true },
    { category: 'Banking', setting: 'Gold Account Rate', value: '3%', description: 'Gold tier interest', configurable: true },
    { category: 'Banking', setting: 'Max Loan Amount', value: 10000, description: 'Maximum borrowable gold', configurable: true },
    { category: 'Banking', setting: 'Loan Interest', value: '5%', description: 'Daily loan interest', configurable: true },

    // Market System
    { category: 'Market', setting: 'Listing Fee', value: '5%', description: 'Fee to list items', configurable: true },
    { category: 'Market', setting: 'Sale Tax', value: '10%', description: 'Tax on successful sales', configurable: true },
    { category: 'Market', setting: 'Max Listings', value: 20, description: 'Max simultaneous listings', configurable: true },
    { category: 'Market', setting: 'Listing Duration', value: '7 days', description: 'How long listings stay active', configurable: true },

    // Achievement System
    { category: 'Achievements', setting: 'Total Achievements', value: 250, description: 'Number of achievements in game', configurable: false },
    { category: 'Achievements', setting: 'Achievement Points', value: 10000, description: 'Total points available', configurable: false },
    { category: 'Achievements', setting: 'Hidden Achievements', value: 25, description: 'Secret achievements', configurable: false },

    // Essence System
    { category: 'Essence', setting: 'Essence Types', value: 15, description: 'Number of essence varieties', configurable: false },
    { category: 'Essence', setting: 'Essence Cap Base', value: 1000, description: 'Base storage limit per essence', configurable: true },
    { category: 'Essence', setting: 'Cap Upgrade Cost', value: 500, description: 'Gold to increase cap by 100', configurable: true },
    { category: 'Essence', setting: 'Essence Drop Rate', value: '30%', description: 'Base chance from activities', configurable: true },

    // Story Mode - Structure
    { category: 'Story Structure', setting: 'Total Chapters', value: 10, description: 'Number of story chapters', configurable: false },
    { category: 'Story Structure', setting: 'Nodes Per Chapter', value: 420, description: 'Total nodes in each chapter', configurable: false },
    { category: 'Story Structure', setting: 'Normal Nodes Per Chapter', value: 350, description: 'Standard mechanism nodes', configurable: false },
    { category: 'Story Structure', setting: 'Challenger Nodes Per Chapter', value: 40, description: 'Harder nodes with better rewards', configurable: false },
    { category: 'Story Structure', setting: 'Event Nodes Per Chapter', value: 20, description: 'Special event encounters (non-Mek)', configurable: false },
    { category: 'Story Structure', setting: 'Mini-Boss Nodes Per Chapter', value: 9, description: 'Mini-boss encounters', configurable: false },
    { category: 'Story Structure', setting: 'Final Boss Nodes Per Chapter', value: 1, description: 'Chapter-ending boss', configurable: false },
    { category: 'Story Structure', setting: 'Total Mek Nodes Per Chapter', value: 400, description: 'Total Mek nodes (excluding events)', configurable: false },
    { category: 'Story Structure', setting: 'Total Nodes in Game', value: 4200, description: '10 chapters × 420 nodes', configurable: false },
    { category: 'Story Structure', setting: 'Total Unique Mechanisms', value: 4000, description: 'Unique Meks needed (ranks 1-4000)', configurable: false },

    // Story Mode - Difficulty
    { category: 'Story Difficulty', setting: 'Challenger Difficulty Multiplier', value: 1.5, description: 'Difficulty increase for challenger nodes', configurable: true },
    { category: 'Story Difficulty', setting: 'Boss Difficulty Scaling', value: 1.5, description: 'Boss power multiplier per chapter', configurable: true },
    { category: 'Story Difficulty', setting: 'Story Reset Cost', value: 1000, description: 'Gold to reset story progress', configurable: true },

    // Story Mode - Rarity Ranges
    { category: 'Story Rarity', setting: 'Final Boss Ranks', value: '1-10', description: 'Top 10 rarest Meks', configurable: false },
    { category: 'Story Rarity', setting: 'Mini-Boss Ranks', value: '11-100', description: 'Next 90 rarest Meks', configurable: false },
    { category: 'Story Rarity', setting: 'Challenger Ranks', value: '101-500', description: 'Next 400 rarest Meks', configurable: false },
    { category: 'Story Rarity', setting: 'Normal Mek Ranks', value: '501-4000', description: 'Common to uncommon Meks (3500 total)', configurable: false },
  ];
}