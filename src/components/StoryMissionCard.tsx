'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import HolographicButton from '@/components/ui/SciFiButtons/HolographicButton';
import { TIER_COLORS, MODIFIER_COLORS } from '@/lib/chipRewardCalculator';
import SuccessMeterV2 from '@/components/SuccessMeterV2';
import { renderDifficultyButton } from './StoryMissionCard-buttonStyles';
import { getVariationImage } from '@/lib/variations-helper';

// Type definitions
interface MissionReward {
  name: string;
  quantity?: number;
  chance: number;
}

interface VariationBuff {
  id: string;
  name: string;
  bonus: string;
}

interface StoryMissionCardProps {
  // Core mission data
  title?: string;
  mekImage?: string; // Path to the mek image
  mekName?: string;
  mekRank?: number;

  // Rewards
  primaryReward?: number;
  experience?: number;
  potentialRewards?: MissionReward[];

  // Variation buffs
  variationBuffs?: VariationBuff[];
  buffCategoryId?: number; // Total active contracts for buff category

  // Success and deployment
  successChance?: number;
  deploymentFee?: number;
  onDeploy?: () => void;
  onMekSlotClick?: (slotIndex: number) => void;
  onMekRemove?: (slotIndex: number) => void;
  availableSlots?: number; // Number of available mek slots (1-8)
  selectedMeks?: any[]; // Array of selected meks for this mission

  // Styling
  scale?: number;
  style?: React.CSSProperties;
  rewardBarStyle?: 1 | 2 | 3; // For different reward bar designs
  lockedStyle?: 1 | 2 | 3 | 4 | 5; // For different locked difficulty styles
  completedDifficulties?: Set<'easy' | 'medium' | 'hard'>;
  onDifficultyComplete?: (difficulty: 'easy' | 'medium' | 'hard') => void;

  // Success bar customization props
  meterVariant?: 1 | 2 | 3 | 4 | 5;
  layoutStyle?: 1 | 2 | 3 | 4 | 5;
  subLayoutStyle?: 1.1 | 1.2 | 1.3 | 1.4 | 1.5;

  // Variation buff layout style
  variationBuffLayoutStyle?: 1 | 2 | 3 | 4 | 5;

  // Success meter card layout
  successMeterCardLayout?: 1 | 2 | 3 | 4 | 5;

  // State
  isLocked?: boolean;
  isEmpty?: boolean;

  // Difficulty system
  currentDifficulty?: 'easy' | 'medium' | 'hard';
  onDifficultyChange?: (difficulty: 'easy' | 'medium' | 'hard') => void;
  showDifficultySelector?: boolean;
  difficultyConfig?: any; // DifficultyConfig from difficultyModifiers
  mekContributions?: Array<{
    mekId: string;
    name: string;
    rank: number;
    contribution: number;
  }>;
}

export default function StoryMissionCard({
  title = "MEK #1432",
  mekImage = "/variation-images/camera.png",
  mekName = "MEK #1432",
  mekRank,
  primaryReward = 250000,
  experience = 5000,
  potentialRewards = [
    { name: "Common Power Chip", quantity: 2, chance: 75 },
    { name: "Bumblebee Essence", quantity: 1.5, chance: 45 },
    { name: "Paul Essence", quantity: 2, chance: 30 },
    { name: "DMT Canister", quantity: 1, chance: 15 },
    { name: "Rare Power Chip", quantity: 1, chance: 8 },
    { name: "Legendary Frame", quantity: 1, chance: 1 },
  ],
  variationBuffs = [
    { id: "taser", name: "TASER", bonus: "+10%" },
    { id: "log", name: "LOG", bonus: "+10%" },
    { id: "kevlar", name: "KEVLAR", bonus: "+10%" },
    { id: "nuke", name: "NUKE", bonus: "+10%" },
    { id: "exposed", name: "EXPOSED", bonus: "+10%" },
  ],
  buffCategoryId = 0,
  successChance = 65,
  deploymentFee = 50000,
  onDeploy,
  onMekSlotClick,
  onMekRemove,
  availableSlots = 8,
  selectedMeks = [],
  scale = 1.0,
  style,
  rewardBarStyle = 1,
  isLocked = false,
  isEmpty = false,
  currentDifficulty = 'medium',
  onDifficultyChange,
  showDifficultySelector = false,
  difficultyConfig,
  mekContributions = [],
  lockedStyle = 1,
  completedDifficulties = new Set(),
  onDifficultyComplete,
  // Success bar customization props
  meterVariant: propMeterVariant,
  layoutStyle: propLayoutStyle,
  subLayoutStyle: propSubLayoutStyle,
  variationBuffLayoutStyle = 1,
  successMeterCardLayout = 1
}: StoryMissionCardProps) {
  const [hoveredBuff, setHoveredBuff] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showLightbox, setShowLightbox] = useState(false);
  const [isHoveringDeployButton, setIsHoveringDeployButton] = useState(false);
  const [showDeployTooltip, setShowDeployTooltip] = useState(false);
  const [selectedChip, setSelectedChip] = useState<{ tier: number; modifier: string } | null>(null);
  const [clickedChip, setClickedChip] = useState<{ tier: number; modifier: string } | null>(null);
  const [successBarLayout, setSuccessBarLayout] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [successBarSubLayout, setSuccessBarSubLayout] = useState<1.1 | 1.2 | 1.3 | 1.4 | 1.5>(1.1);
  const [meterVariantState, setMeterVariantState] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Use props if provided, otherwise use internal state
  const meterVariant = propMeterVariant || meterVariantState;
  const layoutStyle = propLayoutStyle || successBarLayout;
  const subLayoutStyle = propSubLayoutStyle || successBarSubLayout;

  // Check if all difficulties are completed
  const allDifficultiesCompleted =
    completedDifficulties.has('easy') &&
    completedDifficulties.has('medium') &&
    completedDifficulties.has('hard');

  // Auto-select available difficulty if current one is completed
  React.useEffect(() => {
    if (!allDifficultiesCompleted && completedDifficulties.has(currentDifficulty)) {
      // Try to select the next available difficulty
      const difficulties: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard'];
      const availableDifficulty = difficulties.find(d => !completedDifficulties.has(d));
      if (availableDifficulty && onDifficultyChange) {
        onDifficultyChange(availableDifficulty);
      }
    }
  }, [completedDifficulties, currentDifficulty, onDifficultyChange, allDifficultiesCompleted]);

  const formatGoldAmount = (amount: number): string => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${amount.toLocaleString()}`;
    return amount.toLocaleString();
  };
  
  // Logarithmic rarity tier system based on percentage chance
  const getRarityTier = (chance: number): { color: string; tier: string } => {
    // Triple X (Red) - Extremely rare: 1-3%
    if (chance <= 3) return { color: 'text-red-500', tier: 'XXX' };
    // Double X (Orange-Red) - Very rare: 4-6%
    if (chance <= 6) return { color: 'text-orange-500', tier: 'XX' };
    // X (Orange) - Rare: 7-10%
    if (chance <= 10) return { color: 'text-orange-400', tier: 'X' };
    // S (Gold) - Uncommon: 11-15%
    if (chance <= 15) return { color: 'text-yellow-500', tier: 'S' };
    // A (Yellow) - Uncommon: 16-25%
    if (chance <= 25) return { color: 'text-yellow-400', tier: 'A' };
    // B (Lime) - Common: 26-40%
    if (chance <= 40) return { color: 'text-lime-400', tier: 'B' };
    // C (Green) - Common: 41-60%
    if (chance <= 60) return { color: 'text-green-400', tier: 'C' };
    // D (Blue-Green) - Very Common: 61-80%
    if (chance <= 80) return { color: 'text-emerald-400', tier: 'D' };
    // E (Blue) - Extremely Common: 81-95%
    if (chance <= 95) return { color: 'text-blue-400', tier: 'E' };
    // F (Gray) - Guaranteed: 96-100%
    return { color: 'text-gray-400', tier: 'F' };
  };

  // Mock function to get owned mek count for a variation (for testing)
  const getOwnedMekCount = (variationName: string): number => {
    // Generate random counts for testing
    const seed = variationName.charCodeAt(0) + variationName.charCodeAt(1);
    return Math.floor((seed % 50) + 1);
  };

  // Mock function to get available mek count for a variation (for testing)
  const getAvailableMekCount = (variationName: string): number => {
    const owned = getOwnedMekCount(variationName);
    // Return about 30-70% of owned meks as available
    const availablePercent = 0.3 + Math.random() * 0.4;
    return Math.max(1, Math.floor(owned * availablePercent));
  };

  // If empty, show skeleton
  if (isEmpty) {
    return (
      <div 
        className="relative w-full max-w-md mx-auto"
        style={{ transform: `scale(${scale})`, transformOrigin: 'top center', ...style }}
      >
        <div className="mek-card-industrial mek-border-sharp-gold overflow-hidden opacity-20">
          <div className="h-[800px]" />
        </div>
      </div>
    );
  }

  // If locked, show locked state
  if (isLocked) {
    return (
      <div 
        className="relative w-full max-w-md mx-auto"
        style={{ transform: `scale(${scale})`, transformOrigin: 'top center', ...style }}
      >
        <div className="mek-card-industrial mek-border-sharp-gold overflow-hidden opacity-30">
          <div className="h-[800px] flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl text-yellow-400 mb-2">LOCKED</div>
              <div className="text-sm text-gray-400">Complete previous nodes to unlock</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div
      className="relative w-full max-w-[320px] mx-auto"
      style={{ transform: `scale(${scale})`, transformOrigin: 'top center', ...style }}
    >
      <div className="mek-card-industrial mek-border-sharp-gold overflow-hidden">

        {/* Mek Image Section with Hazard Stripe Header */}
        <div className="relative">
          {/* Mek Image - Full width, no padding */}
          <div
            className="relative w-full aspect-square bg-black overflow-hidden cursor-pointer group"
            onClick={() => setShowLightbox(true)}
          >
            {mekImage && (
              <>
                <Image
                  src={mekImage}
                  alt={mekName}
                  fill
                  className="object-contain transition-all duration-300 group-hover:scale-105 group-hover:brightness-110"
                  style={{ imageRendering: 'crisp-edges' }}
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-black/80 px-2 py-1 rounded border border-yellow-500/50">
                    <span className="text-xs text-yellow-400">Click to enlarge</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Hazard Stripe Header Bar */}
          <div className="relative h-12 bg-gradient-to-r from-black via-gray-900 to-black border-t-2 border-b-2 border-yellow-500/50 overflow-hidden">
            {/* Diagonal hazard stripes - darkened */}
            <div
              className="absolute inset-0 opacity-15"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  45deg,
                  #fab617,
                  #fab617 10px,
                  #000000 10px,
                  #000000 20px
                )`,
              }}
            />

            {/* Content overlay */}
            <div className="relative h-full flex items-center justify-between px-4">
              <h2 className="text-xl font-black tracking-wider uppercase">
                {mekName && (
                  <>
                    <span className="text-white">MEK </span>
                    <span className="text-yellow-400">#{mekName.replace(/^MEK\s*#?/i, '')}</span>
                  </>
                )}
              </h2>
              {mekRank !== undefined && mekRank !== null && (
                <div className="text-sm text-gray-300">
                  Rank <span className="text-yellow-400 font-bold text-lg">{mekRank}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Difficulty Selector with Multiple Style Options */}
        {showDifficultySelector && (
          <div className="bg-black/80 border-b border-yellow-500/30 px-2 py-2 relative">
            <div className="flex gap-1.5 justify-center">
              {(['easy', 'medium', 'hard'] as const).map(difficulty => {
                const isSelected = currentDifficulty === difficulty;
                const isCompleted = completedDifficulties.has(difficulty);
                return renderDifficultyButton(
                  difficulty,
                  isSelected,
                  2, // Lock in Intense Neon Bloom style
                  () => {
                    if (!isCompleted) {
                      onDifficultyChange?.(difficulty);
                    }
                  },
                  isCompleted,
                  lockedStyle
                );
              })}
            </div>

            {/* COMPLETE overlay when all difficulties are done */}
            {allDifficultiesCompleted && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-3xl font-black text-yellow-400 uppercase tracking-wider animate-pulse"
                  style={{
                    textShadow: `
                      0 0 20px rgba(250, 204, 21, 1),
                      0 0 40px rgba(250, 204, 21, 0.8),
                      0 0 60px rgba(250, 204, 21, 0.6),
                      0 0 80px rgba(250, 204, 21, 0.4)
                    `,
                    background: 'linear-gradient(135deg, #fbbf24, #fde68a, #fbbf24)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  COMPLETE
                </div>
              </div>
            )}
          </div>
        )}

        {/* Gold and XP Bar - Compact side-by-side */}
        <div className="relative bg-black/90 border-y border-yellow-500/30 overflow-hidden">
          {/* Content */}
          <div className="relative grid grid-cols-2 h-12">
            {/* Gold Section - Centered as a unit in left column */}
            <div className="flex items-center justify-center">
              <div className="flex items-end gap-0.5">
                <span className="text-[22px] font-semibold text-yellow-400 leading-none" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
                  {formatGoldAmount(primaryReward)}
                </span>
                <span className="text-[11px] text-yellow-400 font-bold mb-[1px]" style={{ fontFamily: 'Segoe UI, sans-serif' }}>G</span>
              </div>
            </div>

            {/* Divider - Positioned at exact center */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-6 bg-gray-600/50" />

            {/* XP Section - Centered as a unit in right column */}
            <div className="flex items-center justify-center">
              <div className="flex items-end gap-0.5">
                <span className="text-[22px] font-semibold text-blue-400 leading-none" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
                  +{formatGoldAmount(experience)}
                </span>
                <span className="text-[11px] text-blue-400/80 font-bold mb-[1px]" style={{ fontFamily: 'Segoe UI, sans-serif' }}>XP</span>
              </div>
            </div>
          </div>
        </div>


        <div className="p-3 relative">

          {/* Potential Rewards */}
          <div className="bg-black/60 rounded-lg p-3 mb-4 border border-gray-700">
            <div className="mek-label-uppercase mb-2 text-[10px]">Potential Rewards</div>
            <div className="space-y-1">
              {potentialRewards.slice(0, 6).map((reward, i) => {
                // Check if this is a chip reward (format: "T[tier] [modifier] Power Chip")
                const chipMatch = reward.name.match(/T(\d+)\s+(\w+)\s+Power Chip/);
                const isChipReward = !!chipMatch;
                let chipColor = 'text-gray-300';
                let chipIcon = null;

                if (isChipReward && chipMatch) {
                  const tier = parseInt(chipMatch[1]);
                  const modifier = chipMatch[2].toUpperCase();

                  // Get color from MODIFIER_COLORS based on the modifier letter
                  const modifierColor = MODIFIER_COLORS[modifier as keyof typeof MODIFIER_COLORS];
                  if (modifierColor) {
                    chipColor = modifierColor;
                  }

                  // Build chip icon path
                  const chipFileName = `${tier}${modifier.toLowerCase()}.webp`;
                  chipIcon = `/chip-images/uni-chips/uni chips 75px webp/${chipFileName}`;
                }

                return (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isChipReward && chipIcon ? (
                        <div
                          className="w-5 h-5 relative cursor-pointer transition-all duration-200 hover:scale-125 active:scale-95"
                          onClick={() => {
                            if (chipMatch) {
                              const tier = parseInt(chipMatch[1]);
                              const modifier = chipMatch[2].toLowerCase();
                              setClickedChip({ tier, modifier });
                              setSelectedChip({ tier, modifier });
                            }
                          }}
                          onMouseEnter={() => {
                            if (chipMatch) {
                              const tier = parseInt(chipMatch[1]);
                              const modifier = chipMatch[2].toLowerCase();
                              setSelectedChip({ tier, modifier });
                            }
                          }}
                          onMouseLeave={() => {
                            if (!clickedChip) {
                              setSelectedChip(null);
                            }
                          }}
                        >
                          <Image
                            src={chipIcon}
                            alt={reward.name}
                            fill
                            className="object-contain drop-shadow-[0_0_4px_rgba(250,182,23,0.3)] hover:drop-shadow-[0_0_8px_rgba(250,182,23,0.6)]"
                            style={{
                              filter: selectedChip?.tier === parseInt(chipMatch[1]) && selectedChip?.modifier === chipMatch[2].toLowerCase()
                                ? 'brightness(1.2)'
                                : 'brightness(1)'
                            }}
                          />
                          {/* Click animation ring */}
                          {clickedChip?.tier === parseInt(chipMatch[1]) && clickedChip?.modifier === chipMatch[2].toLowerCase() && (
                            <div className="absolute inset-0 pointer-events-none">
                              <div className="absolute inset-0 rounded-full border-2 border-yellow-400 animate-ping" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-4 h-4 bg-yellow-500/20 rounded" />
                      )}
                      <span className="text-[10.5px]" style={{ color: isChipReward ? chipColor : undefined }} className={!isChipReward ? getRarityTier(reward.chance).color : ''}>
                        {reward.name}
                      </span>
                      {reward.quantity && (
                        <span className="text-[9.5px] text-gray-500">x{reward.quantity}</span>
                      )}
                    </div>
                    <span className="text-[10.5px] font-bold" style={{ color: isChipReward ? chipColor : undefined }} className={!isChipReward ? getRarityTier(reward.chance).color : ''}>
                      {reward.chance}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Variation Buffs Card - Dynamic Layout Based on Style */}
          <div className="bg-black/60 rounded-lg p-3 mb-4 border border-gray-700">
            {variationBuffLayoutStyle === 1 && (
              // Layout 1: Horizontal with Text (current)
              <>
                <div className="text-xs text-gray-500 uppercase tracking-wider text-center mb-2">Variation Buffs</div>
                <div className="flex items-center justify-center gap-3">
                  <div className="text-[11px] text-gray-400 max-w-[90px] text-center leading-tight">
                    Match traits for success bonuses
                  </div>
                  <div className="w-px h-10 bg-gray-600/50" />
                  <div className="flex items-center gap-2">
                    {variationBuffs.map((buff, index) => {
                      const imagePath = getVariationImage(buff.name);
                      return (
                        <div key={`${buff.id}-${index}`} className="flex flex-col items-center">
                          <div
                            className="relative w-[48px] h-[48px] rounded-full bg-black/80 border border-gray-700/50 overflow-hidden cursor-pointer transition-all hover:scale-110 hover:border-yellow-400/50"
                            onMouseEnter={(e) => {
                              setHoveredBuff(buff.name);
                              const rect = e.currentTarget.getBoundingClientRect();
                              setMousePos({ x: rect.left + rect.width / 2, y: rect.top });
                            }}
                            onMouseLeave={() => setHoveredBuff(null)}
                            onMouseMove={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setMousePos({ x: rect.left + rect.width / 2, y: rect.top });
                            }}
                          >
                            <Image src={imagePath} alt={buff.name} fill className="object-cover" style={{ imageRendering: 'crisp-edges' }} />
                          </div>
                          <span className="text-[10px] text-yellow-400 font-bold mt-0.5">{buff.bonus}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {variationBuffLayoutStyle === 2 && (
              // Layout 2: Classic Grid (original 2x3 or 2x2 grid)
              <>
                <div className="text-center mb-2">
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Variation Buffs</div>
                  <div className="text-[11px] text-gray-400 mt-1">Match traits for success bonuses</div>
                </div>
                <div className="flex justify-center">
                  <div className={`grid ${variationBuffs.length === 3 ? 'grid-cols-3' : 'grid-cols-4'} gap-2.5 max-w-[350px]`}>
                    {variationBuffs.map((buff, index) => {
                      const imagePath = getVariationImage(buff.name);
                      return (
                        <div key={`${buff.id}-${index}`} className="flex flex-col items-center">
                          <div
                            className="relative w-[68px] h-[68px] rounded-full bg-black/80 border border-gray-700/50 overflow-hidden cursor-pointer transition-all hover:scale-105 hover:border-yellow-400/50"
                            onMouseEnter={(e) => {
                              setHoveredBuff(buff.name);
                              const rect = e.currentTarget.getBoundingClientRect();
                              setMousePos({ x: rect.left + rect.width / 2, y: rect.top });
                            }}
                            onMouseLeave={() => setHoveredBuff(null)}
                            onMouseMove={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setMousePos({ x: rect.left + rect.width / 2, y: rect.top });
                            }}
                          >
                            <Image src={imagePath} alt={buff.name} fill className="object-cover" style={{ imageRendering: 'crisp-edges' }} />
                          </div>
                          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-0.5">{buff.name}</span>
                          <span className="text-[11px] text-yellow-400 font-bold mt-0.5">{buff.bonus}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {variationBuffLayoutStyle === 3 && (
              // Layout 3: Vertical Stack (text on top, buffs below)
              <>
                <div className="text-center mb-3">
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Variation Buffs</div>
                  <div className="text-[10px] text-gray-400 mt-1">Match traits for success bonuses</div>
                </div>
                <div className="flex justify-center gap-2">
                  {variationBuffs.map((buff, index) => {
                    const imagePath = getVariationImage(buff.name);
                    return (
                      <div key={`${buff.id}-${index}`} className="flex flex-col items-center">
                        <div
                          className="relative w-[50px] h-[50px] rounded-full bg-black/80 border-2 border-gray-700/50 overflow-hidden cursor-pointer transition-all hover:scale-110 hover:border-yellow-400/50"
                          onMouseEnter={(e) => {
                            setHoveredBuff(buff.name);
                            const rect = e.currentTarget.getBoundingClientRect();
                            setMousePos({ x: rect.left + rect.width / 2, y: rect.top });
                          }}
                          onMouseLeave={() => setHoveredBuff(null)}
                          onMouseMove={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setMousePos({ x: rect.left + rect.width / 2, y: rect.top });
                          }}
                        >
                          <Image src={imagePath} alt={buff.name} fill className="object-cover" style={{ imageRendering: 'crisp-edges' }} />
                        </div>
                        <span className="text-[11px] text-yellow-400 font-bold mt-1">{buff.bonus}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {variationBuffLayoutStyle === 4 && (
              // Layout 4: Compact Pills (small pill-shaped badges)
              <>
                <div className="text-xs text-gray-500 uppercase tracking-wider text-center mb-2">Variation Buffs</div>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {variationBuffs.map((buff, index) => {
                    const imagePath = getVariationImage(buff.name);
                    return (
                      <div
                        key={`${buff.id}-${index}`}
                        className="flex items-center gap-1.5 bg-black/80 border border-gray-700/50 rounded-full px-2 py-1 cursor-pointer transition-all hover:scale-105 hover:border-yellow-400/50"
                        onMouseEnter={(e) => {
                          setHoveredBuff(buff.name);
                          const rect = e.currentTarget.getBoundingClientRect();
                          setMousePos({ x: rect.left + rect.width / 2, y: rect.top });
                        }}
                        onMouseLeave={() => setHoveredBuff(null)}
                        onMouseMove={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setMousePos({ x: rect.left + rect.width / 2, y: rect.top });
                        }}
                      >
                        <div className="relative w-[24px] h-[24px] rounded-full overflow-hidden">
                          <Image src={imagePath} alt={buff.name} fill className="object-cover" style={{ imageRendering: 'crisp-edges' }} />
                        </div>
                        <span className="text-[10px] text-gray-400 uppercase">{buff.name}</span>
                        <span className="text-[10px] text-yellow-400 font-bold">{buff.bonus}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="text-[9px] text-gray-400 text-center mt-2">Match traits for success bonuses</div>
              </>
            )}

            {variationBuffLayoutStyle === 5 && (
              // Layout 5: Side by Side (text left, buffs right)
              <div className="flex items-center justify-between gap-4">
                <div className="flex-shrink-0">
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Variation Buffs</div>
                  <div className="text-[10px] text-gray-400 mt-1 max-w-[100px]">Match traits for success bonuses</div>
                </div>
                <div className="flex gap-1.5">
                  {variationBuffs.map((buff, index) => {
                    const imagePath = getVariationImage(buff.name);
                    return (
                      <div key={`${buff.id}-${index}`} className="flex flex-col items-center">
                        <div
                          className="relative w-[44px] h-[44px] rounded-full bg-black/80 border border-gray-700/50 overflow-hidden cursor-pointer transition-all hover:scale-110 hover:border-yellow-400/50"
                          onMouseEnter={(e) => {
                            setHoveredBuff(buff.name);
                            const rect = e.currentTarget.getBoundingClientRect();
                            setMousePos({ x: rect.left + rect.width / 2, y: rect.top });
                          }}
                          onMouseLeave={() => setHoveredBuff(null)}
                          onMouseMove={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setMousePos({ x: rect.left + rect.width / 2, y: rect.top });
                          }}
                        >
                          <Image src={imagePath} alt={buff.name} fill className="object-cover" style={{ imageRendering: 'crisp-edges' }} />
                        </div>
                        <span className="text-[9px] text-yellow-400 font-bold mt-0.5">{buff.bonus}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          {/* Mek Deployment Slots Card */}
          <div className="bg-black/60 rounded-lg p-3 mb-4 border border-gray-700">
            <div className="text-xs text-gray-500 uppercase tracking-wider text-center mb-2">Mek Deployment Slots</div>
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((slot) => {
                const isAvailable = slot <= availableSlots;
                const selectedMek = selectedMeks[slot - 1];

                return (
                  <div
                    key={slot}
                    className={`aspect-square p-1 border-2 flex items-center justify-center transition-all relative overflow-hidden group ${
                      selectedMek
                        ? 'border-solid border-yellow-500/50 bg-gradient-to-br from-yellow-900/20 to-black/60'
                        : isAvailable
                        ? `mek-slot-empty border-dashed bg-black/40 cursor-pointer ${
                            isHoveringDeployButton
                              ? 'border-yellow-400 bg-yellow-500/20 shadow-[inset_0_0_30px_rgba(250,182,23,0.4)] animate-pulse'
                              : 'border-yellow-500/30 hover:border-yellow-500/60 hover:bg-yellow-500/10 hover:shadow-[inset_0_0_20px_rgba(250,182,23,0.2)]'
                          }`
                        : 'border-solid border-gray-800/30 bg-black/80 cursor-not-allowed opacity-30'
                    }`}
                    onClick={
                      selectedMek
                        ? undefined
                        : isAvailable && onMekSlotClick
                        ? () => onMekSlotClick(slot - 1)
                        : undefined
                    }
                  >
                    {selectedMek ? (
                      <>
                        {/* Mek Image */}
                        <Image
                          src={selectedMek.image}
                          alt={`MEK #${selectedMek.id}`}
                          fill
                          className="object-cover"
                          style={{ imageRendering: 'crisp-edges' }}
                        />
                        {/* Remove button */}
                        {onMekRemove && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onMekRemove(slot - 1);
                            }}
                            className="absolute top-0 right-0 w-5 h-5 bg-red-500/80 hover:bg-red-500 flex items-center justify-center transition-colors"
                            title="Remove Mek"
                          >
                            <span className="text-white text-xs font-bold">×</span>
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="text-center">
                        <div className={`text-2xl transition-colors ${isAvailable ? 'text-gray-600 group-hover:text-yellow-500/70' : 'text-gray-800'}`}>
                          {isAvailable ? '+' : '×'}
                        </div>
                        <div className={`text-[8px] uppercase transition-colors ${isAvailable ? 'text-gray-600 group-hover:text-yellow-500/50' : 'text-gray-800'}`}>
                          {isAvailable ? 'Empty' : 'Locked'}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Success Meter - using new SuccessMeterV2 component */}
          {difficultyConfig ? (
            <div className="mb-4">
              {/* Layout Selector for Testing - Only show if no props are provided */}
              {!propMeterVariant && !propLayoutStyle && !propSubLayoutStyle && false && (
                <div className="mb-3 bg-black/60 rounded-lg p-2 border border-gray-700">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Success Bar Layout</div>

                {/* Meter Variant Selector */}
                <div className="mb-2">
                  <div className="text-[9px] text-gray-500 mb-1">Meter Design:</div>
                  <div className="grid grid-cols-5 gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((variant) => (
                      <button
                        key={variant}
                        onClick={() => setMeterVariantState(variant as 1 | 2 | 3 | 4 | 5)}
                        className={`
                          px-1 py-0.5 rounded text-[10px] font-bold transition-all
                          ${meterVariant === variant
                            ? 'bg-green-500/30 border border-green-400 text-green-400'
                            : 'bg-black/30 border border-gray-700 text-gray-600 hover:border-gray-500 hover:text-gray-400'
                          }
                        `}
                        title={[
                          'Current Design',
                          'Tactical Industrial',
                          'Holographic Modern',
                          'Military Command',
                          'Cinematic Sci-Fi'
                        ][variant - 1]}
                      >
                        {variant}
                      </button>
                    ))}
                  </div>
                  <div className="text-[8px] text-gray-600">
                    {[
                      'Current Design',
                      'Tactical Industrial',
                      'Holographic Modern',
                      'Military Command',
                      'Cinematic Sci-Fi'
                    ][meterVariant - 1]}
                  </div>
                </div>

                {/* Main Layout Selector */}
                <div className="grid grid-cols-5 gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((layout) => (
                    <button
                      key={layout}
                      onClick={() => {
                        setSuccessBarLayout(layout as 1 | 2 | 3 | 4 | 5);
                        // Reset to first sub-layout when changing main layout
                        if (layout === 1) {
                          setSuccessBarSubLayout(1.1);
                        }
                      }}
                      className={`
                        px-2 py-1 rounded text-xs font-bold transition-all
                        ${layoutStyle === layout
                          ? 'bg-yellow-500/30 border-2 border-yellow-400 text-yellow-400'
                          : 'bg-black/40 border-2 border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-400'
                        }
                      `}
                      title={`Layout ${layout}: ${[
                        'Vertical Stack',
                        'Two-Row',
                        'Grid Modular',
                        'Asymmetric',
                        'Compact Pills'
                      ][layout - 1]}`}
                    >
                      {layout}
                    </button>
                  ))}
                </div>

                {/* Sub-Layout Selector for Layout 1 */}
                {layoutStyle === 1 && (
                  <>
                    <div className="text-[9px] text-gray-500 mb-1">Vertical Stack Variations:</div>
                    <div className="grid grid-cols-5 gap-1 mb-2">
                      {[1.1, 1.2, 1.3, 1.4, 1.5].map((subLayout, index) => (
                        <button
                          key={subLayout}
                          onClick={() => setSuccessBarSubLayout(subLayout as 1.1 | 1.2 | 1.3 | 1.4 | 1.5)}
                          className={`
                            px-1 py-0.5 rounded text-[10px] font-semibold transition-all
                            ${subLayoutStyle === subLayout
                              ? 'bg-blue-500/30 border border-blue-400 text-blue-400'
                              : 'bg-black/30 border border-gray-700 text-gray-600 hover:border-gray-500 hover:text-gray-400'
                            }
                          `}
                          title={[
                            'Ultra-Compact Single Row',
                            'Two-Row Compact',
                            'Badge Rewards',
                            'Expandable View',
                            'Icon-Based Minimalist'
                          ][index]}
                        >
                          {index + 1}
                        </button>
                      ))}
                    </div>
                    <div className="text-[8px] text-gray-600">
                      {(() => {
                        const index = [1.1, 1.2, 1.3, 1.4, 1.5].indexOf(successBarSubLayout);
                        return [
                          'V1: Ultra-Compact Single Row',
                          'V2: Two-Row Compact Design',
                          'V3: Success with Mini Badge Rewards',
                          'V4: Collapsed/Expandable View',
                          'V5: Icon-Based Minimalist'
                        ][index];
                      })()}
                    </div>
                  </>
                )}

                {/* Description for other layouts */}
                {successBarLayout !== 1 && (
                  <div className="text-[9px] text-gray-500 mt-1">
                    {[
                      '',
                      '2: Two-Row Horizontal',
                      '3: Grid Modular 2x2',
                      '4: Asymmetric Hero',
                      '5: Compact Badge/Pills'
                    ][layoutStyle]}
                  </div>
                )}
              </div>
              )}

              <SuccessMeterV2
                successRate={successChance || 0}
                greenLine={difficultyConfig?.successGreenLine || 50}
                baseRewards={{
                  gold: primaryReward || 250000,
                  xp: experience || 5000
                }}
                difficultyConfig={{
                  goldMultiplier: difficultyConfig?.goldMultiplier || 1,
                  xpMultiplier: difficultyConfig?.xpMultiplier || 1,
                  essenceAmountMultiplier: difficultyConfig?.essenceAmountMultiplier || 1,
                  overshootBonusRate: difficultyConfig?.overshootBonusRate || 1,
                  maxOvershootBonus: difficultyConfig?.maxOvershootBonus || 50
                }}
                showTitle={true}
                barHeight={56}
                className=""
                cardLayout={successMeterCardLayout}
              />
            </div>
          ) : (
            // Fallback when no difficulty config
            <div className="mb-4">
              <SuccessMeterV2
                successRate={successChance || 0}
                greenLine={50} // Default goalpost at 50%
                baseRewards={{
                  gold: primaryReward || 250000,
                  xp: experience || 5000
                }}
                difficultyConfig={{
                  goldMultiplier: 1,
                  xpMultiplier: 1,
                  essenceAmountMultiplier: 1,
                  overshootBonusRate: 1,
                  maxOvershootBonus: 50
                }}
                showTitle={true}
                barHeight={56}
                className=""
                cardLayout={successMeterCardLayout}
              />
            </div>
          )}

          {/* Deploy Section */}
          <div className="text-center relative">
            <div className="text-sm text-gray-400 mb-1">
              <span className="uppercase tracking-wider">Deployment Fee:</span> <span className="text-yellow-400 font-bold text-base">{formatGoldAmount(deploymentFee)} Gold</span>
            </div>
            <div
              className="transform scale-75 cursor-pointer"
              onMouseEnter={() => {
                if (!selectedMeks || selectedMeks.length === 0) {
                  setIsHoveringDeployButton(true);
                  setShowDeployTooltip(true);
                }
              }}
              onMouseLeave={() => {
                setIsHoveringDeployButton(false);
                setShowDeployTooltip(false);
              }}
              onMouseMove={(e) => {
                if (!selectedMeks || selectedMeks.length === 0) {
                  setMousePos({ x: e.clientX, y: e.clientY });
                }
              }}
            >
              <HolographicButton
                text="DEPLOY"
                onClick={onDeploy}
                isActive={selectedMeks && selectedMeks.length > 0}
                variant="yellow"
                alwaysOn={true}
                disabled={!selectedMeks || selectedMeks.length === 0}
                className="w-full [&>div]:cursor-pointer"
              />
            </div>
            {/* Tooltip for inactive deploy button */}
            {showDeployTooltip && typeof window !== 'undefined' && createPortal(
              <div
                className="fixed pointer-events-none"
                style={{
                  left: `${Math.min(Math.max(mousePos.x, 150), window.innerWidth - 150)}px`,
                  top: `${mousePos.y - 60}px`,
                  transform: 'translateX(-50%)',
                  zIndex: 99999,
                }}
              >
                <div className="bg-black/95 border border-yellow-400/50 px-3 py-2 rounded shadow-xl">
                  <div className="text-sm text-yellow-400 whitespace-nowrap">
                    Please enlist at least one mechanism
                  </div>
                </div>
              </div>,
              document.body
            )}
          </div>

          {/* Metal texture overlay */}
          <div className="mek-overlay-metal-texture"></div>
        </div>
      </div>

      {/* Lightbox for chip image */}
      {selectedChip && clickedChip && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center"
          onClick={() => {
            setSelectedChip(null);
            setClickedChip(null);
          }}
        >
          {/* Background overlay */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Chip image container */}
          <div
            className="relative flex items-center justify-center p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glow effect behind chip - using modifier color */}
            <div
              className="absolute w-[500px] h-[500px] rounded-full opacity-40"
              style={{
                background: `radial-gradient(circle, ${MODIFIER_COLORS[selectedChip.modifier.toUpperCase() as keyof typeof MODIFIER_COLORS] || '#999999'}88 0%, transparent 70%)`,
                filter: 'blur(40px)'
              }}
            />

            {/* Chip image */}
            <div className="relative">
              <Image
                src={`/chip-images/uni-chips/uni chips 700px webp/${selectedChip.tier}${selectedChip.modifier}.webp`}
                alt={`Tier ${selectedChip.tier} ${selectedChip.modifier.toUpperCase()} Universal Chip`}
                width={700}
                height={700}
                className="relative z-10 animate-in fade-in zoom-in-95 duration-300"
                style={{
                  imageRendering: 'crisp-edges',
                  filter: `drop-shadow(0 0 30px ${MODIFIER_COLORS[selectedChip.modifier.toUpperCase() as keyof typeof MODIFIER_COLORS] || '#999999'}88)`
                }}
              />

              {/* Chip info */}
              <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center">
                <div
                  className="text-2xl font-bold uppercase tracking-wider"
                  style={{
                    color: MODIFIER_COLORS[selectedChip.modifier.toUpperCase() as keyof typeof MODIFIER_COLORS] || '#999999',
                    textShadow: `0 0 20px ${MODIFIER_COLORS[selectedChip.modifier.toUpperCase() as keyof typeof MODIFIER_COLORS] || '#999999'}88, 0 0 40px ${MODIFIER_COLORS[selectedChip.modifier.toUpperCase() as keyof typeof MODIFIER_COLORS] || '#999999'}44`
                  }}
                >
                  Tier {selectedChip.tier} {selectedChip.modifier.toUpperCase()}
                </div>
                <div className="text-sm text-gray-400 mt-1">Universal Chip</div>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={() => {
                setSelectedChip(null);
                setClickedChip(null);
              }}
              className="absolute top-4 right-4 text-4xl text-yellow-400 hover:text-yellow-300 transition-colors duration-200"
              style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
            >
              ×
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Lightbox for mek image */}
      {showLightbox && mekImage && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center"
          onClick={() => setShowLightbox(false)}
        >
          {/* Background overlay - reduced darkening by 45% (from 90% to 50%) */}
          <div className="absolute inset-0 bg-black/50" />

          {/* Image container with animation - 150px padding on all sides */}
          <div
            className="relative flex items-center justify-center p-[150px] w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={mekImage.replace('/mek-images/', '/mek-images/1000px/')}
              alt={mekName}
              width={2000}
              height={2000}
              className="w-full h-full object-contain animate-in fade-in zoom-in-95 duration-300"
              style={{ imageRendering: 'crisp-edges' }}
            />

            {/* Close button - simplified to just X without circle */}
            <button
              onClick={() => setShowLightbox(false)}
              className="absolute top-[160px] right-[160px] text-5xl text-yellow-400 hover:text-yellow-300 transition-colors duration-200"
              style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
            >
              ×
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Tooltip for variation buffs - rendered via Portal */}
      {hoveredBuff && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed pointer-events-none"
          style={{
            left: `${mousePos.x}px`,
            top: `${mousePos.y - 60}px`,
            transform: 'translateX(-50%)',
            zIndex: 99999,
          }}
        >
          <div className="bg-black/95 border-2 border-yellow-400 px-4 py-2 rounded-lg shadow-2xl">
            <div className="text-sm text-yellow-400 font-bold">
              {getOwnedMekCount(hoveredBuff)} owned
            </div>
            <div className="text-sm text-gray-300">
              {getAvailableMekCount(hoveredBuff)} available
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}