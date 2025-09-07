import { v } from "convex/values";
import { query } from "./_generated/server";

export const searchGameItems = query({
  args: {
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    const results: Array<{
      id: string;
      name: string;
      type: string;
      category?: string;
      rarity?: string;
      imageUrl?: string;
    }> = [];

    const searchLower = args.searchTerm.toLowerCase();
    if (!searchLower || searchLower.length < 2) {
      return results;
    }

    // Search Meks (Heads, Bodies, Traits)
    const meks = await ctx.db
      .query("meks")
      .take(50);

    // Add unique head variations
    const headVariations = new Set<string>();
    const bodyVariations = new Set<string>();
    const itemVariations = new Set<string>();

    meks.forEach(mek => {
      if (mek.headVariation && mek.headVariation.toLowerCase().includes(searchLower)) {
        headVariations.add(mek.headVariation);
      }
      if (mek.bodyVariation && mek.bodyVariation.toLowerCase().includes(searchLower)) {
        bodyVariations.add(mek.bodyVariation);
      }
      if (mek.itemVariation && mek.itemVariation.toLowerCase().includes(searchLower)) {
        itemVariations.add(mek.itemVariation);
      }
    });

    headVariations.forEach(head => {
      results.push({
        id: `head-${head}`,
        name: `${head} Head`,
        type: "Head",
        category: "Mek Component",
      });
    });

    bodyVariations.forEach(body => {
      results.push({
        id: `body-${body}`,
        name: `${body} Body`,
        type: "Body",
        category: "Mek Component",
      });
    });

    itemVariations.forEach(item => {
      results.push({
        id: `trait-${item}`,
        name: `${item} Trait`,
        type: "Trait",
        category: "Mek Component",
      });
    });

    // Search Variations Reference for more comprehensive results
    const variations = await ctx.db
      .query("variationsReference")
      .collect();

    variations.forEach(variation => {
      if (variation.name?.toLowerCase().includes(searchLower)) {
        const typeLabel = variation.type === 'head' ? 'Head' : 
                         variation.type === 'body' ? 'Body' : 'Trait';
        
        const itemId = `${variation.type}-${variation.variationId}-${variation.name}`;
        
        // Check if we already have this item
        if (!results.some(r => r.id === itemId)) {
          results.push({
            id: itemId,
            name: `${variation.name} ${typeLabel}`,
            type: typeLabel,
            category: "Mek Component",
            imageUrl: variation.imageUrl,
          });
        }
      }
    });

    // Search Crafting Recipes
    const recipes = await ctx.db
      .query("craftingRecipes")
      .collect();

    recipes.forEach(recipe => {
      if (recipe.name?.toLowerCase().includes(searchLower)) {
        results.push({
          id: `recipe-${recipe._id}`,
          name: recipe.name,
          type: "Crafted Item",
          category: "Crafting",
        });
      }
    });

    // Search Inventory Items
    const inventoryItems = await ctx.db
      .query("inventory")
      .take(100);

    inventoryItems.forEach(item => {
      if (item.itemVariation?.toLowerCase().includes(searchLower)) {
        results.push({
          id: `inventory-${item._id}`,
          name: item.itemVariation,
          type: item.itemType || "Item",
          category: "Inventory",
        });
      }
    });

    // Add Essence types
    const essenceTypes = [
      "Gold Essence", "Silver Essence", "Bronze Essence",
      "Fire Essence", "Water Essence", "Earth Essence", "Air Essence",
      "Light Essence", "Dark Essence", "Chaos Essence", "Order Essence",
      "Time Essence", "Space Essence", "Life Essence", "Death Essence"
    ];

    essenceTypes.forEach(essence => {
      if (essence.toLowerCase().includes(searchLower)) {
        results.push({
          id: `essence-${essence.toLowerCase().replace(' ', '-')}`,
          name: essence,
          type: "Essence",
          category: "Resource",
        });
      }
    });

    // Add common game items
    const commonItems = [
      { name: "Gold", type: "Currency" },
      { name: "XP Boost", type: "Consumable" },
      { name: "Health Potion", type: "Consumable" },
      { name: "Mana Potion", type: "Consumable" },
      { name: "Upgrade Stone", type: "Material" },
      { name: "Enchantment Scroll", type: "Material" },
      { name: "Rare Frame", type: "Cosmetic" },
      { name: "Epic Frame", type: "Cosmetic" },
      { name: "Legendary Frame", type: "Cosmetic" },
    ];

    commonItems.forEach(item => {
      if (item.name.toLowerCase().includes(searchLower)) {
        results.push({
          id: `common-${item.name.toLowerCase().replace(/\s+/g, '-')}`,
          name: item.name,
          type: item.type,
          category: "Common",
        });
      }
    });

    // Remove duplicates and sort by relevance
    const uniqueResults = results.filter((item, index, self) =>
      index === self.findIndex((t) => t.id === item.id)
    );

    // Sort by how well the search term matches (exact matches first)
    uniqueResults.sort((a, b) => {
      const aExact = a.name.toLowerCase() === searchLower;
      const bExact = b.name.toLowerCase() === searchLower;
      const aStarts = a.name.toLowerCase().startsWith(searchLower);
      const bStarts = b.name.toLowerCase().startsWith(searchLower);
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      
      return a.name.localeCompare(b.name);
    });

    return uniqueResults.slice(0, 10); // Return top 10 matches
  },
});