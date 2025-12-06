import { mutation } from "./_generated/server";

export const addAccordionCraftingTree = mutation({
  args: {},
  handler: async (ctx) => {
    // Step 1: Accordion → Gatling recipe
    const gatlingRecipe = {
      name: "Upgrade Accordion to Gatling",
      outputType: "head" as const,
      outputVariation: "Gatling",
      requiredItems: [
        { itemType: "head", itemVariation: "Accordion", quantity: 1 }
      ],
      essenceCost: {
        mechanical: 5,
        metal: 3,
      },
      goldCost: 250,
      cooldownMinutes: 20,
      successRate: 75,
      tier: 2,
      prerequisites: ["Accordion"],
    };

    // Step 2: Gatling → Branch recipes
    const branchRecipes = [
      {
        name: "Transform Gatling to Bark",
        outputType: "head" as const,
        outputVariation: "Bark",
        requiredItems: [
          { itemType: "head", itemVariation: "Gatling", quantity: 1 }
        ],
        essenceCost: {
          nature: 4,
          wood: 6,
        },
        goldCost: 400,
        cooldownMinutes: 30,
        successRate: 70,
        tier: 3,
        prerequisites: ["Gatling"],
      },
      {
        name: "Transform Gatling to Cadillac",
        outputType: "head" as const,
        outputVariation: "Cadillac",
        requiredItems: [
          { itemType: "head", itemVariation: "Gatling", quantity: 1 }
        ],
        essenceCost: {
          luxury: 5,
          metal: 5,
        },
        goldCost: 500,
        cooldownMinutes: 35,
        successRate: 65,
        tier: 3,
        prerequisites: ["Gatling"],
      },
      {
        name: "Transform Gatling to Bumblebee",
        outputType: "head" as const,
        outputVariation: "Bumblebee",
        requiredItems: [
          { itemType: "head", itemVariation: "Gatling", quantity: 1 }
        ],
        essenceCost: {
          nature: 3,
          candy: 4,
        },
        goldCost: 350,
        cooldownMinutes: 25,
        successRate: 80,
        tier: 3,
        prerequisites: ["Gatling"],
      },
      {
        name: "Transform Gatling to Snow",
        outputType: "head" as const,
        outputVariation: "Snow",
        requiredItems: [
          { itemType: "head", itemVariation: "Gatling", quantity: 1 }
        ],
        essenceCost: {
          frost: 6,
          crystal: 2,
        },
        goldCost: 450,
        cooldownMinutes: 30,
        successRate: 72,
        tier: 3,
        prerequisites: ["Gatling"],
      },
    ];

    // Insert all recipes
    const allRecipes = [gatlingRecipe, ...branchRecipes];
    
    for (const recipe of allRecipes) {
      // Check if recipe already exists
      const existing = await ctx.db
        .query("craftingRecipes")
        .filter((q) => 
          q.and(
            q.eq(q.field("outputType"), recipe.outputType),
            q.eq(q.field("outputVariation"), recipe.outputVariation)
          )
        )
        .first();
      
      if (!existing) {
        // Remove fields that don't exist in schema
        const { tier, prerequisites, requiredItems, essenceCost, ...validRecipe } = recipe;
        
        // Convert essenceCost to match schema (ignoring the non-matching essence types for now)
        const schemaEssenceCost = {
          stone: 0,
          disco: 0,
          paul: 0,
          cartoon: 0,
          candy: 0,
          tiles: 0,
          moss: 0,
          bullish: 0,
          journalist: 0,
          laser: 0,
          flashbulb: 0,
          accordion: (essenceCost as any).mechanical || 0,
          turret: (essenceCost as any).metal || 0,
          drill: (essenceCost as any).nature || (essenceCost as any).wood || 0,
          security: 0,
        };
        
        await ctx.db.insert("craftingRecipes", {
          ...validRecipe,
          essenceCost: schemaEssenceCost,
        } as any);
      }
    }

    return { 
      message: "Accordion crafting tree added successfully",
      recipes: allRecipes.map((r: any) => r.name)
    };
  },
});

// Query to get the crafting tree for a specific item
export const getCraftingTree = mutation({
  args: {},
  handler: async (ctx) => {
    const tree = {
      root: "Accordion",
      branches: [
        {
          name: "Gatling",
          tier: 2,
          branches: [
            { name: "Bark", tier: 3 },
            { name: "Cadillac", tier: 3 },
            { name: "Bumblebee", tier: 3 },
            { name: "Snow", tier: 3 },
          ]
        }
      ]
    };
    
    return tree;
  },
});