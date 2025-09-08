'use client';
import React from 'react';
import Image from 'next/image';

interface Reward {
  id?: number;
  name: string;
  amount?: number | string;
  dropChance: number;
  type?: string;
  icon?: string;
  image?: string;
}

interface StandardizedMissionRewardsProps {
  rewards: Reward[];
  variant?: 'grid' | 'list' | 'compact';
  showDropRates?: boolean;
  className?: string;
}

const getRewardColor = (dropChance: number) => {
  if (dropChance === 100) return 'text-green-400';
  if (dropChance >= 75) return 'text-green-400';
  if (dropChance >= 50) return 'text-yellow-400';
  if (dropChance >= 25) return 'text-orange-400';
  if (dropChance >= 10) return 'text-red-400';
  return 'text-purple-400';
};

const StandardizedMissionRewards: React.FC<StandardizedMissionRewardsProps> = ({ 
  rewards, 
  variant = 'grid',
  showDropRates = true,
  className = ''
}) => {
  // Always create exactly 6 slots
  const slots = Array.from({ length: 6 }, (_, i) => {
    if (i < rewards.length) {
      return { ...rewards[i], isEmpty: false };
    }
    return { 
      isEmpty: true, 
      id: `empty-${i}`,
      name: '',
      dropChance: 0
    };
  });

  if (variant === 'list') {
    return (
      <div className={`space-y-1 ${className}`}>
        {slots.map((slot, i) => (
          <div 
            key={slot.id || i}
            className={`
              flex items-center justify-between p-2 rounded-lg transition-all
              ${slot.isEmpty 
                ? 'bg-black/20 border border-gray-800/50 border-dashed opacity-40' 
                : 'bg-black/40 border border-yellow-500/20 hover:border-yellow-500/40'
              }
            `}
          >
            {slot.isEmpty ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-gray-900/50 rounded border border-gray-700 border-dashed" />
                  <span className="text-xs text-gray-600 uppercase">Empty Slot {i + 1}</span>
                </div>
                <span className="text-xs text-gray-700">--</span>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  {slot.image ? (
                    <Image src={slot.image} alt={slot.name} width={20} height={20} className="rounded" />
                  ) : (
                    <span className="text-sm">{slot.icon || '📦'}</span>
                  )}
                  <span className="text-sm text-gray-300">{slot.name}</span>
                  {slot.amount && <span className="text-xs text-yellow-400">x{slot.amount}</span>}
                </div>
                {showDropRates && (
                  <span className={`text-xs font-bold ${getRewardColor(slot.dropChance)}`}>
                    {slot.dropChance}%
                  </span>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`grid grid-cols-2 gap-x-3 gap-y-1 ${className}`}>
        {slots.map((slot, i) => (
          <div 
            key={slot.id || i}
            className={`
              flex items-center justify-between text-xs
              ${slot.isEmpty ? 'opacity-30' : ''}
            `}
          >
            {slot.isEmpty ? (
              <>
                <span className="text-gray-600">Empty</span>
                <span className="text-gray-700">--</span>
              </>
            ) : (
              <>
                <span className="text-gray-400">{slot.name}</span>
                {showDropRates && (
                  <span className={`font-bold ${getRewardColor(slot.dropChance)}`}>
                    {slot.dropChance}%
                  </span>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Default grid variant (2x3)
  return (
    <div className={`grid grid-cols-2 gap-2 ${className}`}>
      {slots.map((slot, i) => (
        <div 
          key={slot.id || i}
          className={`
            p-2 rounded-lg transition-all relative overflow-hidden
            ${slot.isEmpty 
              ? 'bg-black/20 border border-gray-800/50 border-dashed' 
              : 'bg-black/40 border border-yellow-500/20 hover:border-yellow-500/40 hover:bg-black/50'
            }
          `}
        >
          {slot.isEmpty ? (
            <>
              {/* Diagonal stripe pattern for empty slots */}
              <div 
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 10px,
                    rgba(156, 163, 175, 0.3) 10px,
                    rgba(156, 163, 175, 0.3) 11px
                  )`
                }}
              />
              <div className="relative flex flex-col items-center justify-center py-2 opacity-40">
                <div className="w-8 h-8 bg-gray-900/50 rounded-lg border border-gray-700 border-dashed mb-1" />
                <span className="text-[10px] text-gray-600 uppercase">Empty</span>
              </div>
            </>
          ) : (
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                {slot.image ? (
                  <Image src={slot.image} alt={slot.name} width={16} height={16} className="rounded" />
                ) : (
                  <span className="text-xs">{slot.icon || '📦'}</span>
                )}
                <span className="text-xs text-gray-300 truncate flex-1">{slot.name}</span>
              </div>
              {showDropRates && (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500">Drop:</span>
                  <span className={`text-xs font-bold ${getRewardColor(slot.dropChance)}`}>
                    {slot.dropChance}%
                  </span>
                </div>
              )}
              {slot.amount && (
                <div className="absolute top-1 right-1 bg-yellow-500/20 text-yellow-400 text-[10px] px-1 rounded">
                  x{slot.amount}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default StandardizedMissionRewards;