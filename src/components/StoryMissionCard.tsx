'use client';

import React from 'react';
import Image from 'next/image';

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
  availableSlots?: number; // Number of available mek slots (1-8)

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
  mekRank = 34,
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
  availableSlots = 8,
  scale = 1.0,
  style,
  rewardBarStyle = 1,
  isLocked = false,
  isEmpty = false
}: StoryMissionCardProps) {
  
  const formatGoldAmount = (amount: number): string => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${amount.toLocaleString()}`;
    return amount.toLocaleString();
  };
  
  const getRewardColor = (chance: number): string => {
    if (chance >= 80) return 'text-green-400';
    if (chance >= 50) return 'text-yellow-400';
    if (chance >= 20) return 'text-orange-400';
    return 'text-red-400';
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
          <div className="relative w-full aspect-square bg-black overflow-hidden">
            {mekImage && (
              <Image
                src={mekImage}
                alt={mekName}
                fill
                className="object-cover"
                style={{ imageRendering: 'crisp-edges' }}
              />
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
              <div className="text-sm text-gray-300">
                Rank <span className="text-yellow-400 font-bold text-lg">{mekRank}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Gold and XP Bar - Compact side-by-side */}
        <div className="relative bg-black/90 border-y border-yellow-500/30 overflow-hidden">
          {/* Content */}
          <div className="relative flex items-center justify-center gap-8 py-3 h-12">
            {/* Gold Section */}
            <div className="flex items-center gap-1">
              <span className="text-[22px] font-semibold text-yellow-400" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
                {formatGoldAmount(primaryReward)}
              </span>
              <span className="text-[11px] text-yellow-400/80" style={{ fontFamily: 'Segoe UI, sans-serif' }}>GOLD</span>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-600/50" />

            {/* XP Section */}
            <div className="flex items-center gap-1">
              <span className="text-[22px] font-semibold text-blue-400" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
                +{formatGoldAmount(experience)}
              </span>
              <span className="text-[11px] text-blue-400/80" style={{ fontFamily: 'Segoe UI, sans-serif' }}>XP</span>
            </div>
          </div>
        </div>


        <div className="p-3 relative">

          {/* Potential Rewards */}
          <div className="bg-black/60 rounded-lg p-3 mb-4 border border-gray-700">
            <div className="mek-label-uppercase mb-2 text-[10px]">Potential Rewards</div>
            <div className="space-y-1">
              {potentialRewards.slice(0, 6).map((reward, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500/20 rounded" />
                    <span className="text-xs text-gray-300">{reward.name}</span>
                    {reward.quantity && (
                      <span className="text-[10px] text-gray-500">x{reward.quantity}</span>
                    )}
                  </div>
                  <span className={`text-xs font-bold ${getRewardColor(reward.chance)}`}>
                    {reward.chance}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Variation Buffs */}
          <div className="mb-4">
            <div className="mb-3">
              <div className="text-xs text-gray-500 uppercase tracking-wider">Variation Buffs</div>
              <div className="text-xs text-gray-400 mt-1">
                Match Mek traits to these variations for success bonuses
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
                    <div key={`${buff.id}-${index}`} className="flex flex-col items-center gap-1">
                      {/* Circle with variation image - increased by ~4% */}
                      <div className="relative w-[58px] h-[58px] rounded-full bg-black/80 border border-gray-700/50 overflow-hidden cursor-pointer transition-all hover:scale-105 hover:border-yellow-400/50">
                        <Image
                          src={imagePath}
                          alt={buff.name}
                          fill
                          className="object-cover"
                          style={{ imageRendering: 'crisp-edges' }}
                        />
                      </div>

                      {/* Name below the circle */}
                      <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-1">
                        {buff.name}
                      </span>

                      {/* Percentage buff below the name */}
                      <span className="text-[11px] text-yellow-400 font-bold -mt-0.5">
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
                return (
                  <div
                    key={slot}
                    className={`aspect-square p-2 border-2 flex items-center justify-center transition-all ${
                      isAvailable
                        ? 'mek-slot-empty border-dashed border-yellow-500/30 bg-black/40 cursor-pointer hover:border-yellow-500/60'
                        : 'border-solid border-gray-800/30 bg-black/80 cursor-not-allowed opacity-30'
                    }`}
                    onClick={isAvailable && onMekSlotClick ? () => onMekSlotClick(slot - 1) : undefined}
                  >
                    <div className="text-center">
                      <div className={`text-2xl ${isAvailable ? 'text-gray-600' : 'text-gray-800'}`}>
                        {isAvailable ? '+' : '×'}
                      </div>
                      <div className={`text-[8px] uppercase ${isAvailable ? 'text-gray-600' : 'text-gray-800'}`}>
                        {isAvailable ? 'Empty' : 'Locked'}
                      </div>
                    </div>
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
            <div className="bg-black/60 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ease-out relative overflow-hidden ${
                  successChance >= 80 ? 'bg-gradient-to-r from-green-500 to-green-400' : 
                  successChance >= 50 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' : 
                  'bg-gradient-to-r from-orange-500 to-orange-400'
                }`}
                style={{ width: `${successChance}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent mek-scan-effect" />
              </div>
            </div>
          </div>

          {/* Deploy Section */}
          <div className="text-center">
            <div className="text-[10px] text-gray-400 mb-2">
              Deployment Fee: <span className="text-yellow-400 font-bold">{formatGoldAmount(deploymentFee)} Gold</span>
            </div>
            <button 
              onClick={onDeploy}
              className="mek-button-primary w-full text-sm"
            >
              DEPLOY
            </button>
          </div>

          {/* Metal texture overlay */}
          <div className="mek-overlay-metal-texture"></div>
        </div>
      </div>
    </div>
  );
}