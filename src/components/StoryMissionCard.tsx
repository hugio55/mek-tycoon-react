'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import HolographicButton from '@/components/ui/SciFiButtons/HolographicButton';
import { TIER_COLORS, MODIFIER_COLORS } from '@/lib/chipRewardCalculator';

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

  // State
  isLocked?: boolean;
  isEmpty?: boolean;
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
  isEmpty = false
}: StoryMissionCardProps) {
  const [hoveredBuff, setHoveredBuff] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showLightbox, setShowLightbox] = useState(false);
  const [isHoveringDeployButton, setIsHoveringDeployButton] = useState(false);
  const [showDeployTooltip, setShowDeployTooltip] = useState(false);

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
      className="relative w-full max-w-md mx-auto"
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
                  className="object-cover transition-all duration-300 group-hover:scale-105 group-hover:brightness-110"
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
              <h2 className="text-lg font-black tracking-wider text-yellow-400 uppercase">
                {mekName}
              </h2>
              {mekRank !== undefined && mekRank !== null && (
                <div className="text-sm text-gray-300">
                  Rank <span className="text-yellow-400 font-bold text-lg">{mekRank}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Gold and XP Bar - Compact side-by-side */}
        <div className="relative bg-black/90 border-y border-yellow-500/30 overflow-hidden">
          {/* Content */}
          <div className="relative grid grid-cols-2 h-12">
            {/* Gold Section - Centered as a unit in left column */}
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-1">
                <span className="text-[22px] font-semibold text-yellow-400" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
                  {formatGoldAmount(primaryReward)}
                </span>
                <span className="text-[11px] text-yellow-400/80" style={{ fontFamily: 'Segoe UI, sans-serif' }}>G</span>
              </div>
            </div>

            {/* Divider - Positioned at exact center */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-6 bg-gray-600/50" />

            {/* XP Section - Centered as a unit in right column */}
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-1">
                <span className="text-[22px] font-semibold text-blue-400" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
                  +{formatGoldAmount(experience)}
                </span>
                <span className="text-[11px] text-blue-400/80" style={{ fontFamily: 'Segoe UI, sans-serif' }}>XP</span>
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
                  const modifier = chipMatch[2].toLowerCase();

                  // Get color from TIER_COLORS array (0-indexed)
                  if (tier >= 1 && tier <= 10) {
                    chipColor = TIER_COLORS[tier - 1];
                  }

                  // Build chip icon path
                  const chipFileName = `${tier}${modifier}.webp`;
                  chipIcon = `/chip-images/uni-chips/uni chips 75px webp/${chipFileName}`;
                }

                return (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isChipReward && chipIcon ? (
                        <div className="w-5 h-5 relative">
                          <Image
                            src={chipIcon}
                            alt={reward.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-4 h-4 bg-yellow-500/20 rounded" />
                      )}
                      <span className="text-xs" style={{ color: isChipReward ? chipColor : getRarityTier(reward.chance).color }}>
                        {reward.name}
                      </span>
                      {reward.quantity && (
                        <span className="text-[10px] text-gray-500">x{reward.quantity}</span>
                      )}
                    </div>
                    <span className="text-xs font-bold" style={{ color: isChipReward ? chipColor : getRarityTier(reward.chance).color }}>
                      {reward.chance}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Variation Buffs */}
          <div className="mb-4">
            <div className="mb-3">
              <div className="text-xs text-gray-500 uppercase tracking-wider">Variation Buffs</div>
              <div className="text-xs text-gray-400 mt-1">
                Match traits for success bonuses
              </div>
            </div>

            {/* Grid Layout for Variation Buffs - Dynamic sizing based on count */}
            <div className="flex justify-center">
              <div className={`grid ${variationBuffs.length <= 4 ? 'grid-cols-4' : 'grid-cols-4'} gap-3 max-w-[350px]`}>
                {variationBuffs.map((buff, index) => {
                  // Map buff names to image paths
                  const buffImageMap: Record<string, string> = {
                    'TASER': '/variation-images/taser.png',
                    'LOG': '/variation-images/log.png',
                    'KEVLAR': '/variation-images/kevlar.png',
                    'NUKE': '/variation-images/nuke.png',
                    'EXPOSED': '/variation-images/exposed.png',
                    'JADE': '/variation-images/jade.png',
                    'SHAMROCK': '/variation-images/shamrock.png',
                    'CLASSIC': '/variation-images/classic.png',
                    'LIGHTNING': '/variation-images/lightning.png',
                    'CORRODED': '/variation-images/corroded.png',
                  };

                  const imagePath = buffImageMap[buff.name] || '/variation-images/default.png';

                  return (
                    <div key={`${buff.id}-${index}`} className="flex flex-col items-center">
                      {/* Circle with variation image - increased by ~4% */}
                      <div
                        className="relative w-[58px] h-[58px] rounded-full bg-black/80 border border-gray-700/50 overflow-hidden cursor-pointer transition-all hover:scale-105 hover:border-yellow-400/50"
                        onMouseEnter={(e) => {
                          setHoveredBuff(buff.name);
                          const rect = e.currentTarget.getBoundingClientRect();
                          setMousePos({ x: rect.left + rect.width / 2, y: rect.top });
                        }}
                        onMouseLeave={() => {
                          setHoveredBuff(null);
                        }}
                        onMouseMove={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setMousePos({ x: rect.left + rect.width / 2, y: rect.top });
                        }}
                      >
                        <Image
                          src={imagePath}
                          alt={buff.name}
                          fill
                          className="object-cover"
                          style={{ imageRendering: 'crisp-edges' }}
                        />
                      </div>

                      {/* Name below the circle */}
                      <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-0.5">
                        {buff.name}
                      </span>

                      {/* Percentage buff below the name */}
                      <span className="text-[11px] text-yellow-400 font-bold -mt-1">
                        {buff.bonus}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Mek Slots */}
          <div className="mb-4">
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

          {/* Success Chance Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="mek-label-uppercase text-[10px]">Success Chance</span>
              <span className={`text-lg font-bold ${
                successChance >= 80 ? 'text-green-400' : 
                successChance >= 50 ? 'text-yellow-400' : 
                'text-orange-400'
              }`}>
                {successChance}%
              </span>
            </div>
            <div className="bg-black/60 rounded-full h-6 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ease-out relative overflow-hidden ${
                  successChance >= 80 ? 'bg-gradient-to-r from-green-500 to-green-400' :
                  successChance >= 50 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                  'bg-gradient-to-r from-orange-500 to-orange-400'
                }`}
                style={{ width: `${successChance}%` }}
              >
                {/* Particle effects layers */}
                <div className="mek-success-bar-particles" />
                <div className="mek-success-bar-shimmer" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent mek-scan-effect" />
              </div>
            </div>
          </div>

          {/* Deploy Section */}
          <div className="text-center relative">
            <div className="text-sm text-gray-400 mb-1">
              <span className="uppercase tracking-wider">Deployment Fee:</span> <span className="text-yellow-400 font-bold text-base">{formatGoldAmount(deploymentFee)} Gold</span>
            </div>
            <div
              className="transform scale-75"
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
                className="w-full"
              />
            </div>
            {/* Tooltip for inactive deploy button */}
            {showDeployTooltip && typeof window !== 'undefined' && createPortal(
              <div
                className="fixed pointer-events-none"
                style={{
                  left: `${mousePos.x}px`,
                  top: `${mousePos.y - 40}px`,
                  transform: 'translateX(-50%)',
                  zIndex: 99999,
                }}
              >
                <div className="bg-black/95 border border-yellow-400/50 px-3 py-2 rounded shadow-xl">
                  <div className="text-sm text-yellow-400">
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