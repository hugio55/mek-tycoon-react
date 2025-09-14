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
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)},000`;
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
        
        {/* Mek Image Section */}
        <div className="relative bg-black/80 p-4 border-b-2 border-yellow-500/30">
          <div className="relative w-full h-48 bg-black/60 rounded-lg overflow-hidden mb-3">
            {mekImage && (
              <Image
                src={mekImage}
                alt={mekName}
                fill
                className="object-contain"
                style={{ imageRendering: 'crisp-edges' }}
              />
            )}
          </div>
          <div className="flex justify-between items-center">
            <h2 className="mek-text-industrial text-xl font-black tracking-wider text-yellow-400">
              {mekName}
            </h2>
            <div className="text-sm text-gray-400">
              Rank <span className="text-yellow-400 font-bold">{mekRank}</span>
            </div>
          </div>
        </div>

        <div className="p-4 relative">
          {/* Primary Rewards Section */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-black/60 mek-border-sharp-gold p-3">
              <div className="mek-value-primary text-2xl">{formatGoldAmount(primaryReward)}</div>
              <div className="mek-label-uppercase text-[10px]">Gold</div>
              <div className="text-[8px] text-gray-500 uppercase">Primary Reward</div>
            </div>
            <div className="bg-black/60 mek-border-sharp-gold p-3">
              <div className="mek-value-secondary text-2xl">+{formatGoldAmount(experience)}</div>
              <div className="mek-label-uppercase text-[10px]">XP</div>
              <div className="text-[8px] text-gray-500 uppercase">Experience</div>
            </div>
          </div>

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
            <div className="mek-label-uppercase mb-2 text-[10px]">Variation Buffs</div>
            <div className="text-[10px] text-gray-400 mb-3">Match Mek traits to these variations for success bonuses</div>
            
            {/* Two rows of buff indicators */}
            <div className="grid grid-cols-5 gap-2 mb-2">
              {['TASER', 'LOG', 'KEVLAR', 'NUKE', 'EXPOSED'].map((buff) => (
                <div key={buff} className="relative">
                  <div className="aspect-square rounded-full border-2 border-yellow-500/30 bg-black/60 flex flex-col items-center justify-center p-1">
                    <span className="text-[8px] text-gray-400 font-bold">{buff}</span>
                    <span className="text-[10px] text-yellow-400 font-bold">+10%</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-5 gap-2">
              {['JADE', 'LOG', 'KEVLAR', 'NUKE', 'EXPOSED'].map((buff) => (
                <div key={buff} className="relative">
                  <div className="aspect-square rounded-full border-2 border-yellow-500/30 bg-black/60 flex flex-col items-center justify-center p-1">
                    <span className="text-[8px] text-gray-400 font-bold">{buff}</span>
                    <span className="text-[10px] text-yellow-400 font-bold">+10%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Mek Slots */}
          <div className="mb-4">
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((slot) => (
                <div key={slot} className="aspect-square bg-black/60 border-2 border-yellow-500/30 border-dashed rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-xl text-yellow-500/30">+</div>
                    <div className="text-[8px] text-gray-500 uppercase">Empty</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {[5, 6].map((slot) => (
                <div key={slot} className="aspect-square bg-black/60 border-2 border-yellow-500/30 border-dashed rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-xl text-yellow-500/30">+</div>
                    <div className="text-[8px] text-gray-500 uppercase">Empty</div>
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