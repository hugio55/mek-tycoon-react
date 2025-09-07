'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Image from 'next/image';

interface ChipTier {
  tier: number;
  name: string;
  unlocked: boolean;
  color: string;
  glowColor: string;
  borderColor: string;
}

interface RecipeRequirement {
  name: string;
  type: 'gold' | 'essence' | 'other';
  amount: number;
  current: number;
  icon?: string;
  image?: string;
  essenceType?: string;
}

interface PotentialReward {
  name: string;
  amount: number;
  dropChance: number;
  type: string;
  icon?: string;
  image?: string;
}

interface DailyRecipe {
  id: string;
  tier: number;
  recipeIndex: number;
  recipeName: string;
  rarityBiasBonus: number;
  requirements: RecipeRequirement[];
  potentialRewards: PotentialReward[];
  expiresAt: Date;
}

export default function UniChipsPage() {
  const [selectedTier, setSelectedTier] = useState<number>(1);
  const [selectedRecipe, setSelectedRecipe] = useState<DailyRecipe | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [hoveredRequirement, setHoveredRequirement] = useState<string | null>(null);

  // Update timer every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Define chip tiers with industrial styling
  const chipTiers: ChipTier[] = [
    { tier: 1, name: 'T1', unlocked: true, color: '#1a1a1a', glowColor: 'rgba(100, 100, 100, 0.3)', borderColor: '#4a4a4a' },
    { tier: 2, name: 'T2', unlocked: false, color: '#0d2818', glowColor: 'rgba(34, 197, 94, 0.3)', borderColor: '#22c55e' },
    { tier: 3, name: 'T3', unlocked: false, color: '#1e3a5f', glowColor: 'rgba(59, 130, 246, 0.3)', borderColor: '#3b82f6' },
    { tier: 4, name: 'T4', unlocked: false, color: '#4c1d95', glowColor: 'rgba(139, 92, 246, 0.3)', borderColor: '#8b5cf6' },
    { tier: 5, name: 'T5', unlocked: false, color: '#831843', glowColor: 'rgba(236, 72, 153, 0.3)', borderColor: '#ec4899' },
    { tier: 6, name: 'T6', unlocked: false, color: '#7c2d12', glowColor: 'rgba(251, 146, 60, 0.3)', borderColor: '#fb923c' },
    { tier: 7, name: 'T7', unlocked: false, color: '#713f12', glowColor: 'rgba(250, 204, 21, 0.3)', borderColor: '#facc15' },
  ];

  // Generate daily recipes with requirements
  const getDailyRecipes = (tier: number): DailyRecipe[] => {
    const baseDate = new Date();
    baseDate.setHours(24, 0, 0, 0); // Tomorrow at midnight
    
    return [
      {
        id: `recipe-${tier}-1`,
        tier,
        recipeIndex: 1,
        recipeName: 'Basic',
        rarityBiasBonus: 0,
        requirements: [
          { name: 'Gold', type: 'gold', amount: 1000 * tier, current: 1000 * tier, icon: '🪙' },
          { name: 'Accordion Essence', type: 'essence', amount: 0.5, current: 0.5, essenceType: 'accordion', image: '/essence-images/bumblebee 1.png' },
          { name: 'Paul Essence', type: 'essence', amount: 0.2, current: 0.1, essenceType: 'paul', image: '/essence-images/bumblebee 2.png' },
        ],
        potentialRewards: [],
        expiresAt: baseDate,
      },
      {
        id: `recipe-${tier}-2`,
        tier,
        recipeIndex: 2,
        recipeName: 'Advanced',
        rarityBiasBonus: 10,
        requirements: [
          { name: 'Gold', type: 'gold', amount: 2000 * tier, current: 2000 * tier, icon: '🪙' },
          { name: 'Drill Essence', type: 'essence', amount: 0.8, current: 0.3, essenceType: 'drill', image: '/essence-images/bumblebee 3.png' },
          { name: 'Acid Essence', type: 'essence', amount: 0.1, current: 0, essenceType: 'acid', image: '/essence-images/bumblebee 1.png' },
        ],
        potentialRewards: [],
        expiresAt: baseDate,
      },
      {
        id: `recipe-${tier}-3`,
        tier,
        recipeIndex: 3,
        recipeName: 'Expert',
        rarityBiasBonus: 25,
        requirements: [
          { name: 'Gold', type: 'gold', amount: 8000 * tier, current: 8000 * tier, icon: '🪙' },
          { name: 'Gummy Essence', type: 'essence', amount: 2.8, current: 0.3, essenceType: 'gummy', image: '/essence-images/bumblebee 2.png' },
          { name: 'Bowling Essence', type: 'essence', amount: 4.1, current: 0, essenceType: 'bowling', image: '/essence-images/bumblebee 3.png' },
        ],
        potentialRewards: [],
        expiresAt: baseDate,
      },
    ];
  };

  const dailyRecipes = getDailyRecipes(selectedTier);

  const handleTierSelect = (tier: number) => {
    const chipTier = chipTiers.find(t => t.tier === tier);
    if (chipTier?.unlocked) {
      setSelectedTier(tier);
      setSelectedRecipe(null);
    }
  };

  const getTimeRemaining = (expiresAt: Date) => {
    const remaining = Math.max(0, expiresAt.getTime() - currentTime);
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const getRequirementProgress = (req: RecipeRequirement) => {
    return Math.min(100, (req.current / req.amount) * 100);
  };

  const canCraft = (recipe: DailyRecipe) => {
    return recipe.requirements.every(req => req.current >= req.amount);
  };

  const getRewardColor = (dropChance: number) => {
    if (dropChance >= 75) return '#22c55e'; // green
    if (dropChance >= 45) return '#3b82f6'; // blue
    if (dropChance >= 20) return '#8b5cf6'; // purple
    if (dropChance >= 10) return '#f59e0b'; // orange
    return '#ef4444'; // red for rare
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Industrial background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,0.05) 35px, rgba(255,255,255,0.05) 70px),
            repeating-linear-gradient(-45deg, transparent, transparent 35px, rgba(255,255,255,0.02) 35px, rgba(255,255,255,0.02) 70px)
          `
        }} />
      </div>

      <Navigation />
      
      <div className="container mx-auto px-4 pt-32 pb-20 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Industrial Header */}
          <div className="mb-8 p-6 bg-gradient-to-b from-gray-900/80 to-gray-950/80 border border-gray-700 relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-5xl font-bold text-yellow-400 mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '2px' }}>
                  UNIVERSAL CHIP FOUNDRY
                </h1>
                <p className="text-gray-400 text-sm uppercase tracking-wider">
                  Forge universal enhancement modules • Tier {selectedTier} Production Line
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Daily Reset</div>
                <div className="text-2xl font-mono text-yellow-400">
                  {getTimeRemaining(dailyRecipes[0].expiresAt)}
                </div>
              </div>
            </div>
          </div>

          {/* Chip Tier Selection - Industrial Style */}
          <div className="mb-8 p-4 bg-gray-900/60 border border-gray-800">
            <h2 className="text-sm font-bold mb-4 text-gray-400 uppercase tracking-wider">Select Production Tier</h2>
            <div className="grid grid-cols-7 gap-3">
              {chipTiers.map((tier) => (
                <button
                  key={tier.tier}
                  onClick={() => handleTierSelect(tier.tier)}
                  disabled={!tier.unlocked}
                  className={`relative aspect-square transition-all ${
                    !tier.unlocked ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'
                  }`}
                >
                  <div
                    className={`h-full border-2 flex flex-col items-center justify-center ${
                      selectedTier === tier.tier
                        ? 'border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.4)]'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                    style={{
                      backgroundColor: tier.color,
                      borderColor: selectedTier === tier.tier ? tier.borderColor : undefined,
                    }}
                  >
                    <div className="text-3xl mb-1">💾</div>
                    <span className="text-white font-bold text-lg" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                      {tier.name}
                    </span>
                    {!tier.unlocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                        <span className="text-2xl">🔒</span>
                      </div>
                    )}
                  </div>
                  {!tier.unlocked && (
                    <div className="absolute -bottom-6 left-0 right-0 text-[10px] text-gray-500 text-center">
                      LOCKED
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Daily Recipe Grid - Clean Dark Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {dailyRecipes.map((recipe, index) => {
              const isSelected = selectedRecipe?.id === recipe.id;
              const craftable = canCraft(recipe);
              
              return (
                <div
                  key={recipe.id}
                  className={`relative bg-gray-950 border transition-all ${
                    isSelected 
                      ? 'border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.3)]' 
                      : 'border-gray-800 hover:border-gray-700'
                  } p-6`}
                >
                  {/* Recipe Title with Rarity Bias */}
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-yellow-400 mb-2">
                      {recipe.recipeName} T{selectedTier} Chip Recipe
                    </h3>
                    <div className="text-lg">
                      <span className="text-gray-400">Rarity Bias Bonus: </span>
                      <span className={`font-bold ${
                        recipe.rarityBiasBonus > 0 ? 'text-green-400' : 'text-gray-500'
                      }`}>
                        {recipe.rarityBiasBonus > 0 ? `+ ${recipe.rarityBiasBonus}` : '0'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Requirements List - Clean Style */}
                  <div className="space-y-3 mb-8">
                    {recipe.requirements.map((req, idx) => {
                      const isMet = req.current >= req.amount;
                      
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          {/* Checkmark/X indicator */}
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            isMet ? 'bg-green-500' : 'bg-red-500'
                          }`}>
                            {isMet ? (
                              <span className="text-black text-sm font-bold">✓</span>
                            ) : (
                              <span className="text-white text-sm font-bold">✗</span>
                            )}
                          </div>
                          
                          {/* Requirement text */}
                          <div className="flex-1">
                            <span className="text-gray-300">
                              {req.type === 'gold' ? (
                                <>Gold: {req.amount.toLocaleString()}</>
                              ) : (
                                <>
                                  {req.name} x {req.amount}
                                  {req.current < req.amount && (
                                    <span className="text-gray-500 ml-2">
                                      [{req.current}]
                                    </span>
                                  )}
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Rarity Bias Bonus Display */}
                  {recipe.rarityBiasBonus > 0 && (
                    <div className="mb-6 text-center">
                      <div className="text-3xl font-bold text-green-400">
                        Rarity Bias Bonus: + {recipe.rarityBiasBonus}
                      </div>
                    </div>
                  )}
                  
                  {/* Craft Button */}
                  <button
                    onClick={() => setSelectedRecipe(recipe)}
                    className={`w-full py-3 font-bold text-lg transition-all ${
                      craftable
                        ? 'bg-yellow-400 hover:bg-yellow-300 text-black'
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={!craftable}
                  >
                    Craft
                  </button>
                </div>
              );
            })}
          </div>

          {/* Selected Recipe Detail Modal */}
          {selectedRecipe && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 border-2 border-yellow-400 max-w-md w-full">
                <div className="p-6 border-b border-gray-800 bg-gradient-to-r from-gray-950 to-gray-900">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-yellow-400">
                      Confirm T{selectedTier} Chip Production
                    </h3>
                    <button
                      onClick={() => setSelectedRecipe(null)}
                      className="text-gray-400 hover:text-white text-2xl"
                    >
                      ×
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  {/* Recipe Type and Bonus */}
                  <div className="mb-6 text-center">
                    <div className="text-xl text-gray-300 mb-2">
                      {selectedRecipe.recipeName} Recipe
                    </div>
                    {selectedRecipe.rarityBiasBonus > 0 && (
                      <div className="text-2xl font-bold text-green-400">
                        Rarity Bias Bonus: +{selectedRecipe.rarityBiasBonus}
                      </div>
                    )}
                  </div>
                  
                  {/* Requirements Checklist */}
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                      Requirements Check
                    </h4>
                    <div className="space-y-3 bg-gray-950/50 p-4 border border-gray-800">
                      {selectedRecipe.requirements.map((req, idx) => {
                        const isMet = req.current >= req.amount;
                        
                        return (
                          <div key={idx} className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isMet ? 'bg-green-500' : 'bg-red-500'
                            }`}>
                              {isMet ? (
                                <span className="text-black font-bold">✓</span>
                              ) : (
                                <span className="text-white font-bold">✗</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="text-white">
                                {req.type === 'gold' ? (
                                  <>Gold: {req.amount.toLocaleString()}</>
                                ) : (
                                  <>{req.name} x {req.amount}</>
                                )}
                              </div>
                              {!isMet && (
                                <div className="text-xs text-gray-500">
                                  Current: {req.current}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Output */}
                  <div className="mb-6 text-center p-4 bg-gray-800 border border-gray-700">
                    <div className="text-sm text-gray-400 mb-2">Output</div>
                    <div className="text-xl font-bold text-yellow-400">
                      T{selectedTier} Universal Chip x1
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedRecipe(null)}
                      className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold uppercase tracking-wider transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        console.log('Crafting:', selectedRecipe);
                        setSelectedRecipe(null);
                      }}
                      disabled={!canCraft(selectedRecipe)}
                      className={`flex-1 py-3 font-bold uppercase tracking-wider transition-all ${
                        canCraft(selectedRecipe)
                          ? 'bg-yellow-400 hover:bg-yellow-300 text-black'
                          : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {canCraft(selectedRecipe) ? 'Craft Chip' : 'Cannot Craft'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}