'use client';

import React from 'react';

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

interface MissionCardProps {
  // Core mission data
  title?: string;
  duration?: string;
  contractType?: string;
  expirationTime?: string;
  
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
  
  // Scaling
  scale?: number;
}

export default function MissionCard({
  title = "OPERATION PHOENIX",
  duration = "2 Hours",
  contractType = "STANDARD CONTRACT",
  expirationTime = "2h 43m 19s",
  primaryReward = 50000,
  experience = 1500,
  potentialRewards = [
    { name: "Rare Component", quantity: 1, chance: 75 },
    { name: "Epic Material", quantity: 1, chance: 45 },
    { name: "Legendary Core", quantity: 1, chance: 15 },
  ],
  variationBuffs = [],
  successChance = 65,
  deploymentFee = 5000,
  onDeploy,
  scale = 0.9
}: MissionCardProps) {
  
  const formatGoldAmount = (amount: number): string => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
    return amount.toLocaleString();
  };
  
  const getRewardColor = (chance: number): string => {
    if (chance >= 80) return 'text-green-400';
    if (chance >= 50) return 'text-yellow-400';
    if (chance >= 20) return 'text-orange-400';
    return 'text-red-400';
  };
  
  return (
    <div 
      className="relative w-full max-w-md mx-auto"
      style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
    >
      <div className="mek-card-industrial mek-border-sharp-gold overflow-hidden">
        
        {/* Industrial Header with Hazard Stripes */}
        <div className="mek-header-industrial">
          <div className="relative z-10">
            <h2 className="mek-text-industrial text-xl font-black tracking-wider text-yellow-400">
              {title}
            </h2>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <span className="mek-label-uppercase">Duration</span>
                <span className="text-sm font-bold text-yellow-300">{duration}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="mek-label-uppercase">Expires</span>
                <span className="text-sm font-bold text-orange-400">{expirationTime}</span>
              </div>
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">
              {contractType}
            </div>
          </div>
          {/* Grunge overlays */}
          <div className="mek-overlay-scratches"></div>
          <div className="mek-overlay-hazard-stripes"></div>
        </div>

        <div className="p-4 relative">
          {/* Primary Rewards Section */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-black/60 mek-border-sharp-gold p-3">
              <div className="mek-value-primary text-2xl">{formatGoldAmount(primaryReward)}</div>
              <div className="mek-label-uppercase">Gold Reward</div>
            </div>
            <div className="bg-black/60 mek-border-sharp-gold p-3">
              <div className="mek-value-secondary text-2xl">+{experience.toLocaleString()}</div>
              <div className="mek-label-uppercase">Experience</div>
            </div>
          </div>

          {/* Potential Rewards */}
          {potentialRewards.length > 0 && (
            <div className="bg-black/60 rounded-lg p-3 mb-4 border border-gray-700">
              <div className="mek-label-uppercase mb-2">Potential Rewards</div>
              <div className="space-y-1">
                {potentialRewards.map((reward, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-300">{reward.name}</span>
                      {reward.quantity && reward.quantity > 1 && (
                        <span className="text-xs text-gray-500">x{reward.quantity}</span>
                      )}
                    </div>
                    <span className={`text-sm font-bold ${getRewardColor(reward.chance)}`}>
                      {reward.chance}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Variation Buffs */}
          <div className="mb-4">
            <div className="mek-label-uppercase mb-2">Variation Buffs</div>
            <div className="text-xs text-gray-400 mb-3">Match Mek traits to these variations for success bonuses</div>
            
            {/* Top row of circular buff indicators */}
            <div className="grid grid-cols-5 gap-2 mb-2">
              {['TASER', 'LOG', 'KEVLAR', 'NUKE', 'EXPOSED'].map((buff, i) => (
                <div key={buff} className="relative">
                  <div className="aspect-square rounded-full border-2 border-yellow-500/30 bg-black/60 flex flex-col items-center justify-center p-2">
                    <div className="w-full h-1 bg-yellow-500 rounded-full mb-1" />
                    <span className="text-[8px] text-gray-400 font-bold">{buff}</span>
                    <span className="text-[10px] text-yellow-400 font-bold">+10%</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Bottom row of circular buff indicators */}
            <div className="grid grid-cols-5 gap-2">
              {['SHAMROCK', 'CLASSIC', 'LIGHTNING', 'CORRODED', 'BARK'].map((buff, i) => (
                <div key={buff} className="relative">
                  <div className="aspect-square rounded-full border-2 border-yellow-500/30 bg-black/60 flex flex-col items-center justify-center p-2">
                    <div className="w-full h-1 bg-yellow-500 rounded-full mb-1" />
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
                    <div className="text-2xl text-yellow-500/30">+</div>
                    <div className="text-[8px] text-gray-500 uppercase">Empty</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {[5, 6].map((slot) => (
                <div key={slot} className="aspect-square bg-black/60 border-2 border-yellow-500/30 border-dashed rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl text-yellow-500/30">+</div>
                    <div className="text-[8px] text-gray-500 uppercase">Empty</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Success Chance Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="mek-label-uppercase">Success Chance</span>
              <span className={`text-lg font-bold ${
                successChance >= 80 ? 'text-green-400' : 
                successChance >= 50 ? 'text-yellow-400' : 
                'text-orange-400'
              }`}>
                {successChance}%
              </span>
            </div>
            <div className="bg-black/60 rounded-full h-4 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ease-out relative overflow-hidden ${
                  successChance >= 80 ? 'bg-gradient-to-r from-green-500 to-green-400' : 
                  successChance >= 50 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' : 
                  'bg-gradient-to-r from-orange-500 to-orange-400'
                }`}
                style={{ width: `${successChance}%` }}
              >
                {/* Animated shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent mek-scan-effect" />
              </div>
            </div>
          </div>

          {/* Deploy Section */}
          <div className="text-center">
            <div className="text-xs text-gray-400 mb-2">
              Deployment Fee: <span className="text-yellow-400 font-bold">{formatGoldAmount(deploymentFee)} Gold</span>
            </div>
            <button 
              onClick={onDeploy}
              className="mek-button-primary w-full"
            >
              DEPLOY MISSION
            </button>
          </div>

          {/* Metal texture overlay */}
          <div className="mek-overlay-metal-texture"></div>
        </div>
      </div>
    </div>
  );
}