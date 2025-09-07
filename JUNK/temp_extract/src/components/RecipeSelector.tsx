"use client";

import { Id } from "../../convex/_generated/dataModel";

interface Recipe {
  _id: Id<"craftingRecipes">;
  name: string;
  outputType: "head" | "body" | "trait";
  outputVariation: string;
  essenceCost: Record<string, number | undefined>;
  goldCost?: number;
  cooldownMinutes: number;
  successRate: number;
}

interface RecipeSelectorProps {
  recipes: Recipe[];
  selectedRecipe: Id<"craftingRecipes"> | null;
  onSelectRecipe: (recipeId: Id<"craftingRecipes"> | null) => void;
  userEssence: Record<string, number>;
  userGold: number;
}

export default function RecipeSelector({
  recipes,
  selectedRecipe,
  onSelectRecipe,
  userEssence,
  userGold,
}: RecipeSelectorProps) {
  const canAfford = (recipe: Recipe) => {
    // Check gold
    if (recipe.goldCost && recipe.goldCost > userGold) {
      return false;
    }
    
    // Check essences
    for (const [essence, cost] of Object.entries(recipe.essenceCost)) {
      if (cost && cost > 0) {
        if (!userEssence[essence] || userEssence[essence] < cost) {
          return false;
        }
      }
    }
    
    return true;
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "head": return "📷";
      case "body": return "🤖";
      case "trait": return "⚡";
      default: return "❓";
    }
  };
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case "head": return "text-blue-400 border-blue-500/50 bg-blue-900/20";
      case "body": return "text-green-400 border-green-500/50 bg-green-900/20";
      case "trait": return "text-purple-400 border-purple-500/50 bg-purple-900/20";
      default: return "text-gray-400 border-gray-500/50 bg-gray-900/20";
    }
  };
  
  // Group recipes by type
  const groupedRecipes = recipes.reduce((acc, recipe) => {
    if (!acc[recipe.outputType]) {
      acc[recipe.outputType] = [];
    }
    acc[recipe.outputType].push(recipe);
    return acc;
  }, {} as Record<string, Recipe[]>);
  
  return (
    <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
      {Object.entries(groupedRecipes).map(([type, typeRecipes]) => (
        <div key={type}>
          <h3 className={`text-sm font-semibold mb-2 ${getTypeColor(type).split(' ')[0]}`}>
            {getTypeIcon(type)} {type.toUpperCase()}S
          </h3>
          <div className="space-y-2">
            {typeRecipes.map((recipe) => {
              const affordable = canAfford(recipe);
              const isSelected = selectedRecipe === recipe._id;
              
              return (
                <button
                  key={recipe._id}
                  onClick={() => onSelectRecipe(isSelected ? null : recipe._id)}
                  disabled={!affordable}
                  className={`
                    w-full text-left p-3 rounded-lg border transition-all
                    ${getTypeColor(recipe.outputType)}
                    ${isSelected 
                      ? "ring-2 ring-yellow-400 border-yellow-400" 
                      : affordable 
                        ? "hover:border-yellow-500/50 hover:bg-gray-700/30" 
                        : "opacity-50 cursor-not-allowed"
                    }
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{recipe.name}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {recipe.outputVariation}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-green-400">
                        {recipe.successRate}% success
                      </div>
                      <div className="text-xs text-gray-400">
                        ⏱ {recipe.cooldownMinutes}min
                      </div>
                    </div>
                  </div>
                  
                  {/* Cost Display */}
                  <div className="mt-2 pt-2 border-t border-gray-700/50">
                    <div className="flex flex-wrap gap-2">
                      {recipe.goldCost && recipe.goldCost > 0 && (
                        <span className={`text-xs px-2 py-1 rounded ${
                          userGold >= recipe.goldCost 
                            ? "bg-yellow-900/30 text-yellow-400" 
                            : "bg-red-900/30 text-red-400"
                        }`}>
                          💰 {recipe.goldCost}
                        </span>
                      )}
                      {Object.entries(recipe.essenceCost).map(([essence, cost]) => {
                        if (!cost || cost === 0) return null;
                        const hasEnough = userEssence[essence] >= cost;
                        return (
                          <span
                            key={essence}
                            className={`text-xs px-2 py-1 rounded ${
                              hasEnough 
                                ? "bg-gray-700/50 text-gray-300" 
                                : "bg-red-900/30 text-red-400"
                            }`}
                          >
                            {essence}: {cost}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
      
      {recipes.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No recipes available yet. Check back later!
        </div>
      )}
    </div>
  );
}