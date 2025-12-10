'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import RarityChart from '@/components/RarityChart';
import theme from '@/lib/design-system';
import { getMediaUrl } from '@/lib/media-url';

interface ChipTier {
  tier: number;
  name: string;
  unlocked: boolean;
  color: string;
  glowColor: string;
  borderColor: string;
  description: string;
  requiredLevel: number;
  particleColor: string;
  energySignature: string;
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

interface DailyRecipe {
  id: string;
  tier: number;
  recipeIndex: number;
  recipeName: string;
  rarityBiasBonus: number;
  requirements: RecipeRequirement[];
  expiresAt: Date;
}

export default function MekChips3Page() {
  const [selectedTier, setSelectedTier] = useState<number>(1);
  const [selectedRecipe, setSelectedRecipe] = useState<DailyRecipe | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [hoveredTier, setHoveredTier] = useState<number | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [currentBias, setCurrentBias] = useState(150);
  const [mounted, setMounted] = useState(false);
  const [hoveredRecipe, setHoveredRecipe] = useState<DailyRecipe | null>(null);
  const [showBiasTooltip, setShowBiasTooltip] = useState(false);
  const [biasTooltipPos, setBiasTooltipPos] = useState({ x: 0, y: 0 });
  const [hoveredCraftButton, setHoveredCraftButton] = useState<string | null>(null);
  const [craftTooltipPos, setCraftTooltipPos] = useState({ x: 0, y: 0 });

  // Update timer every second
  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Define all 10 chip tiers with industrial styling and quantum properties
  const chipTiers: ChipTier[] = [
    { tier: 1, name: 'T1', unlocked: true, color: '#1a1a1a', glowColor: 'rgba(250, 182, 23, 0.4)', borderColor: '#fab617', description: 'Basic Quantum Core - Entry Level Manufacturing', requiredLevel: 1, particleColor: '#fab617', energySignature: 'STABLE' },
    { tier: 2, name: 'T2', unlocked: true, color: '#0d2818', glowColor: 'rgba(34, 197, 94, 0.4)', borderColor: '#22c55e', description: 'Enhanced Processing Unit - Level 10 Clearance', requiredLevel: 10, particleColor: '#22c55e', energySignature: 'ENHANCED' },
    { tier: 3, name: 'T3', unlocked: false, color: '#1e3a5f', glowColor: 'rgba(59, 130, 246, 0.4)', borderColor: '#3b82f6', description: 'Advanced Quantum Matrix - Level 20 Clearance', requiredLevel: 20, particleColor: '#3b82f6', energySignature: 'ADVANCED' },
    { tier: 4, name: 'T4', unlocked: false, color: '#4c1d95', glowColor: 'rgba(139, 92, 246, 0.4)', borderColor: '#8b5cf6', description: 'Rare Element Integration - Level 30 Clearance', requiredLevel: 30, particleColor: '#8b5cf6', energySignature: 'VOLATILE' },
    { tier: 5, name: 'T5', unlocked: false, color: '#831843', glowColor: 'rgba(236, 72, 153, 0.4)', borderColor: '#ec4899', description: 'Epic Quantum Resonance - Level 40 Clearance', requiredLevel: 40, particleColor: '#ec4899', energySignature: 'RESONANT' },
    { tier: 6, name: 'T6', unlocked: false, color: '#7c2d12', glowColor: 'rgba(251, 146, 60, 0.4)', borderColor: '#fb923c', description: 'Legendary Fusion Core - Level 50 Clearance', requiredLevel: 50, particleColor: '#fb923c', energySignature: 'FUSION' },
    { tier: 7, name: 'T7', unlocked: false, color: '#713f12', glowColor: 'rgba(250, 204, 21, 0.4)', borderColor: '#facc15', description: 'Mythic Energy Conduit - Level 60 Clearance', requiredLevel: 60, particleColor: '#facc15', energySignature: 'MYTHIC' },
    { tier: 8, name: 'T8', unlocked: false, color: '#14532d', glowColor: 'rgba(74, 222, 128, 0.5)', borderColor: '#4ade80', description: 'Divine Quantum State - Level 70 Clearance', requiredLevel: 70, particleColor: '#4ade80', energySignature: 'DIVINE' },
    { tier: 9, name: 'T9', unlocked: false, color: '#1e1b4b', glowColor: 'rgba(165, 180, 252, 0.5)', borderColor: '#a5b4fc', description: 'Cosmic Entanglement Core - Level 80 Clearance', requiredLevel: 80, particleColor: '#a5b4fc', energySignature: 'COSMIC' },
    { tier: 10, name: 'T10', unlocked: false, color: '#701a75', glowColor: 'rgba(240, 171, 252, 0.6)', borderColor: '#f0abfc', description: 'Infinite Quantum Singularity - Level 100 Clearance', requiredLevel: 100, particleColor: '#f0abfc', energySignature: 'INFINITE' },
  ];

  // Generate daily recipes with requirements
  const getDailyRecipes = (tier: number): DailyRecipe[] => {
    const baseDate = new Date();
    baseDate.setHours(24, 0, 0, 0); // Tomorrow at midnight
    
    // Use deterministic image selection based on tier and recipe index
    const getEssenceImage = (tierNum: number, recipeIdx: number, essenceIdx: number) => {
      const imageNum = ((tierNum + recipeIdx + essenceIdx) % 3) + 1;
      return getMediaUrl(`/essence-images/bumblebee ${imageNum}.png`);
    };
    
    return [
      {
        id: `recipe-${tier}-1`,
        tier,
        recipeIndex: 1,
        recipeName: 'Standard Recipe',
        rarityBiasBonus: 0,
        requirements: [
          { name: 'Gold', type: 'gold', amount: 1000 * tier, current: 1000 * tier, image: '/gold/gold temp.webp' },
          { name: 'Accordion Essence', type: 'essence', amount: 0.5 * tier, current: 0.5, essenceType: 'accordion', image: getEssenceImage(tier, 1, 1) },
        ],
        expiresAt: baseDate,
      },
      {
        id: `recipe-${tier}-2`,
        tier,
        recipeIndex: 2,
        recipeName: 'Enhanced Recipe',
        rarityBiasBonus: 25,
        requirements: [
          { name: 'Gold', type: 'gold', amount: 2500 * tier, current: 2500 * tier, image: '/gold/gold temp.webp' },
          { name: 'Drill Essence', type: 'essence', amount: 0.8 * tier, current: 0.3, essenceType: 'drill', image: getEssenceImage(tier, 2, 1) },
          { name: 'Acid Essence', type: 'essence', amount: 0.3 * tier, current: 0, essenceType: 'acid', image: getEssenceImage(tier, 2, 2) },
        ],
        expiresAt: baseDate,
      },
      {
        id: `recipe-${tier}-3`,
        tier,
        recipeIndex: 3,
        recipeName: 'Premium Recipe',
        rarityBiasBonus: 50,
        requirements: [
          { name: 'Gold', type: 'gold', amount: 10000 * tier, current: 8000 * tier, image: '/gold/gold temp.webp' },
          { name: 'Gummy Essence', type: 'essence', amount: 2.8 * tier, current: 0.3, essenceType: 'gummy', image: getEssenceImage(tier, 3, 1) },
          { name: 'Bowling Essence', type: 'essence', amount: 4.1 * tier, current: 0, essenceType: 'bowling', image: getEssenceImage(tier, 3, 2) },
          { name: 'Crystal Essence', type: 'essence', amount: 1.5 * tier, current: 0.2, essenceType: 'crystal', image: getEssenceImage(tier, 3, 3) },
        ],
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

  const handleMouseEnter = (tier: number, event: React.MouseEvent) => {
    const chipTier = chipTiers.find(t => t.tier === tier);
    if (!chipTier?.unlocked) {
      setHoveredTier(tier);
      setShowTooltip(true);
      const rect = event.currentTarget.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredTier(null);
    setShowTooltip(false);
  };

  const getTimeRemaining = (expiresAt: Date) => {
    const remaining = Math.max(0, expiresAt.getTime() - currentTime);
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const canCraft = (recipe: DailyRecipe) => {
    return recipe.requirements.every(req => req.current >= req.amount);
  };

  const getChipGlow = (tier: ChipTier, isHovered: boolean = false) => {
    if (!tier.unlocked) {
      return `
        drop-shadow(0 0 5px rgba(0,0,0,0.8))
        brightness(0.3)
        contrast(1.2)
        saturate(0.2)
      `;
    }
    
    const isSelected = selectedTier === tier.tier;
    
    if (isSelected) {
      const glowSize = 20;
      return `
        drop-shadow(0 0 ${glowSize}px ${tier.glowColor})
        drop-shadow(0 0 ${glowSize * 2}px ${tier.glowColor})
        brightness(1.3)
        contrast(1.1)
        saturate(1.2)
      `;
    } else {
      const glowSize = isHovered ? 10 : 5;
      return `
        drop-shadow(0 0 ${glowSize}px ${tier.glowColor})
        brightness(${isHovered ? 0.9 : 0.7})
        contrast(1.0)
        saturate(0.8)
      `;
    }
  };

  // Calculate total bias with selected recipe or hovered recipe
  const totalBias = currentBias + (hoveredRecipe?.rarityBiasBonus || selectedRecipe?.rarityBiasBonus || 0);

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      
      <div className="container mx-auto px-4 pt-20 pb-12 relative">
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Industrial Header */}
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent blur-3xl" />
            
            <div className="relative mek-card-industrial mek-border-sharp-gold p-6 overflow-hidden">
              <div className="absolute top-0 left-0 w-20 h-20 border-t-4 border-l-4 border-yellow-400/60" />
              <div className="absolute top-0 right-0 w-20 h-20 border-t-4 border-r-4 border-yellow-400/60" />
              <div className="absolute bottom-0 left-0 w-20 h-20 border-b-4 border-l-4 border-yellow-400/60" />
              <div className="absolute bottom-0 right-0 w-20 h-20 border-b-4 border-r-4 border-yellow-400/60" />
              
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent animate-scan" />
              </div>
              
              <div className="absolute inset-0 opacity-20 mek-overlay-scratches pointer-events-none" />
              
              <div className="flex justify-between items-start relative">
                <div className="flex-1">
                  <h1 className="text-3xl font-black mb-3 mek-text-industrial" 
                      style={{ 
                        background: 'linear-gradient(135deg, #fab617 0%, #ffd700 50%, #fab617 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(0 0 30px rgba(250,182,23,0.5))',
                        letterSpacing: '4px'
                      }}>
                    UNI-CHIP CRAFTING
                  </h1>
                  
                  <div className="text-sm text-gray-400 leading-relaxed max-w-2xl">
                    Unlike Mek Chips, Universal Chips are capable of being equipped into any slot on any Mek. Selecting more complex recipes adds to your Rarity Bias score, meaning you're more likely to craft a rare version of the selected chip. Recipes reset daily.
                  </div>
                </div>
                
                {/* Integrated Recipe Reset Timer */}
                <div className="relative group">
                  {/* Main Timer Container with Angular Design */}
                  <div className="relative">
                    {/* Background with gradient mesh */}
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-black/40 rounded-none"
                         style={{
                           clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px))'
                         }} />
                    
                    {/* Industrial frame with cut corners - reduced by 5% */}
                    <div className="relative bg-black/80 backdrop-blur-sm p-3.5 pr-5"
                         style={{
                           clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px))',
                           border: '2px solid transparent',
                           backgroundImage: `
                             linear-gradient(black, black),
                             linear-gradient(135deg, #fab617 0%, #d4a017 50%, #fab617 100%)
                           `,
                           backgroundOrigin: 'border-box',
                           backgroundClip: 'padding-box, border-box'
                         }}>
                      
                      {/* Status indicator light */}
                      <div className="absolute top-2 right-2 w-2 h-2">
                        <div className="absolute inset-0 bg-yellow-400 rounded-full animate-pulse" />
                        <div className="absolute inset-0 bg-yellow-600 rounded-full" />
                      </div>
                      
                      {/* Hazard stripe accent */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-500 via-yellow-400 to-yellow-500 opacity-80" />
                      
                      {/* Content */}
                      <div className="flex items-center gap-3">
                        {/* Icon section - reduced by 5% */}
                        <div className="relative">
                          <svg className="w-5 h-5 text-yellow-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {/* Rotating ring effect */}
                          <div className="absolute inset-0 border-2 border-yellow-500/20 rounded-full animate-spin" 
                               style={{ animationDuration: '8s' }} />
                        </div>
                        
                        {/* Timer display */}
                        <div className="text-right">
                          <div className="text-[9px] text-gray-500 uppercase tracking-[0.4em] font-black mb-0.5"
                               style={{ fontFamily: "'Orbitron', monospace" }}>
                            RECIPE RESET
                          </div>
                          <div className="text-xl font-black leading-none tracking-wider" 
                               style={{ 
                                 fontFamily: "'Rajdhani', 'Bebas Neue', monospace",
                                 background: 'linear-gradient(90deg, #ffd700 0%, #fab617 50%, #ffd700 100%)',
                                 WebkitBackgroundClip: 'text',
                                 WebkitTextFillColor: 'transparent',
                                 filter: 'drop-shadow(0 0 15px rgba(250,182,23,0.6))',
                                 backgroundSize: '200% 100%',
                                 animation: 'shimmer-gradient 3s ease-in-out infinite'
                               }}>
                            {mounted ? getTimeRemaining(dailyRecipes[0].expiresAt) : '-- -- --'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Bottom accent line */}
                      <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
                    </div>
                    
                    {/* Corner accents */}
                    <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-yellow-400/60" />
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-yellow-400/60" />
                  </div>
                  
                  {/* Hover Tooltip */}
                  <div className="absolute top-full right-0 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                    <div className="relative bg-black/95 backdrop-blur-sm border border-yellow-500/30 p-3 rounded-lg shadow-2xl"
                         style={{ minWidth: '280px' }}>
                      <div className="absolute -top-2 right-6 w-4 h-4 bg-black/95 border-t border-l border-yellow-500/30 transform rotate-45" />
                      <div className="text-xs text-gray-400 leading-relaxed">
                        <span className="text-yellow-500 font-bold">Daily recipes</span> refresh at this time with new crafting options
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Tier Selection and Rarity Chart */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {/* Chip Tier Selection */}
                <div className="mek-card-industrial mek-border-sharp-gold p-6">
                  <h2 className="text-lg font-bold text-yellow-500/70 uppercase tracking-[0.3em] mb-6 text-center">
                    SELECT UNI CHIP TIER
                  </h2>
                  
                  {/* Chip grid - 2 rows of 5 */}
                  <div className="grid grid-cols-5 gap-4 max-w-3xl mx-auto">
                    {chipTiers.map((tier, index) => {
                      const isLocked = !tier.unlocked;
                      const isSelected = selectedTier === tier.tier;
                      const [isHovered, setIsHovered] = useState(false);
                      
                      return (
                        <div
                          key={tier.tier}
                          className={`flex flex-col items-center transition-all duration-300 ${
                            !isLocked && selectedTier !== tier.tier && selectedTier !== null 
                              ? 'opacity-60 hover:opacity-80' 
                              : 'opacity-100'
                          }`}
                          onMouseEnter={(e) => {
                            setIsHovered(true);
                            handleMouseEnter(tier.tier, e);
                          }}
                          onMouseLeave={() => {
                            setIsHovered(false);
                            handleMouseLeave();
                          }}
                        >
                          <button
                            onClick={() => handleTierSelect(tier.tier)}
                            disabled={isLocked}
                            className={`relative transition-all duration-300 transform-gpu ${
                              isLocked 
                                ? 'cursor-not-allowed scale-90' 
                                : isSelected
                                  ? 'scale-110'
                                  : 'hover:scale-105'
                            }`}
                          >
                            <div className="relative flex items-center justify-center" style={{ width: '96px', height: '96px' }}>
                              {!isLocked && isSelected && (
                                <div 
                                  className="absolute inset-0 rounded-full opacity-60"
                                  style={{
                                    background: `radial-gradient(circle, transparent 30%, ${tier.glowColor} 70%, transparent 100%)`,
                                    filter: `blur(2px)`
                                  }}
                                />
                              )}
                              
                              <div className="relative flex items-center justify-center">
                                <Image
                                  src={`/chip-images/uni-chips/uni chips blank 200px webp/${tier.tier} blank.webp`}
                                  alt={`Tier ${tier.tier} Universal Chip`}
                                  width={80}
                                  height={80}
                                  className="object-contain transition-all duration-300"
                                  style={{
                                    filter: getChipGlow(tier, isHovered),
                                    width: '80px',
                                    height: '80px'
                                  }}
                                />
                              </div>
                              
                              {isLocked && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="bg-black/80 border border-red-900/50 rounded p-2 backdrop-blur-sm">
                                    <div className="text-red-500 text-xl mb-0.5">⚠</div>
                                    <div className="text-[10px] text-red-400 font-bold">LOCKED</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </button>
                          
                          <div className="text-center mt-1">
                            <div 
                              className={`font-bold transition-all duration-300 ${
                                isLocked 
                                  ? 'text-sm opacity-30' 
                                  : isSelected 
                                    ? 'text-base animate-pulse scale-110' 
                                    : 'text-base opacity-100'
                              }`}
                              style={{
                                color: isLocked ? '#444' : (isSelected ? tier.borderColor : '#fab617'),
                                textShadow: isLocked ? 'none' : (isSelected ? `0 0 20px ${tier.glowColor}` : `0 0 10px rgba(250,182,23,0.5)`),
                                fontFamily: "'Rajdhani', 'Bebas Neue', sans-serif",
                                letterSpacing: '0.05em',
                                fontWeight: isLocked ? '500' : '700'
                              }}
                            >
                              T{tier.tier}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Rarity Chart with custom bias display position */}
                <div className="relative">
                  {/* Industrial Bias Display - Upper Right Corner - 50% smaller */}
                  <div className="absolute top-2 right-2 z-10">
                    {/* Main Container with Industrial Frame - scaled to 50% */}
                    <div 
                      className="relative cursor-help"
                      style={{
                        transform: 'scale(0.625)',
                        transformOrigin: 'top right',
                        background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(10,10,10,0.95) 100%)',
                        clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
                        boxShadow: hoveredRecipe?.rarityBiasBonus 
                          ? '0 0 30px rgba(74,222,128,0.6), 0 0 60px rgba(74,222,128,0.3)' 
                          : 'none',
                        transition: 'box-shadow 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        setShowBiasTooltip(true);
                        const rect = e.currentTarget.getBoundingClientRect();
                        setBiasTooltipPos({
                          x: rect.left + rect.width / 2,
                          y: rect.bottom + 5
                        });
                      }}
                      onMouseLeave={() => setShowBiasTooltip(false)}
                    >
                      {/* Border Frame */}
                      <div className="absolute inset-0 pointer-events-none" style={{
                        background: 'linear-gradient(135deg, #fab617 0%, #ff8c00 100%)',
                        clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
                        padding: '1px',
                      }}>
                        <div className="w-full h-full" style={{
                          background: 'linear-gradient(135deg, rgba(0,0,0,0.98) 0%, rgba(10,10,10,0.98) 100%)',
                          clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
                        }} />
                      </div>

                      {/* Content Container */}
                      <div className="relative px-6 py-3">
                        {/* Scan Line Effect */}
                        <div className="absolute inset-0 pointer-events-none opacity-20" style={{
                          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(250,182,23,0.1) 2px, rgba(250,182,23,0.1) 4px)',
                        }} />

                        {/* Label centered with larger text */}
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <span className={`text-sm transition-all duration-300 ${
                            hoveredRecipe?.rarityBiasBonus ? 'text-green-400' : 'text-yellow-500/50'
                          }`}>▬</span>
                          <div className={`text-sm uppercase tracking-[0.25em] font-bold transition-all duration-300 ${
                            hoveredRecipe?.rarityBiasBonus ? 'text-green-400 animate-pulse' : 'text-gray-400'
                          }`}
                            style={{
                              textShadow: hoveredRecipe?.rarityBiasBonus 
                                ? '0 0 15px rgba(0,255,136,0.9), 0 0 30px rgba(74,222,128,0.7)' 
                                : 'none'
                            }}
                          >
                            YOUR BIAS RATING
                          </div>
                          <span className={`text-sm transition-all duration-300 ${
                            hoveredRecipe?.rarityBiasBonus ? 'text-green-400' : 'text-yellow-500/50'
                          }`}>▬</span>
                        </div>

                        {/* Digital Display Container */}
                        <div className="relative">
                          {/* Background Display Frame */}
                          <div 
                            className="relative overflow-hidden rounded-sm"
                            style={{
                              background: 'linear-gradient(180deg, rgba(250,182,23,0.05) 0%, rgba(250,182,23,0.02) 100%)',
                              border: '1px solid rgba(250,182,23,0.2)',
                              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5), 0 0 20px rgba(250,182,23,0.1)',
                            }}
                          >
                            <div className="px-4 py-2 flex items-baseline justify-center gap-2">
                              {/* Main Bias Value */}
                              <div className="relative">
                                <div 
                                  className="text-5xl leading-none font-bold"
                                  style={{
                                    fontFamily: "'Bebas Neue', 'Rajdhani', sans-serif",
                                    color: '#fab617',
                                    textShadow: '0 0 15px rgba(250,182,23,0.6), 2px 2px 0px rgba(0,0,0,0.5)',
                                    letterSpacing: '0.1em',
                                  }}
                                >
                                  {currentBias}
                                </div>
                              </div>

                              {/* Bonus Display - always visible to prevent layout jump */}
                              <div className={`flex items-baseline gap-1 ${hoveredRecipe?.rarityBiasBonus ? 'animate-pulse' : ''}`}>
                                <span 
                                  className="text-3xl"
                                  style={{
                                    fontFamily: "'Bebas Neue', 'Rajdhani', sans-serif",
                                    color: hoveredRecipe?.rarityBiasBonus ? '#00ff88' : '#4a4a4a',
                                    textShadow: hoveredRecipe?.rarityBiasBonus 
                                      ? '0 0 20px rgba(0,255,136,0.9), 0 0 40px rgba(74,222,128,0.7), 0 0 60px rgba(74,222,128,0.5)' 
                                      : 'none',
                                    filter: hoveredRecipe?.rarityBiasBonus ? 'brightness(1.3)' : 'none'
                                  }}
                                >
                                  +
                                </span>
                                <span 
                                  className="text-4xl leading-none font-bold"
                                  style={{
                                    fontFamily: "'Bebas Neue', 'Rajdhani', sans-serif",
                                    color: hoveredRecipe?.rarityBiasBonus ? '#00ff88' : '#4a4a4a',
                                    textShadow: hoveredRecipe?.rarityBiasBonus 
                                      ? '0 0 25px rgba(0,255,136,1), 0 0 50px rgba(74,222,128,0.8), 0 0 75px rgba(74,222,128,0.6), 2px 2px 0px rgba(0,0,0,0.5)' 
                                      : 'none',
                                    letterSpacing: '0.1em',
                                    filter: hoveredRecipe?.rarityBiasBonus ? 'brightness(1.3)' : 'none'
                                  }}
                                >
                                  {(hoveredRecipe?.rarityBiasBonus || 0).toString().padStart(2, '0')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                  
                  <div className="mek-card-industrial mek-border-sharp-gold">
                    <RarityChart 
                      rarityBias={totalBias}
                      showSlider={false}
                      chartHeight={250}
                      maxBarHeight={240}
                      hideCenterDisplay={true}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Recipe Cards */}
            <div className="lg:col-span-1">
              <div className="space-y-4">
                {dailyRecipes.map((recipe, index) => {
                  const isSelected = selectedRecipe?.id === recipe.id;
                  const craftable = canCraft(recipe);
                  const rarityColor = recipe.rarityBiasBonus >= 50 
                    ? '#f0abfc' 
                    : recipe.rarityBiasBonus > 0 
                      ? '#22d3ee'
                      : '#6b7280';
                  
                  return (
                    <div
                      key={recipe.id}
                      className={`relative transition-all duration-500 transform-gpu ${
                        isSelected 
                          ? 'scale-[1.02] z-30' 
                          : ''
                      }`}
                      onMouseEnter={() => setHoveredRecipe(recipe)}
                      onMouseLeave={() => setHoveredRecipe(null)}
                    >
                      {isSelected && (
                        <>
                          <div className="absolute inset-0 -m-2">
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/30 via-cyan-500/30 to-yellow-500/30 blur-xl animate-pulse" />
                          </div>
                        </>
                      )}
                      
                      <div className={`relative mek-card-industrial backdrop-blur-sm overflow-hidden transition-all duration-500 ${
                        isSelected 
                          ? 'border-2 border-yellow-400 shadow-[0_0_30px_rgba(250,182,23,0.5)]' 
                          : 'mek-border-sharp-gold hover:shadow-[0_0_15px_rgba(250,182,23,0.2)]'
                      }`}>
                        <div className="absolute top-0 left-0 right-0 h-1 mek-overlay-hazard-stripes opacity-50" />
                        
                        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
                          <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-white/50 to-transparent animate-scan" 
                            style={{ animationDelay: `${index * 0.5}s` }} />
                        </div>
                        
                        <div className="absolute inset-0 opacity-10 mek-overlay-metal-texture pointer-events-none" />
                        
                        <div className="relative p-4">
                          {/* Header */}
                          <div className="mb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="relative">
                                  <div className={`w-6 h-6 flex items-center justify-center text-xs font-bold ${
                                    isSelected
                                      ? 'bg-gradient-to-br from-yellow-400/30 to-yellow-500/30 border border-yellow-300 text-yellow-200'
                                      : craftable 
                                        ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-400/50 text-yellow-300' 
                                        : 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 text-gray-500'
                                  }`}
                                  style={{
                                    clipPath: 'polygon(25% 0%, 100% 0%, 75% 100%, 0% 100%)'
                                  }}>
                                    {recipe.recipeIndex}
                                  </div>
                                </div>
                                <div>
                                  <h3 className={`text-sm font-bold mek-text-industrial uppercase tracking-wider ${
                                    isSelected ? 'text-yellow-300' : 'text-yellow-400'
                                  }`}>
                                    {recipe.recipeName}
                                  </h3>
                                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">
                                    Recipe T{selectedTier}-{String.fromCharCode(64 + recipe.recipeIndex)}
                                  </div>
                                </div>
                              </div>
                              
                              <div 
                                className="flex flex-col items-center px-2 py-1 rounded"
                                style={{
                                  background: recipe.rarityBiasBonus > 0 ? `${rarityColor}15` : 'rgba(107,114,128,0.15)',
                                  border: recipe.rarityBiasBonus > 0 ? `1px solid ${rarityColor}40` : '1px solid rgba(107,114,128,0.4)'
                                }}
                              >
                                <span className="text-lg font-bold" style={{ 
                                  color: recipe.rarityBiasBonus > 0 ? rarityColor : '#6b7280',
                                  fontFamily: 'Rajdhani, sans-serif',
                                  letterSpacing: '-0.02em'
                                }}>+{recipe.rarityBiasBonus}</span>
                                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ 
                                  color: recipe.rarityBiasBonus > 0 ? rarityColor : '#6b7280', 
                                  opacity: 0.8 
                                }}>BIAS</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Requirements */}
                          <div className="space-y-2 mb-3">
                            <div className="text-[10px] text-yellow-500/60 uppercase tracking-[0.3em] mb-1 font-bold">Requirements</div>
                            
                            {recipe.requirements.map((req, idx) => {
                              const isMet = req.current >= req.amount;
                              const progress = Math.min(100, (req.current / req.amount) * 100);
                              const isHoveringCraft = hoveredCraftButton === recipe.id;
                              
                              return (
                                <div key={idx} className={`relative group transition-all duration-300`}>
                                  <div className="flex items-center gap-2">
                                    <div className="relative w-8 h-8 flex items-center justify-center">
                                      {req.image ? (
                                        <img 
                                          src={req.image} 
                                          alt={req.name} 
                                          className={`w-6 h-6 object-contain ${
                                            !isMet && isHoveringCraft ? 'animate-pulse' : ''
                                          }`}
                                          style={{
                                            filter: isMet 
                                              ? 'drop-shadow(0 0 6px rgba(250,182,23,0.6))'
                                              : isHoveringCraft
                                                ? 'brightness(0.8) drop-shadow(0 0 10px rgba(239,68,68,1)) drop-shadow(0 0 20px rgba(239,68,68,0.6))'
                                                : 'brightness(0.6) drop-shadow(0 0 5px rgba(239,68,68,0.8))',
                                            animation: !isMet && !isHoveringCraft ? 'pulse-slow 3s ease-in-out infinite' : undefined
                                          }}
                                        />
                                      ) : (
                                        <span className={isMet ? 'text-green-400' : 'text-red-400'}>
                                          {isMet ? '✓' : '✗'}
                                        </span>
                                      )}
                                    </div>
                                    
                                    <div className="flex-1">
                                      <div className="flex justify-between items-center mb-0.5">
                                        <span className={`text-[10px] font-medium ${
                                          isMet ? 'text-gray-400' : 'text-red-400'
                                        }`}>
                                          {req.name}
                                        </span>
                                        <span className={`text-[10px] font-mono font-bold ${
                                          !isMet && isHoveringCraft ? 'animate-pulse' : ''
                                        } ${
                                          isMet ? 'text-green-400' : 'text-red-400'
                                        }`}
                                          style={{
                                            filter: !isMet 
                                              ? isHoveringCraft
                                                ? 'drop-shadow(0 0 8px rgba(239,68,68,1))'
                                                : 'drop-shadow(0 0 4px rgba(239,68,68,0.8))'
                                              : 'none',
                                            animation: !isMet && !isHoveringCraft ? 'pulse-slow 3s ease-in-out infinite' : undefined
                                          }}
                                        >
                                          {req.current.toLocaleString()}/{req.amount.toLocaleString()}
                                        </span>
                                      </div>
                                      
                                      <div className={`relative w-full h-1.5 bg-black/60 border overflow-hidden ${
                                        !isMet && isHoveringCraft ? 'animate-pulse' : ''
                                      }`}
                                        style={{
                                          borderColor: isMet ? 'rgb(107,114,128)' : 'rgba(239,68,68,0.5)',
                                          filter: !isMet 
                                            ? isHoveringCraft
                                              ? 'drop-shadow(0 0 10px rgba(239,68,68,0.8))'
                                              : 'drop-shadow(0 0 5px rgba(239,68,68,0.6))'
                                            : 'none',
                                          animation: !isMet && !isHoveringCraft ? 'pulse-slow 3s ease-in-out infinite' : undefined
                                        }}
                                      >
                                        <div 
                                          className={`h-full transition-all duration-500 ${
                                            isMet 
                                              ? 'bg-gradient-to-r from-green-500 to-green-400' 
                                              : 'bg-gradient-to-r from-red-600 to-red-500'
                                          }`}
                                          style={{ 
                                            width: `${progress}%`,
                                            boxShadow: isMet 
                                              ? `0 0 6px rgba(34,197,94,0.4)` 
                                              : isHoveringCraft
                                                ? '0 0 12px rgba(239,68,68,0.8)'
                                                : '0 0 6px rgba(239,68,68,0.6)'
                                          }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Craft Button */}
                          <div className="relative">
                            <button
                              onClick={() => craftable && setSelectedRecipe(recipe)}
                              className={`relative w-full py-2 font-bold text-xs uppercase tracking-[0.2em] transition-all overflow-hidden ${
                                craftable
                                  ? 'mek-button-primary group'
                                  : 'bg-gray-700/50 text-gray-500 cursor-not-allowed border border-gray-600'
                              }`}
                              onMouseEnter={() => {
                                if (!craftable) {
                                  setHoveredCraftButton(recipe.id);
                                }
                              }}
                              onMouseLeave={() => setHoveredCraftButton(null)}
                            >
                              {craftable && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                              )}
                              
                              <span className="relative flex items-center justify-center">
                                <span>CRAFT</span>
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selected Recipe Modal */}
          {selectedRecipe && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-gradient-to-b from-gray-900 to-black border-2 border-yellow-400/50 max-w-md w-full shadow-[0_0_50px_rgba(250,204,21,0.2)]">
                <div className="p-6 border-b border-gray-800 bg-gradient-to-r from-gray-950 to-gray-900">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-yellow-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      CONFIRM PRODUCTION
                    </h3>
                    <button
                      onClick={() => setSelectedRecipe(null)}
                      className="text-gray-400 hover:text-white text-2xl transition-colors"
                    >
                      ×
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="mb-6 text-center p-4 bg-gradient-to-b from-gray-800/30 to-gray-900/30 border border-gray-700">
                    <div className="text-sm text-gray-400 mb-2 uppercase tracking-wider">Output Product</div>
                    <div className="text-2xl font-bold text-yellow-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      T{selectedTier} UNIVERSAL CHIP ×1
                    </div>
                    {selectedRecipe.rarityBiasBonus > 0 && (
                      <div className="mt-2 text-cyan-400">
                        +{selectedRecipe.rarityBiasBonus}% Rarity Bias Applied
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedRecipe(null)}
                      className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold uppercase tracking-wider transition-colors"
                    >
                      CANCEL
                    </button>
                    <button
                      onClick={() => {
                        console.log('Crafting:', selectedRecipe);
                        setSelectedRecipe(null);
                      }}
                      disabled={!canCraft(selectedRecipe)}
                      className={`flex-1 py-3 font-bold uppercase tracking-wider transition-all ${
                        canCraft(selectedRecipe)
                          ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black'
                          : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {canCraft(selectedRecipe) ? 'EXECUTE' : 'UNAVAILABLE'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Bias Meter Tooltip */}
          {showBiasTooltip && (
            <div 
              className="fixed z-50 pointer-events-none"
              style={{
                left: `${biasTooltipPos.x}px`,
                top: `${biasTooltipPos.y}px`,
                transform: 'translate(-50%, 0)'
              }}
            >
              <div className="bg-black/95 border border-yellow-400/50 px-4 py-3 rounded-lg shadow-[0_0_20px_rgba(250,182,23,0.3)] backdrop-blur-sm max-w-xs">
                <div className="text-sm text-gray-300 leading-relaxed">
                  This is your rarity bias ranking. Select more difficult recipes to increase your rating for a craft.
                </div>
                <div className="absolute left-1/2 transform -translate-x-1/2 -top-2">
                  <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-yellow-400/50"></div>
                  <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[7px] border-b-black/95 absolute top-[1px] left-[-5px]"></div>
                </div>
              </div>
            </div>
          )}


          {/* Industrial Tooltip */}
          {showTooltip && hoveredTier && (
            <div 
              className="fixed z-50 pointer-events-none"
              style={{
                left: `${tooltipPosition.x}px`,
                top: `${tooltipPosition.y}px`,
                transform: 'translate(-50%, -100%)'
              }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/20 blur-xl" />
                
                <div className="relative bg-gradient-to-b from-gray-900 to-black border-2 border-red-500/50 px-5 py-4 shadow-2xl backdrop-blur-sm mb-2"
                  style={{
                    clipPath: theme.clipPaths.cornerCut,
                  }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <div className="text-red-400 font-bold text-sm uppercase tracking-wider">ACCESS DENIED</div>
                  </div>
                  
                  <div className="text-gray-300 text-sm mb-2">
                    {chipTiers.find(t => t.tier === hoveredTier)?.description}
                  </div>
                  
                  <div className="pt-2 border-t border-gray-800">
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">REQUIREMENT</div>
                    <div className="text-yellow-400 font-bold">
                      REACH LEVEL {chipTiers.find(t => t.tier === hoveredTier)?.requiredLevel}
                    </div>
                  </div>
                </div>
                
                <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-black mx-auto" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}