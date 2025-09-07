import { mutation } from "./_generated/server";

export const addSampleRecipes = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if recipes already exist
    const existingRecipes = await ctx.db.query("craftingRecipes").take(1);
    if (existingRecipes.length > 0) {
      return { message: "Recipes already exist" };
    }

    // Add sample recipes
    const recipes = [
      // Head Recipes
      {
        name: "Craft Bubblegum Head",
        outputType: "head" as const,
        outputVariation: "Bubblegum",
        essenceCost: {
          candy: 3,
          cartoon: 2,
        },
        goldCost: 50,
        cooldownMinutes: 5,
        successRate: 85,
      },
      {
        name: "Craft Paul Head",
        outputType: "head" as const,
        outputVariation: "Paul",
        essenceCost: {
          paul: 5,
          stone: 3,
        },
        goldCost: 200,
        cooldownMinutes: 15,
        successRate: 60,
      },
      {
        name: "Craft Disco Head",
        outputType: "head" as const,
        outputVariation: "Disco",
        essenceCost: {
          disco: 4,
          tiles: 2,
        },
        goldCost: 100,
        cooldownMinutes: 10,
        successRate: 75,
      },
      
      // Body Recipes
      {
        name: "Craft Chrome Body",
        outputType: "body" as const,
        outputVariation: "Chrome",
        essenceCost: {
          stone: 4,
          moss: 2,
        },
        goldCost: 80,
        cooldownMinutes: 8,
        successRate: 80,
      },
      {
        name: "Craft Cartoon Body",
        outputType: "body" as const,
        outputVariation: "Cartoon",
        essenceCost: {
          cartoon: 5,
          candy: 1,
        },
        goldCost: 60,
        cooldownMinutes: 6,
        successRate: 90,
      },
      {
        name: "Craft Frost Body",
        outputType: "body" as const,
        outputVariation: "Frost",
        essenceCost: {
          stone: 3,
          tiles: 3,
        },
        goldCost: 120,
        cooldownMinutes: 12,
        successRate: 70,
      },
      
      // Trait Recipes
      {
        name: "Craft Wings Trait",
        outputType: "trait" as const,
        outputVariation: "Wings",
        essenceCost: {
          disco: 2,
          moss: 3,
        },
        goldCost: 150,
        cooldownMinutes: 10,
        successRate: 65,
      },
      {
        name: "Craft Cannon Trait",
        outputType: "trait" as const,
        outputVariation: "Cannon",
        essenceCost: {
          stone: 5,
          tiles: 2,
        },
        goldCost: 180,
        cooldownMinutes: 12,
        successRate: 70,
      },
      {
        name: "Craft Mini Me Trait",
        outputType: "trait" as const,
        outputVariation: "Mini Me",
        essenceCost: {
          cartoon: 3,
          candy: 3,
        },
        goldCost: 90,
        cooldownMinutes: 7,
        successRate: 85,
      },
    ];

    // Insert all recipes
    for (const recipe of recipes) {
      await ctx.db.insert("craftingRecipes", recipe);
    }

    return { 
      message: "Sample recipes added successfully", 
      count: recipes.length 
    };
  },
});