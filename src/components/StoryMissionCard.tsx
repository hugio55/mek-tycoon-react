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

  // Styling
  scale?: number;
  style?: React.CSSProperties;

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
  scale = 1.0,
  style,
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
            {/* Diagonal hazard stripes */}
            <div
              className="absolute inset-0 opacity-30"
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
                Rank <span className="text-yellow-400 font-bold text-base">{mekRank}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Gold and XP Bar - Clean Industrial Style */}
        <div className="relative bg-gradient-to-r from-amber-900/60 via-amber-800/40 to-amber-900/60 border-y-2 border-yellow-500/40 overflow-hidden">
          {/* Content - Single unified bar */}
          <div className="relative flex items-center justify-between px-6 py-3 h-14">
            {/* Gold Reward */}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-yellow-400">{formatGoldAmount(primaryReward)}</span>
              <span className="text-xs font-semibold text-yellow-400/70 uppercase tracking-wide">Gold</span>
            </div>

            {/* XP Reward */}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-blue-400">+{formatGoldAmount(experience)}</span>
              <span className="text-xs font-semibold text-blue-400/70 uppercase tracking-wide">XP</span>
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
              <div className="text-[10px] text-gray-400 mt-1">
                Match Mek traits to these variations for success bonuses
              </div>
            </div>

            {/* Grid Layout for Variation Buffs - max 5 circular images */}
            <div className="flex justify-center">
              <div className="grid grid-cols-5 gap-2 max-w-[400px]">
                {variationBuffs.slice(0, 5).map((buff, index) => {
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
                    <div key={`${buff.id}-${index}`} className="relative">
                      <div className="flex flex-col items-center">
                        <div className="relative w-[60px] h-[60px] rounded-full bg-black/60 border-2 border-gray-700 overflow-hidden cursor-pointer transition-all hover:scale-110 hover:border-yellow-400">
                          <Image
                            src={imagePath}
                            alt={buff.name}
                            fill
                            className="object-cover opacity-80"
                            style={{ imageRendering: 'crisp-edges' }}
                          />
                          {/* Dark overlay for better text visibility */}
                          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />

                          {/* Text overlay centered */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-[9px] text-gray-300 font-bold uppercase">{buff.name}</span>
                            <span className="text-[11px] text-yellow-400 font-bold">{buff.bonus}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Mek Slots */}
          <div className="mb-4">
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((slot) => (
                <div key={slot} className="mek-slot-empty aspect-square border-2 border-dashed border-yellow-500/30 bg-black/40 flex items-center justify-center cursor-pointer hover:border-yellow-500/60 transition-all">
                  <div className="text-center">
                    <div className="text-2xl text-gray-600">+</div>
                    <div className="text-[8px] text-gray-600 uppercase">Empty</div>
                  </div>
                </div>
              ))}
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