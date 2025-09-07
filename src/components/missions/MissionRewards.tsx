"use client";

import Image from "next/image";
import type { MissionReward } from "@/app/contracts/types";

interface MissionRewardsProps {
  rewards: MissionReward[];
  limit?: number;
  variant?: "default" | "compact" | "detailed";
  className?: string;
  showDropRates?: boolean;
}

export default function MissionRewards({
  rewards,
  limit,
  variant = "default",
  className = "",
  showDropRates = true
}: MissionRewardsProps) {
  const displayRewards = limit ? rewards.slice(0, limit) : rewards;
  const hasMore = limit && rewards.length > limit;

  const getDropRateColor = (chance: number) => {
    if (chance === 100) return 'text-green-400';
    if (chance >= 75) return 'text-green-300';
    if (chance >= 50) return 'text-yellow-400';
    if (chance >= 25) return 'text-orange-400';
    if (chance >= 10) return 'text-red-400';
    return 'text-gray-400';
  };

  const getDropRateBadge = (chance: number) => {
    if (chance === 100) return 'Guaranteed';
    if (chance >= 75) return 'Common';
    if (chance >= 50) return 'Uncommon';
    if (chance >= 25) return 'Rare';
    if (chance >= 10) return 'Epic';
    return 'Legendary';
  };

  if (variant === "compact") {
    return (
      <div className={`flex flex-wrap gap-1 ${className}`}>
        {displayRewards.map((reward) => (
          <div 
            key={reward.id}
            className="bg-black/30 rounded px-2 py-1 flex items-center gap-1"
            title={`${reward.name} - ${reward.dropChance}% drop rate`}
          >
            {reward.image ? (
              <Image src={reward.image} alt="" width={16} height={16} className="rounded" />
            ) : (
              <span className="text-xs">{reward.icon}</span>
            )}
            <span className="text-xs text-gray-300">
              {typeof reward.amount === 'number' ? `x${reward.amount}` : reward.amount}
            </span>
          </div>
        ))}
        {hasMore && (
          <div className="text-xs text-gray-500 flex items-center">
            +{rewards.length - displayRewards.length} more
          </div>
        )}
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <div className={`bg-black/40 rounded-lg p-3 border border-gray-800/50 ${className}`}>
        <div className="space-y-2">
          {displayRewards.map((reward, i) => (
            <div key={reward.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {reward.image ? (
                  <Image src={reward.image} alt="" width={20} height={20} className="rounded" />
                ) : (
                  <span className="text-sm">{reward.icon}</span>
                )}
                <span className="text-sm text-gray-300">{reward.name}</span>
                {reward.amount && (
                  <span className="text-xs text-yellow-400">
                    x{reward.amount}
                  </span>
                )}
              </div>
              {showDropRates && (
                <span className={`text-sm font-bold ${getDropRateColor(reward.dropChance)}`}>
                  {reward.dropChance}%
                </span>
              )}
            </div>
          ))}
        </div>
        {hasMore && (
          <div className="text-center text-xs text-gray-500 mt-2">
            +{rewards.length - displayRewards.length} more rewards
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`space-y-1.5 ${className}`}>
      {displayRewards.map((reward) => (
        <div key={reward.id} className="flex items-center justify-between bg-black/20 rounded-lg p-2">
          <div className="flex items-center gap-2">
            {reward.image ? (
              <Image src={reward.image} alt="" width={20} height={20} className="rounded" />
            ) : (
              <span className="text-sm">{reward.icon}</span>
            )}
            <span className="text-sm text-gray-300">{reward.name}</span>
            {reward.amount && (
              <span className="text-xs text-yellow-400">
                {typeof reward.amount === 'number' ? `x${reward.amount}` : reward.amount}
              </span>
            )}
          </div>
          {showDropRates && (
            <span className={`text-xs font-medium ${getDropRateColor(reward.dropChance)}`}>
              {reward.dropChance}%
            </span>
          )}
        </div>
      ))}
      {hasMore && (
        <div className="text-center text-xs text-gray-500 py-1">
          +{rewards.length - displayRewards.length} more rewards
        </div>
      )}
    </div>
  );
}