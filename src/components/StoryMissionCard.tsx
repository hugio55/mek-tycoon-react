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
  color?: string; // Hex color for Genesis tokens
  rarity?: string; // Rarity tier for Genesis tokens
  image?: string; // Image path for Genesis tokens
}

interface StoryMissionCardProps {
  flashingMekSlots?: boolean;
  isEventNode?: boolean; // Whether this is an event node (Genesis buffs) or mek node (Variation buffs)
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

  // Variation buff layout style
  variationBuffLayoutStyle?: 1 | 2 | 3 | 4 | 5;

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

  // Event node specific
  isEventNode?: boolean;
  successPercentage?: number;
  eventNodeId?: number;
  eventImages?: {
    easy: string;
    medium: string;
    hard: string;
  };

  // NFT supply tracking
  remainingNfts?: number;
  totalNfts?: number;

  // Event node completion and ownership
  isEventCompleted?: boolean; // Whether the event node has been completed
  hasNftPurchased?: boolean; // Whether the user has purchased the NFT

  // Active mission tracking
  activeMissionEndTime?: number; // End time of active mission (if deployed)
  activeMissionDifficulty?: 'easy' | 'medium' | 'hard'; // Difficulty of active mission
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
    { id: "genesis-blue", name: "Blue Genesis", bonus: "+5%", color: "#3B82F6", rarity: "common" },
    { id: "genesis-green", name: "Green Genesis", bonus: "+10%", color: "#10B981", rarity: "uncommon" },
    { id: "genesis-yellow", name: "Yellow Genesis", bonus: "+15%", color: "#FBBF24", rarity: "rare" },
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
  variationBuffLayoutStyle = 1,
  flashingMekSlots = false,
  isEventNode = false,
  successPercentage = 0,
  eventNodeId,
  eventImages,
  remainingNfts = 100,
  totalNfts = 100,
  isEventCompleted = false,
  hasNftPurchased = false,
  activeMissionEndTime,
  activeMissionDifficulty
}: StoryMissionCardProps) {
  const [hoveredBuff, setHoveredBuff] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showLightbox, setShowLightbox] = useState(false);
  const [isHoveringDeployButton, setIsHoveringDeployButton] = useState(false);
  const [showDeployTooltip, setShowDeployTooltip] = useState(false);
  const [selectedChip, setSelectedChip] = useState<{ tier: number; modifier: string } | null>(null);
  const [clickedChip, setClickedChip] = useState<{ tier: number; modifier: string } | null>(null);

  // Determine which image to display - use event images if this is an event node
  const displayImage = React.useMemo(() => {
    if (isEventNode && eventImages) {
      // Use the image corresponding to the current difficulty
      return eventImages[currentDifficulty];
    }
    // Otherwise use the regular mek image
    return mekImage;
  }, [isEventNode, eventImages, currentDifficulty, mekImage]);

  // NFT price calculation helper
  const calculateNftPrice = (basePrice: number, overshootPercentage: number): number => {
    const cappedOvershoot = Math.min(overshootPercentage, 100);
    const discountMultiplier = 1 - (cappedOvershoot * 0.005); // 0.5% discount per 1% overshoot
    return Math.round(basePrice * discountMultiplier);
  };

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
    // Generate a deterministic percentage based on the variation name
    const seed = variationName.charCodeAt(0) + variationName.charCodeAt(variationName.length - 1);
    const availablePercent = 0.3 + ((seed % 40) / 100); // 30-70% range
    return Math.max(1, Math.floor(owned * availablePercent));
  };

  // If empty, show skeleton
  if (isEmpty) {
    return (
      <div
        className="relative w-full max-w-[328px] mx-auto"
        style={{ transform: `scale(${scale})`, transformOrigin: 'top center', ...style }}
      >
        <div className="mek-card-industrial mek-border-sharp-gold overflow-hidden">
          {/* Mek Image Section - Empty State */}
          <div className="relative">
            <div className="relative w-full aspect-square bg-black/40">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-gray-700 text-6xl font-bold opacity-30">?</div>
              </div>
            </div>

            {/* Title Card - Empty State (matching variation 1) */}
            <div className="relative h-14 overflow-hidden border-t-2 border-b-2 border-gray-700/30">
              <div className="absolute inset-0 bg-gradient-to-r from-black via-zinc-900 to-black" />
              <div className="relative h-full flex items-center justify-between px-4">
                <h2 className="text-xl font-black tracking-wider uppercase">
                  <span className="text-gray-600">--- ----</span>
                </h2>
                <div className="text-sm text-gray-700">
                  Rank <span className="text-gray-600 font-bold text-lg">----</span>
                </div>
              </div>
            </div>
          </div>

          {/* Difficulty Selector - Empty State */}
          <div className="bg-black/80 border-b border-gray-700/30 px-2 py-2">
            <div className="flex gap-1.5 justify-center">
              {['EASY', 'MEDIUM', 'HARD'].map((diff) => (
                <button
                  key={diff}
                  disabled
                  className="px-3 py-1 bg-gray-900/40 border border-gray-800/30 rounded text-[10px] font-bold text-gray-700 cursor-not-allowed opacity-50"
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Gold and XP Bar - Empty State */}
          <div className="relative bg-black/90 border-y border-gray-700/30 overflow-hidden">
            <div className="relative grid grid-cols-2 h-12">
              <div className="flex items-center justify-center">
                <div className="flex items-end gap-0.5">
                  <span className="text-[22px] font-semibold text-gray-600 leading-none">---</span>
                  <span className="text-[11px] text-gray-600 font-bold mb-[1px]">GOLD</span>
                </div>
              </div>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-6 bg-gray-700/30" />
              <div className="flex items-center justify-center">
                <div className="flex items-end gap-0.5">
                  <span className="text-[22px] font-semibold text-gray-600 leading-none">+---</span>
                  <span className="text-[14px] text-gray-600/80 font-bold mb-[1px]">XP</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 relative">
            {/* Potential Rewards - Empty State */}
            <div className="bg-black/60 rounded-lg p-3 mb-4 border border-gray-700/30">
              <div className="mek-label-uppercase mb-2 text-[10px] text-gray-600">Potential Rewards</div>
              <div className="space-y-1">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-800/30 rounded" />
                      <span className="text-[10.5px] text-gray-700">----------</span>
                    </div>
                    <span className="text-[10.5px] font-bold text-gray-700">--%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Variation Buffs Card - Empty State (Layout 2: Classic Grid) */}
            <div className="bg-black/60 rounded-lg p-3 mb-4 border border-gray-700/30">
              <div className="text-xs text-gray-600 uppercase tracking-wider text-center mb-3">Variation Buffs</div>
              <div className="flex items-center justify-center gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex flex-col items-center flex-1 max-w-[100px]">
                    <div className="relative w-[80px] h-[80px] bg-gray-800/30 border border-gray-700/30 rounded-md flex items-center justify-center" />
                    <span className="text-[13px] text-gray-700 uppercase mt-2 font-medium">----</span>
                    <span className="text-[14px] text-gray-600 font-bold">+--</span>
                  </div>
                ))}
              </div>
              <div className="text-sm text-gray-600 text-center mt-3">Match traits for success bonuses</div>
            </div>

            {/* Mek Deployment Slots Card - Empty State */}
            <div className="bg-black/60 rounded-lg p-3 mb-4 border border-gray-700/30">
              <div className="text-xs text-gray-600 uppercase tracking-wider text-center mb-2">Mek Deployment Slots</div>
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((slot) => (
                  <div
                    key={slot}
                    className="aspect-square p-1 mek-slot-empty opacity-30 flex items-center justify-center"
                  >
                    <div className="text-center">
                      <div className="text-2xl text-gray-700">+</div>
                      <div className="text-[10px] uppercase text-gray-700">Empty</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
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
  
  // Determine styling based on completion state
  const getCompletionBorder = () => {
    if (!isEventNode) return "mek-border-sharp-gold"; // Default for non-event nodes
    if (hasNftPurchased) return "border-2 border-amber-400/80"; // Gold for NFT owned
    if (isEventCompleted) return "border-2 border-green-500/80"; // Green for completed
    return "mek-border-sharp-gold"; // Yellow for incomplete
  };

  const getCompletionOverlay = () => {
    if (!isEventNode) return null;

    // Only show badge if NFT has been purchased
    // Don't show checkmark when mintable (completed but not purchased) - "MINT AVAILABLE" shows on node instead
    if (hasNftPurchased) {
      return (
        <div className="absolute top-2 right-2 z-50 bg-green-500/90 px-3 py-1 rounded border border-green-300 shadow-lg flex items-center gap-1.5">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
          </svg>
          <span className="text-xs font-bold text-white uppercase tracking-wider">NFT OWNED</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="relative w-full max-w-[328px] mx-auto"
      style={{ transform: `scale(${scale})`, transformOrigin: 'top center', ...style }}
    >
      {getCompletionOverlay()}
      <div className={`mek-card-industrial ${getCompletionBorder()} overflow-hidden`}>

        {/* Mek Image Section with Hazard Stripe Header */}
        <div className="relative">
          {/* Mek Image - Full width, with padding to prevent overlap */}
          <div
            className="relative w-full aspect-square bg-black cursor-pointer group"
            onClick={() => setShowLightbox(true)}
          >
            {/* Inner container with padding to prevent border overlap */}
            <div className="absolute inset-0 p-1 overflow-hidden">
              {displayImage && (
                <>
                  <Image
                    src={displayImage}
                    alt={mekName}
                    fill
                    className="object-contain transition-all duration-300 group-hover:scale-105 group-hover:brightness-110"
                    style={{ imageRendering: 'crisp-edges' }}
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                    <div className="bg-black/80 px-2 py-1 rounded border border-yellow-500/50">
                      <span className="text-xs text-yellow-400">Click to enlarge</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Title Card Variations */}
          {(() => {
            // VARIATION SELECTOR - Change this value (1-5) to switch between designs
            const titleCardVariation = 1; // Change this to 1, 2, 3, 4, or 5

            // Define the 5 spectacular variations
            const variations = {
              // VARIATION 1: HAZARD WARNING INDUSTRIAL
              1: () => {
                // Get variant name for event nodes
                const nftVariantNames: Record<string, Record<'easy' | 'medium' | 'hard', string>> = {
                  'Rust Protocol': {
                    easy: 'Charm',
                    medium: 'Goose Neck',
                    hard: "Gov't"
                  },
                };
                const variantName = nftVariantNames[title]?.[currentDifficulty];

                return (
                  <div className="relative h-20 overflow-hidden border-t-2 border-b-2 border-yellow-500">
                    {/* Background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-zinc-900 to-black" />

                    {/* Large-scale hazard stripes background */}
                    <div
                      className="absolute inset-0 opacity-20"
                      style={{
                        backgroundImage: `repeating-linear-gradient(
                          45deg,
                          #fab617,
                          #fab617 20px,
                          transparent 20px,
                          transparent 40px
                        )`,
                      }}
                    />

                    {/* Grid texture overlay - made more visible */}
                    <div
                      className="absolute inset-0 opacity-30"
                      style={{
                        backgroundImage: `
                          repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(250, 182, 23, 0.3) 3px, rgba(250, 182, 23, 0.3) 4px),
                          repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(250, 182, 23, 0.3) 3px, rgba(250, 182, 23, 0.3) 4px)
                        `,
                        backgroundSize: '4px 4px',
                      }}
                    />

                    {/* Warning tape borders */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />

                    {/* Content */}
                    <div className="relative h-full flex items-center justify-between px-4">
                      {isEventNode && variantName ? (
                        // Event nodes: show title on line 1, variant name (larger) on line 2
                        <div className="flex flex-col justify-center">
                          <div className="text-sm font-bold tracking-wide uppercase text-white/60" style={{ textShadow: '0 0 6px rgba(255, 255, 255, 0.3)' }}>
                            {title}:
                          </div>
                          <div className="text-2xl font-black tracking-wider uppercase text-white leading-tight" style={{ textShadow: '0 0 12px rgba(255, 255, 255, 0.6)' }}>
                            {variantName}
                          </div>
                        </div>
                      ) : (
                        <h2 className="text-xl font-black tracking-wider uppercase">
                          {mekName && (
                            <>
                              {isEventNode ? (
                                // Event nodes fallback: show name without MEK prefix in white
                                <span className="text-white" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}>{mekName}</span>
                              ) : (
                                // Regular nodes: show MEK # format
                                <>
                                  <span className="text-yellow-500" style={{ textShadow: '0 0 10px rgba(250, 182, 23, 0.5)' }}>MEK </span>
                                  <span className="text-white" style={{ textShadow: '0 0 20px rgba(250, 182, 23, 0.8)' }}>#{mekName.replace(/^MEK\s*#?/i, '')}</span>
                                </>
                              )}
                            </>
                          )}
                        </h2>
                      )}
                      {mekRank !== undefined && mekRank !== null && (
                        <div className="text-sm text-gray-300">
                          Rank <span className="text-yellow-400 font-bold text-lg" style={{ textShadow: '0 0 15px rgba(250, 182, 23, 0.6)' }}>{mekRank}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              },

              // VARIATION 2: CARBON FIBER TACTICAL
              2: () => (
                <div className="relative h-14 overflow-hidden border-y-4 border-yellow-600" style={{ borderStyle: 'double' }}>
                  {/* Black base */}
                  <div className="absolute inset-0 bg-black" />

                  {/* Carbon fiber pattern */}
                  <div
                    className="absolute inset-0 opacity-40"
                    style={{
                      backgroundImage: `
                        repeating-linear-gradient(45deg, transparent, transparent 2px, #fab617 2px, #fab617 3px),
                        repeating-linear-gradient(-45deg, transparent, transparent 2px, #000 2px, #000 3px)
                      `,
                      backgroundSize: '8px 8px',
                    }}
                  />

                  {/* Hex grid overlay */}
                  <div
                    className="absolute inset-0 opacity-25"
                    style={{
                      backgroundImage: `radial-gradient(circle, transparent 65%, rgba(250, 182, 23, 0.4) 65%)`,
                      backgroundSize: '15px 15px',
                      backgroundPosition: '0 0, 7.5px 7.5px',
                    }}
                  />

                  {/* Yellow accent bars */}
                  <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-80" />
                  <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-80" />
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-600 via-transparent to-yellow-600 opacity-50" />
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-600 via-transparent to-yellow-600 opacity-50" />

                  {/* Content */}
                  <div className="relative h-full flex items-center justify-between px-4">
                    <h2 className="text-xl font-black tracking-wider uppercase">
                      {mekName && (
                        <>
                          {isEventNode ? (
                            <span className="text-white">{mekName}</span>
                          ) : (
                            <>
                              <span className="text-black bg-yellow-500 px-1" style={{ clipPath: 'polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)' }}>MEK</span>
                              <span className="text-yellow-500 ml-2">#{mekName.replace(/^MEK\s*#?/i, '')}</span>
                            </>
                          )}
                        </>
                      )}
                    </h2>
                    {mekRank !== undefined && mekRank !== null && (
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-yellow-600 uppercase">Rank</div>
                        <div className="text-xl font-black text-black bg-yellow-500 px-2 py-0.5" style={{ clipPath: 'polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)' }}>
                          {mekRank}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ),

              // VARIATION 3: HOLOGRAPHIC CIRCUIT
              3: () => (
                <div className="relative h-14 overflow-hidden">
                  {/* Gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black via-yellow-950/50 to-black" />

                  {/* Circuit board pattern */}
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      backgroundImage: `
                        linear-gradient(90deg, rgba(250, 182, 23, 0.3) 1px, transparent 1px),
                        linear-gradient(180deg, rgba(250, 182, 23, 0.3) 1px, transparent 1px),
                        radial-gradient(circle at 10px 10px, #fab617 1px, transparent 1px),
                        radial-gradient(circle at 30px 30px, #fab617 1px, transparent 1px)
                      `,
                      backgroundSize: '20px 20px, 20px 20px, 40px 40px, 40px 40px',
                      backgroundPosition: '0 0, 0 0, 0 0, 20px 20px',
                    }}
                  />

                  {/* Holographic shimmer effect */}
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      background: `linear-gradient(105deg,
                        transparent 40%,
                        rgba(250, 182, 23, 0.6) 45%,
                        rgba(255, 255, 255, 0.3) 50%,
                        rgba(250, 182, 23, 0.6) 55%,
                        transparent 60%)`,
                      animation: 'shimmer 3s infinite',
                    }}
                  />

                  {/* Scan line effect */}
                  <div
                    className="absolute inset-0 opacity-15"
                    style={{
                      backgroundImage: 'linear-gradient(0deg, transparent 50%, rgba(250, 182, 23, 0.5) 50%)',
                      backgroundSize: '100% 4px',
                      animation: 'scan 8s linear infinite',
                    }}
                  />

                  {/* Border glow */}
                  <div className="absolute inset-0 border-2 border-yellow-500" style={{ boxShadow: 'inset 0 0 20px rgba(250, 182, 23, 0.3), 0 0 20px rgba(250, 182, 23, 0.3)' }} />

                  {/* Content */}
                  <div className="relative h-full flex items-center justify-between px-4">
                    <h2 className="text-xl font-black tracking-wider uppercase">
                      {mekName && (
                        <>
                          {isEventNode ? (
                            <span className="text-white" style={{
                              textShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
                            }}>{mekName}</span>
                          ) : (
                            <>
                              <span className="text-yellow-400" style={{
                                textShadow: '0 0 20px rgba(250, 182, 23, 1), 0 0 40px rgba(250, 182, 23, 0.5)',
                                filter: 'brightness(1.2)'
                              }}>MEK </span>
                              <span className="text-white" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}>#{mekName.replace(/^MEK\s*#?/i, '')}</span>
                            </>
                          )}
                        </>
                      )}
                    </h2>
                    {mekRank !== undefined && mekRank !== null && (
                      <div className="text-sm text-gray-300">
                        Rank <span className="text-yellow-400 font-bold text-lg" style={{
                          textShadow: '0 0 20px rgba(250, 182, 23, 1)',
                          filter: 'brightness(1.2)'
                        }}>{mekRank}</span>
                      </div>
                    )}
                  </div>
                </div>
              ),

              // VARIATION 4: MILITARY STENCIL
              4: () => (
                <div className="relative h-14 overflow-hidden border-t-4 border-b-4 border-yellow-500" style={{ borderImage: 'repeating-linear-gradient(90deg, #fab617 0px, #fab617 10px, black 10px, black 20px) 4' }}>
                  {/* Dark military green-black background */}
                  <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-black" />

                  {/* Diamond plate texture */}
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: `
                        repeating-linear-gradient(60deg, transparent, transparent 10px, rgba(250, 182, 23, 0.3) 10px, rgba(250, 182, 23, 0.3) 12px),
                        repeating-linear-gradient(-60deg, transparent, transparent 10px, rgba(250, 182, 23, 0.3) 10px, rgba(250, 182, 23, 0.3) 12px)
                      `,
                      backgroundSize: '20px 20px',
                    }}
                  />

                  {/* Stencil dots pattern */}
                  <div
                    className="absolute inset-0 opacity-15"
                    style={{
                      backgroundImage: 'radial-gradient(circle, #fab617 20%, transparent 20%)',
                      backgroundSize: '8px 8px',
                      backgroundPosition: '0 0, 4px 4px',
                    }}
                  />

                  {/* Warning stripes on sides */}
                  <div className="absolute left-0 top-0 bottom-0 w-8" style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, #fab617 0, #fab617 4px, transparent 4px, transparent 8px)',
                    opacity: 0.3
                  }} />
                  <div className="absolute right-0 top-0 bottom-0 w-8" style={{
                    backgroundImage: 'repeating-linear-gradient(-45deg, #fab617 0, #fab617 4px, transparent 4px, transparent 8px)',
                    opacity: 0.3
                  }} />

                  {/* Content */}
                  <div className="relative h-full flex items-center justify-between px-12">
                    <h2 className="text-xl font-black tracking-wider uppercase">
                      {mekName && (
                        <>
                          {isEventNode ? (
                            <span className="text-white" style={{
                              fontFamily: 'monospace',
                              letterSpacing: '0.2em',
                              textShadow: '2px 2px 0 black, -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black'
                            }}>{mekName}</span>
                          ) : (
                            <>
                              <span className="text-yellow-500" style={{
                                fontFamily: 'monospace',
                                letterSpacing: '0.2em',
                                textShadow: '2px 2px 0 black, -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black'
                              }}>MEK</span>
                              <span className="text-white ml-2" style={{
                                fontFamily: 'monospace',
                                letterSpacing: '0.1em'
                              }}>#{mekName.replace(/^MEK\s*#?/i, '')}</span>
                            </>
                          )}
                        </>
                      )}
                    </h2>
                    {mekRank !== undefined && mekRank !== null && (
                      <div className="flex items-center">
                        <div className="bg-yellow-500 text-black px-3 py-1" style={{
                          fontFamily: 'monospace',
                          fontWeight: 900,
                          clipPath: 'polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)',
                        }}>
                          RANK {mekRank}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ),

              // VARIATION 5: CINEMATIC SCI-FI
              5: () => (
                <div className="relative h-16 overflow-hidden">
                  {/* Deep space black with subtle blue undertones */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black via-gray-950 to-black" />

                  {/* Animated energy field background */}
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      background: `
                        radial-gradient(ellipse at top, rgba(250, 182, 23, 0.3) 0%, transparent 50%),
                        radial-gradient(ellipse at bottom, rgba(250, 182, 23, 0.3) 0%, transparent 50%)
                      `,
                    }}
                  />

                  {/* Hexagonal grid pattern - larger and more visible */}
                  <div
                    className="absolute inset-0 opacity-25"
                    style={{
                      backgroundImage: `
                        linear-gradient(30deg, transparent 0%, transparent 29%, rgba(250, 182, 23, 0.5) 30%, transparent 31%, transparent 100%),
                        linear-gradient(150deg, transparent 0%, transparent 29%, rgba(250, 182, 23, 0.5) 30%, transparent 31%, transparent 100%),
                        linear-gradient(270deg, transparent 0%, transparent 29%, rgba(250, 182, 23, 0.5) 30%, transparent 31%, transparent 100%)
                      `,
                      backgroundSize: '25px 43.3px',
                    }}
                  />

                  {/* Holographic scan lines */}
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(250, 182, 23, 0.8) 2px, rgba(250, 182, 23, 0.8) 3px)',
                      animation: 'scan 10s linear infinite',
                    }}
                  />

                  {/* Top and bottom energy bars */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent" style={{ boxShadow: '0 0 20px rgba(250, 182, 23, 0.8)' }} />
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent" style={{ boxShadow: '0 0 20px rgba(250, 182, 23, 0.8)' }} />

                  {/* Corner accents */}
                  <div className="absolute top-0 left-0 w-20 h-8" style={{
                    background: 'linear-gradient(135deg, rgba(250, 182, 23, 0.5) 0%, transparent 50%)',
                    clipPath: 'polygon(0 0, 100% 0, 0 100%)',
                  }} />
                  <div className="absolute top-0 right-0 w-20 h-8" style={{
                    background: 'linear-gradient(225deg, rgba(250, 182, 23, 0.5) 0%, transparent 50%)',
                    clipPath: 'polygon(0 0, 100% 0, 100% 100%)',
                  }} />
                  <div className="absolute bottom-0 left-0 w-20 h-8" style={{
                    background: 'linear-gradient(45deg, rgba(250, 182, 23, 0.5) 0%, transparent 50%)',
                    clipPath: 'polygon(0 0, 0 100%, 100% 100%)',
                  }} />
                  <div className="absolute bottom-0 right-0 w-20 h-8" style={{
                    background: 'linear-gradient(315deg, rgba(250, 182, 23, 0.5) 0%, transparent 50%)',
                    clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
                  }} />

                  {/* Content with futuristic styling */}
                  <div className="relative h-full flex items-center justify-between px-6">
                    <h2 className="text-2xl font-black tracking-wider uppercase">
                      {mekName && (
                        <>
                          {isEventNode ? (
                            <span className="text-white" style={{
                              fontFamily: 'Orbitron, monospace',
                              textShadow: '0 0 30px rgba(255, 255, 255, 0.5)',
                            }}>{mekName}</span>
                          ) : (
                            <>
                              <span className="relative">
                                <span className="text-transparent bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text" style={{
                                  filter: 'drop-shadow(0 0 20px rgba(250, 182, 23, 0.8))',
                                  fontFamily: 'Orbitron, monospace',
                                }}>MEK</span>
                              </span>
                              <span className="text-white ml-3" style={{
                                fontFamily: 'Orbitron, monospace',
                                textShadow: '0 0 30px rgba(250, 182, 23, 0.5)',
                              }}>#{mekName.replace(/^MEK\s*#?/i, '')}</span>
                            </>
                          )}
                        </>
                      )}
                    </h2>
                    {mekRank !== undefined && mekRank !== null && (
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-yellow-600 blur-xl opacity-50" />
                        <div className="relative bg-black/80 border-2 border-yellow-500 px-4 py-1" style={{
                          clipPath: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)',
                          boxShadow: 'inset 0 0 20px rgba(250, 182, 23, 0.3)',
                        }}>
                          <span className="text-xs text-yellow-400 uppercase">Rank</span>
                          <span className="text-xl font-black text-yellow-400 ml-2">{mekRank}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ),
            };

            // Render the selected variation
            return variations[titleCardVariation]();
          })()}

          <style jsx>{`
            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(200%); }
            }
            @keyframes scan {
              0% { transform: translateY(-100px); }
              100% { transform: translateY(0); }
            }
          `}</style>
        </div>

        {/* Difficulty Selector with Multiple Style Options */}
        {showDifficultySelector && (
          <div className="bg-black/80 border-b border-yellow-500/30 px-2 py-2 relative">
            <div className="flex gap-1.5 justify-center">
              {(['easy', 'medium', 'hard'] as const).map(difficulty => {
                const isSelected = currentDifficulty === difficulty;
                const isCompleted = completedDifficulties.has(difficulty);
                // Pass active mission end time only if this difficulty is deployed
                const activeEndTime = activeMissionDifficulty === difficulty ? activeMissionEndTime : undefined;
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
                  lockedStyle,
                  activeEndTime
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
          {/* Industrial Yellow style - locked in */}
          <div className="bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent py-0.5">
            <div className="text-[10px] text-yellow-500/70 uppercase tracking-wider text-center font-bold">Base Rewards</div>
          </div>

          {/* Content */}
          <div className="relative grid grid-cols-2 h-12">
            {/* Gold Section - Centered as a unit in left column */}
            <div className="flex items-center justify-center">
              <div className="flex items-end gap-0.5">
                <span className="text-[22px] font-semibold text-yellow-400 leading-none" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
                  {formatGoldAmount(primaryReward)}
                </span>
                <span className="text-[11px] text-yellow-400 font-bold" style={{ fontFamily: 'Segoe UI, sans-serif' }}>GOLD</span>
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
                <span className="text-[14px] text-blue-400/80 font-bold" style={{ fontFamily: 'Segoe UI, sans-serif' }}>XP</span>
              </div>
            </div>
          </div>
        </div>


        <div className="p-3 relative">

          {/* Conditional: NFT Purchase (for events) or Potential Rewards (for regular nodes) */}
          {isEventNode ? (
            // NFT Purchase UI for Event Nodes
            <>
              {(() => {
                // NFT pricing based on difficulty (placeholder - should come from Admin Master Data)
                const nftBasePrices = { easy: 100, medium: 200, hard: 300 };
                const baseNftPrice = nftBasePrices[currentDifficulty];

                // Calculate discount based on overshoot
                const greenLine = difficultyConfig?.successGreenLine || 50;
                const overshootPercentage = Math.max(0, successPercentage - greenLine);
                const discountedNftPrice = calculateNftPrice(baseNftPrice, overshootPercentage);
                const discountPercentage = Math.round(((baseNftPrice - discountedNftPrice) / baseNftPrice) * 100);

                // NFT name format: "Event Name: Specific Name"
                // TODO: These names should come from Admin Master Data / database
                // For now, using placeholder logic for Rust Protocol
                const nftVariantNames: Record<string, Record<'easy' | 'medium' | 'hard', string>> = {
                  'Rust Protocol': {
                    easy: 'Charm',
                    medium: 'Goose Neck',
                    hard: "Gov't"
                  },
                  // Add more events here as they're defined
                };

                // Get the variant name, or fall back to difficulty label if not found
                const variantName = nftVariantNames[title]?.[currentDifficulty] ||
                                   (currentDifficulty.charAt(0).toUpperCase() + currentDifficulty.slice(1));
                const nftName = `${title}: ${variantName}`;

                // V2-3 (Card Header) variation
                const variation2 = () => (
                  <div className="relative bg-black/80 rounded-2xl p-5 mb-4 border border-teal-400/40 overflow-hidden" style={{
                    boxShadow: '0 10px 40px rgba(250, 182, 23, 0.3), 0 0 60px rgba(34, 211, 238, 0.2)'
                  }}>
                    {/* Teal holographic grid pattern background */}
                    <div
                      className="absolute inset-0 opacity-15"
                      style={{
                        backgroundImage: `
                          linear-gradient(90deg, rgba(20, 184, 166, 0.4) 1px, transparent 1px),
                          linear-gradient(180deg, rgba(20, 184, 166, 0.4) 1px, transparent 1px)
                        `,
                        backgroundSize: '25px 25px',
                        animation: 'scan 12s linear infinite'
                      }}
                    />

                    {/* Yellow glow underneath effect */}
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-12 bg-yellow-400/40 rounded-full blur-3xl" />
                    <div className="absolute top-0 right-0 w-24 h-24 bg-teal-400/20 rounded-full blur-3xl" />

                    {/* Animated shimmer effect */}
                    <div
                      className="absolute inset-0 opacity-30 pointer-events-none"
                      style={{
                        background: 'linear-gradient(110deg, transparent 40%, rgba(250, 182, 23, 0.3) 50%, transparent 60%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 4s infinite'
                      }}
                    />

                    <div className="relative">
                      {/* Header with NFT/UNLOCK on left, Remaining on right */}
                      <div className="mb-4 relative">
                        <div className="flex items-center justify-between gap-4 mb-3">
                          <div>
                            <div className="text-5xl font-black text-yellow-400 uppercase tracking-tighter leading-none" style={{
                              textShadow: '0 0 40px rgba(250, 182, 23, 1), 0 0 80px rgba(250, 182, 23, 0.5)'
                            }}>
                              NFT
                            </div>
                            <div className="text-lg font-bold text-teal-400 uppercase tracking-wider" style={{
                              textShadow: '0 0 20px rgba(34, 211, 238, 0.8)'
                            }}>
                              UNLOCK
                            </div>
                          </div>
                          <div className="border-2 border-teal-500/50 rounded-lg px-3 py-2 bg-teal-950/20">
                            <div className="text-[10px] text-teal-400 uppercase tracking-wider mb-0.5">Remaining</div>
                            <div className="flex items-baseline leading-none">
                              <span className="text-3xl font-black text-white">{remainingNfts}</span>
                              <span className="text-sm text-gray-600">/</span>
                              <span className="text-lg font-bold text-teal-400">{totalNfts}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex-1 h-[2px] bg-gradient-to-r from-teal-400 via-teal-400/50 to-transparent" />
                          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{
                            boxShadow: '0 0 10px rgba(250, 182, 23, 1)'
                          }} />
                        </div>

                        <div className="text-base font-bold text-teal-300 uppercase leading-tight tracking-tight" style={{
                          textShadow: '0 0 15px rgba(34, 211, 238, 0.6)',
                          letterSpacing: '-0.03em'
                        }}>
                          {nftName}
                        </div>
                      </div>

                      {/* Description */}
                      <div className="bg-gradient-to-r from-teal-950/40 to-black/40 backdrop-blur-sm border border-teal-400/20 rounded-xl p-3 mb-4">
                        <div className="text-sm text-gray-300 leading-relaxed">
                          Completing this contract unlocks the ability to mint this NFT. This purchase is{' '}
                          <span className="text-yellow-400 font-bold" style={{
                            textShadow: '0 0 20px rgba(250, 182, 23, 1)',
                            animation: 'pulse 2s ease-in-out infinite'
                          }}>
                            completely optional
                          </span>.
                        </div>
                      </div>

                      {/* Card Header Style - Remaining Count and Price */}
                      <div className="relative bg-gradient-to-br from-black/60 to-teal-950/30 backdrop-blur-md rounded-xl overflow-hidden mb-4 border border-teal-400/30" style={{
                        boxShadow: 'inset 0 1px 0 rgba(34, 211, 238, 0.2)'
                      }}>
                        {/* Simple Header - "NFT Purchasing" */}
                        <div className="bg-gradient-to-r from-teal-500/10 to-black/40 border-b border-teal-400/30 px-3 py-2 text-center">
                          <span className="text-xs text-teal-400 uppercase tracking-wider font-bold">NFT Purchasing</span>
                        </div>

                        {/* Body Content */}
                        <div className={`p-4 ${discountPercentage > 0 ? 'space-y-3' : 'flex items-center justify-center min-h-[120px]'}`}>
                          {/* INTEGRATED HEADER BAR */}
                          <>
                            {/* Discount as subtle bar above price */}
                            {discountPercentage > 0 && (
                              <div className="flex items-center justify-between px-2 pb-2 border-b border-yellow-400/20">
                                <span className="text-xs text-cyan-400 uppercase tracking-wider font-semibold" style={{
                                  animation: 'flash 0.5s infinite',
                                  textShadow: '0 0 20px rgba(34, 211, 238, 1), 0 0 40px rgba(34, 211, 238, 0.8)'
                                }}>Overshoot Bonus</span>
                                <span className="text-lg text-green-400 font-black" style={{
                                  textShadow: '0 0 15px rgba(74, 222, 128, 0.8), 0 0 30px rgba(74, 222, 128, 0.5)'
                                }}>-{discountPercentage}%</span>
                              </div>
                            )}

                            {/* Stacked price display */}
                            <div className="flex flex-col items-center pt-2">
                              {discountPercentage > 0 && (
                                <div className="text-center mb-1">
                                  <span className="text-lg text-gray-400 font-bold line-through" style={{
                                    fontFamily: 'Roboto Mono, monospace'
                                  }}>{baseNftPrice} ADA</span>
                                </div>
                              )}
                              <div className="flex flex-col items-center">
                                <span className="text-5xl font-black text-yellow-400 font-mono leading-none" style={{
                                  textShadow: '0 0 25px rgba(250, 182, 23, 0.9)'
                                }}>
                                  {discountedNftPrice}
                                </span>
                                <span className="text-sm text-yellow-400/80 font-mono font-bold">ADA</span>
                              </div>
                            </div>
                          </>
                        </div>
                      </div>

                      {/* Elevated holographic button */}
                      {(() => {
                        const isMintable = isEventCompleted && !hasNftPurchased;

                        if (isMintable) {
                          // Active "Mint NFT" button with holographic effect
                          return (
                            <div className="relative">
                              <HolographicButton
                                text="MINT NFT"
                                onClick={() => {
                                  // TODO: Implement mint NFT functionality
                                  console.log('Mint NFT clicked');
                                }}
                                isActive={true}
                                variant="yellow"
                                alwaysOn={true}
                                className="w-full [&>div]:cursor-pointer"
                              />
                            </div>
                          );
                        } else {
                          // Disabled "Complete Mission to Unlock" button
                          return (
                            <button
                              disabled={true}
                              className="w-full py-4 px-6 rounded-xl font-bold uppercase tracking-wider text-sm relative overflow-hidden transition-all duration-300 bg-gray-800/50 text-gray-600 cursor-not-allowed border border-gray-700/50"
                            >
                              <span className="relative">COMPLETE MISSION TO UNLOCK</span>
                            </button>
                          );
                        }
                      })()}
                    </div>
                  </div>
                );

                // Render V2-3 (Card Header) variation
                return variation2();
              })()}
            </>
          ) : (
            // Regular Potential Rewards for Non-Event Nodes
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
          )}

          {/* Variation Buffs Card - Dynamic Layout Based on Style */}
          <div className="bg-black/60 rounded-lg p-3 mb-4 border border-gray-700">
            {variationBuffLayoutStyle === 1 && (
              // Layout 1: Horizontal with Text (Genesis Tokens)
              <>
                <div className="text-xs text-gray-500 uppercase tracking-wider text-center mb-2">
                  {isEventNode ? 'Genesis Buffs' : 'Variation Buffs'}
                </div>
                <div className="flex items-center justify-center gap-3">
                  <div className="text-[11px] text-gray-400 max-w-[90px] text-center leading-tight">
                    Hold tokens for success bonuses
                  </div>
                  <div className="w-px h-10 bg-gray-600/50" />
                  <div className="flex items-center gap-2">
                    {variationBuffs.map((buff, index) => {
                      return (
                        <div key={`${buff.id}-${index}`} className="flex flex-col items-center">
                          <div
                            className="relative w-[48px] h-[48px] rounded-full cursor-pointer transition-all hover:scale-110 overflow-hidden"
                            style={{
                              backgroundColor: buff.color || '#6B7280',
                              border: `2px solid ${buff.color || '#6B7280'}`,
                              boxShadow: `0 0 15px ${buff.color || '#6B7280'}80`
                            }}
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
                            {buff.image && (
                              <img
                                src={buff.image}
                                alt={buff.name}
                                className="w-full h-full object-cover"
                              />
                            )}
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
              // Layout 2: Classic Grid (normal nodes) OR Olympic Rings (event nodes)
              <>
                {isEventNode ? (
                  // Olympic Rings Pattern for Event Nodes (2 on top, 3 on bottom)
                  <>
                    <div className="text-center mb-2">
                      <div className="text-xs text-gray-500 uppercase tracking-wider">Genesis Buffs</div>
                      <div className="text-[11px] text-gray-400 mt-1">Attach Genesis Tokens for success bonuses</div>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                      {/* Top row - first 2 tokens */}
                      {variationBuffs.length >= 2 && (
                        <div className="flex gap-4 justify-center">
                          {variationBuffs.slice(0, 2).map((buff, index) => (
                            <div key={`${buff.id}-${index}`} className="flex flex-col items-center">
                              <div
                                className="relative w-[68px] h-[68px] rounded-full cursor-pointer transition-all hover:scale-105 overflow-hidden flex items-center justify-center bg-black/40"
                                style={{
                                  border: `3px solid ${buff.color || '#6B7280'}`,
                                  boxShadow: `0 0 20px ${buff.color || '#6B7280'}80`
                                }}
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
                                {buff.image && (
                                  <img
                                    src={buff.image}
                                    alt={buff.name}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              <span className="text-[10px] text-gray-300 font-medium mt-1 uppercase tracking-wide">{buff.name}</span>
                              <span className="text-[11px] text-yellow-400 font-bold">{buff.bonus}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Bottom row - remaining tokens (up to 3) */}
                      {variationBuffs.length > 2 && (
                        <div className="flex gap-4 justify-center">
                          {variationBuffs.slice(2, 5).map((buff, index) => (
                            <div key={`${buff.id}-${index + 2}`} className="flex flex-col items-center">
                              <div
                                className="relative w-[68px] h-[68px] rounded-full cursor-pointer transition-all hover:scale-105 overflow-hidden flex items-center justify-center bg-black/40"
                                style={{
                                  border: `3px solid ${buff.color || '#6B7280'}`,
                                  boxShadow: `0 0 20px ${buff.color || '#6B7280'}80`
                                }}
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
                                {buff.image && (
                                  <img
                                    src={buff.image}
                                    alt={buff.name}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              <span className="text-[10px] text-gray-300 font-medium mt-1 uppercase tracking-wide">{buff.name}</span>
                              <span className="text-[11px] text-yellow-400 font-bold">{buff.bonus}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  // Classic Grid for Normal Nodes (single row with image/name/percentage)
                  <>
                    <div className="text-xs text-gray-500 uppercase tracking-wider text-center mb-3">Variation Buffs</div>
                    <div className="flex items-center justify-center gap-4">
                      {variationBuffs.map((buff, index) => (
                        <div key={`${buff.id}-${index}`} className="flex flex-col items-center flex-1 max-w-[100px]">
                          <div
                            className="relative w-[80px] h-[80px] cursor-pointer transition-all hover:scale-105 flex items-center justify-center"
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
                            {buff.image && (
                              <img
                                src={buff.image}
                                alt={buff.name}
                                className="max-w-full max-h-full object-contain"
                              />
                            )}
                          </div>
                          <span className="text-[13px] text-gray-400 uppercase mt-2 font-medium">{buff.name}</span>
                          <span className="text-[14px] text-yellow-400 font-bold">{buff.bonus}</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-sm text-gray-400 text-center mt-3">Match traits for success bonuses</div>
                  </>
                )}
              </>
            )}

            {variationBuffLayoutStyle === 3 && (
              // Layout 3: Vertical Stack (text on top, Genesis tokens below)
              <>
                <div className="text-center mb-3">
                  <div className="text-xs text-gray-500 uppercase tracking-wider">
                    {isEventNode ? 'Genesis Buffs' : 'Variation Buffs'}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">Hold tokens for success bonuses</div>
                </div>
                <div className="flex justify-center gap-2">
                  {variationBuffs.map((buff, index) => {
                    return (
                      <div key={`${buff.id}-${index}`} className="flex flex-col items-center">
                        <div
                          className="relative w-[50px] h-[50px] rounded-full cursor-pointer transition-all hover:scale-110"
                          style={{
                            backgroundColor: buff.color || '#6B7280',
                            border: `2px solid ${buff.color || '#6B7280'}`,
                            boxShadow: `0 0 15px ${buff.color || '#6B7280'}80`
                          }}
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
                        />
                        <span className="text-[11px] text-yellow-400 font-bold mt-1">{buff.bonus}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {variationBuffLayoutStyle === 4 && (
              // Layout 4: Compact Pills (Genesis token badges)
              <>
                <div className="text-xs text-gray-500 uppercase tracking-wider text-center mb-2">
                  {isEventNode ? 'Genesis Buffs' : 'Variation Buffs'}
                </div>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {variationBuffs.map((buff, index) => {
                    return (
                      <div
                        key={`${buff.id}-${index}`}
                        className="flex items-center gap-1.5 bg-black/80 rounded-full px-2 py-1 cursor-pointer transition-all hover:scale-105"
                        style={{
                          border: `1px solid ${buff.color || '#6B7280'}40`
                        }}
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
                        <div
                          className="relative w-[24px] h-[24px] rounded-full"
                          style={{
                            backgroundColor: buff.color || '#6B7280',
                            boxShadow: `0 0 10px ${buff.color || '#6B7280'}60`
                          }}
                        />
                        <span className="text-[10px] text-gray-400 uppercase">{buff.name}</span>
                        <span className="text-[10px] text-yellow-400 font-bold">{buff.bonus}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="text-[9px] text-gray-400 text-center mt-2">Hold tokens for success bonuses</div>
              </>
            )}

            {variationBuffLayoutStyle === 5 && (
              // Layout 5: Side by Side (text left, Genesis tokens right)
              <div className="flex items-center justify-between gap-4">
                <div className="flex-shrink-0">
                  <div className="text-xs text-gray-500 uppercase tracking-wider">
                    {isEventNode ? 'Genesis Buffs' : 'Variation Buffs'}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1 max-w-[100px]">Hold tokens for success bonuses</div>
                </div>
                <div className="flex gap-1.5">
                  {variationBuffs.map((buff, index) => {
                    return (
                      <div key={`${buff.id}-${index}`} className="flex flex-col items-center">
                        <div
                          className="relative w-[44px] h-[44px] rounded-full cursor-pointer transition-all hover:scale-110"
                          style={{
                            backgroundColor: buff.color || '#6B7280',
                            border: `2px solid ${buff.color || '#6B7280'}`,
                            boxShadow: `0 0 15px ${buff.color || '#6B7280'}80`
                          }}
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
                        />
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
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((slot) => {
                const isAvailable = slot <= availableSlots;
                const selectedMek = selectedMeks[slot - 1];

                return (
                  <div
                    key={slot}
                    className={`aspect-square p-1 flex items-center justify-center relative overflow-hidden group ${
                      selectedMek
                        ? 'border-solid border-3 border-yellow-500/50 bg-gradient-to-br from-yellow-900/20 to-black/60 transition-all'
                        : isAvailable
                        ? `mek-slot-empty bg-black/40 cursor-pointer ${
                            flashingMekSlots || isHoveringDeployButton
                              ? 'border-yellow-400 bg-yellow-500/20 shadow-[inset_0_0_30px_rgba(250,182,23,0.4)] animate-[pulse_0.5s_ease-in-out_infinite]'
                              : 'border-yellow-500/30 hover:border-yellow-500/60 hover:bg-yellow-500/10 hover:shadow-[inset_0_0_20px_rgba(250,182,23,0.2)] transition-all'
                          }`
                        : 'border-solid border-2 border-gray-600/50 bg-gray-900/60 cursor-not-allowed opacity-50'
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
                        <div className={`text-2xl transition-colors ${isAvailable ? 'text-gray-600 group-hover:text-yellow-500/70' : 'text-gray-500'}`}>
                          {isAvailable ? '+' : '×'}
                        </div>
                        <div className={`text-[10px] uppercase transition-colors ${isAvailable ? 'text-gray-600 group-hover:text-yellow-500/50' : 'text-gray-500'}`}>
                          {isAvailable ? 'Empty' : 'Locked'}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SUCCESS METER MOVED TO MISSION STATISTICS CARD - COMMENTED FOR EASY REVERT */}
          {/* Success Meter - using new SuccessMeterV2 component */}
          {false && difficultyConfig ? (
            <div className="mb-4">
              {/* Layout Selector for Testing - Removed */}
              {false && (
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
              />
            </div>
          ) : null}

          {/* DEPLOY SECTION MOVED TO MISSION STATISTICS CARD - COMMENTED FOR EASY REVERT */}
          {/* Deploy Section */}
          {false && <div className="text-center relative">
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
          </div>}

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
      {showLightbox && displayImage && typeof window !== 'undefined' && createPortal(
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
              src={displayImage.replace(/\/mek-images\/\d+px\//, '/mek-images/1000px/').replace(/\/event-images\/[^/]+\//, '/event-images/1000px/')}
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