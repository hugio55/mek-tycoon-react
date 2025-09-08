"use client";

import Image from "next/image";
import type { MissionReward } from "@/app/contracts/types";

interface StandardizedMissionRewardsProps {
  rewards: MissionReward[];
  variant?: "grid" | "list" | "compact";
  className?: string;
  showDropRates?: boolean;
}

export default function StandardizedMissionRewards({
  rewards,
  variant = "grid",
  className = "",
  showDropRates = true
}: StandardizedMissionRewardsProps) {
  const TOTAL_SLOTS = 6;
  
  // Ensure we always have exactly 6 slots
  const displaySlots = [...rewards];
  while (displaySlots.length < TOTAL_SLOTS) {
    displaySlots.push(null);
  }
  // Limit to 6 if there are more rewards
  const finalSlots = displaySlots.slice(0, TOTAL_SLOTS);

  const getDropRateColor = (chance: number) => {
    if (chance === 100) return 'text-green-400';
    if (chance >= 75) return 'text-green-300';
    if (chance >= 50) return 'text-yellow-400';
    if (chance >= 25) return 'text-orange-400';
    if (chance >= 10) return 'text-red-400';
    return 'text-purple-400';
  };

  const getDropRateBadge = (chance: number) => {
    if (chance === 100) return 'GUARANTEED';
    if (chance >= 75) return 'COMMON';
    if (chance >= 50) return 'UNCOMMON';
    if (chance >= 25) return 'RARE';
    if (chance >= 10) return 'EPIC';
    return 'LEGENDARY';
  };

  // Grid variant - 2x3 or 3x2 layout
  if (variant === "grid") {
    return (
      <div className={`grid grid-cols-3 gap-2 ${className}`}>
        {finalSlots.map((reward, index) => (
          <div
            key={reward?.id || `empty-${index}`}
            className={`
              relative overflow-hidden rounded-lg p-3 
              transition-all duration-200 
              ${reward 
                ? 'bg-black/40 border border-yellow-500/30 hover:border-yellow-500/50 hover:bg-black/50' 
                : 'bg-black/20 border border-gray-800/50'
              }
            `}
          >
            {reward ? (
              <>
                {/* Filled reward slot */}
                <div className="flex flex-col items-center text-center space-y-1">
                  {/* Icon/Image */}
                  <div className="w-8 h-8 flex items-center justify-center">
                    {reward.image ? (
                      <Image 
                        src={reward.image} 
                        alt={reward.name} 
                        width={32} 
                        height={32} 
                        className="rounded"
                      />
                    ) : (
                      <span className="text-2xl">{reward.icon || "📦"}</span>
                    )}
                  </div>
                  
                  {/* Name */}
                  <div className="text-xs text-gray-300 truncate w-full">
                    {reward.name}
                  </div>
                  
                  {/* Amount */}
                  {reward.amount && (
                    <div className="text-xs text-yellow-400 font-bold">
                      x{typeof reward.amount === 'number' ? reward.amount : reward.amount}
                    </div>
                  )}
                  
                  {/* Drop rate */}
                  {showDropRates && (
                    <div className={`text-xs font-bold ${getDropRateColor(reward.dropChance)}`}>
                      {reward.dropChance}%
                    </div>
                  )}
                </div>

                {/* Corner badge for rarity */}
                <div className="absolute top-0 right-0">
                  <div className={`
                    text-[8px] px-1 py-0.5 rounded-bl
                    ${reward.dropChance <= 10 ? 'bg-purple-500/30' : 
                      reward.dropChance <= 25 ? 'bg-orange-500/30' : 
                      reward.dropChance <= 50 ? 'bg-yellow-500/30' : 
                      'bg-green-500/30'}
                  `}>
                    {getDropRateBadge(reward.dropChance).slice(0, 3)}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Empty slot */}
                <div className="flex flex-col items-center justify-center h-full min-h-[80px] opacity-40">
                  <div className="w-8 h-8 rounded border-2 border-dashed border-gray-700 mb-2" />
                  <div className="text-[10px] text-gray-600 uppercase tracking-wider">
                    EMPTY
                  </div>
                  <div className="text-[8px] text-gray-700">
                    SLOT {index + 1}
                  </div>
                </div>
              </>
            )}

            {/* Industrial texture overlay for empty slots */}
            {!reward && (
              <div 
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  backgroundImage: `repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 5px,
                    rgba(255, 255, 255, 0.02) 5px,
                    rgba(255, 255, 255, 0.02) 10px
                  )`
                }}
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  // List variant - vertical stack
  if (variant === "list") {
    return (
      <div className={`space-y-1.5 ${className}`}>
        {finalSlots.map((reward, index) => (
          <div
            key={reward?.id || `empty-${index}`}
            className={`
              flex items-center justify-between rounded-lg p-2
              transition-all duration-200
              ${reward 
                ? 'bg-black/30 border border-yellow-500/20 hover:border-yellow-500/40' 
                : 'bg-black/10 border border-gray-800/30'
              }
            `}
          >
            {reward ? (
              <>
                {/* Filled reward slot */}
                <div className="flex items-center gap-2">
                  {reward.image ? (
                    <Image 
                      src={reward.image} 
                      alt="" 
                      width={20} 
                      height={20} 
                      className="rounded"
                    />
                  ) : (
                    <span className="text-sm">{reward.icon || "📦"}</span>
                  )}
                  <span className="text-sm text-gray-300">{reward.name}</span>
                  {reward.amount && (
                    <span className="text-xs text-yellow-400">
                      x{typeof reward.amount === 'number' ? reward.amount : reward.amount}
                    </span>
                  )}
                </div>
                {showDropRates && (
                  <span className={`text-xs font-medium ${getDropRateColor(reward.dropChance)}`}>
                    {reward.dropChance}%
                  </span>
                )}
              </>
            ) : (
              <>
                {/* Empty slot */}
                <div className="flex items-center gap-2 opacity-30">
                  <div className="w-5 h-5 rounded border border-dashed border-gray-700" />
                  <span className="text-xs text-gray-600 uppercase">Empty Slot</span>
                </div>
                <span className="text-[10px] text-gray-700">#{index + 1}</span>
              </>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Compact variant - minimal horizontal pills
  if (variant === "compact") {
    return (
      <div className={`flex flex-wrap gap-1 ${className}`}>
        {finalSlots.map((reward, index) => (
          <div
            key={reward?.id || `empty-${index}`}
            className={`
              rounded px-2 py-1 flex items-center gap-1
              ${reward 
                ? 'bg-black/30 border border-yellow-500/20' 
                : 'bg-black/10 border border-gray-800/20 opacity-30'
              }
            `}
            title={reward ? `${reward.name} - ${reward.dropChance}% drop rate` : `Empty slot ${index + 1}`}
          >
            {reward ? (
              <>
                {reward.image ? (
                  <Image src={reward.image} alt="" width={16} height={16} className="rounded" />
                ) : (
                  <span className="text-xs">{reward.icon || "📦"}</span>
                )}
                <span className="text-xs text-gray-300">
                  {typeof reward.amount === 'number' ? `x${reward.amount}` : reward.amount}
                </span>
                {showDropRates && (
                  <span className={`text-[10px] font-bold ${getDropRateColor(reward.dropChance)}`}>
                    {reward.dropChance}%
                  </span>
                )}
              </>
            ) : (
              <div className="w-4 h-4 rounded border border-dashed border-gray-700" />
            )}
          </div>
        ))}
      </div>
    );
  }

  return null;
}