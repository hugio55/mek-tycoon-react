'use client';

import { useQuery } from "convex/react";
import { api } from "@/../../convex/_generated/api";
import { Id } from "@/../../convex/_generated/dataModel";
import { useEffect, useState } from "react";

interface ActiveBuffsProps {
  userId: Id<"users"> | null;
}

export default function ActiveBuffs({ userId }: ActiveBuffsProps) {
  const [timeLeft, setTimeLeft] = useState<{ [key: string]: string }>({});
  const activeBuffs = useQuery(api.buffManager.getUserBuffs, 
    userId ? { userId } : "skip"
  );

  // Update countdown timers
  useEffect(() => {
    if (!activeBuffs) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const newTimeLeft: { [key: string]: string } = {};

      activeBuffs.forEach((buff) => {
        if (buff.expiresAt) {
          const remaining = buff.expiresAt - now;
          if (remaining > 0) {
            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
            
            if (hours > 0) {
              newTimeLeft[buff._id] = `${hours}h ${minutes}m`;
            } else if (minutes > 0) {
              newTimeLeft[buff._id] = `${minutes}m ${seconds}s`;
            } else {
              newTimeLeft[buff._id] = `${seconds}s`;
            }
          }
        } else {
          newTimeLeft[buff._id] = "Permanent";
        }
      });

      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeBuffs]);

  if (!userId || !activeBuffs || activeBuffs.length === 0) {
    return null;
  }

  // Group buffs by type for better display
  const buffsByType = activeBuffs.reduce((acc: any, buff: any) => {
    const type = buff.buffType.buffType;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(buff);
    return acc;
  }, {} as Record<string, typeof activeBuffs>);

  const getBuffColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-orange-500 to-red-500';
      case 'epic': return 'from-purple-500 to-pink-500';
      case 'rare': return 'from-blue-500 to-cyan-500';
      case 'uncommon': return 'from-green-500 to-emerald-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getBuffTypeLabel = (type: string) => {
    switch (type) {
      case 'gold_rate': return 'Gold';
      case 'xp_gain': return 'XP';
      case 'crafting_speed': return 'Speed';
      case 'essence_rate': return 'Essence';
      case 'crafting_success': return 'Luck';
      default: return type;
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-xs">
      <div className="bg-black/80 backdrop-blur-md rounded-lg border border-yellow-500/30 p-3">
        <h3 className="text-yellow-400 font-bold text-sm mb-2 flex items-center">
          <span className="mr-2">⚡</span>
          Active Buffs
        </h3>
        
        <div className="space-y-2">
          {Object.entries(buffsByType).map(([type, buffs]) => {
            // Combine stacks for same buff type
            const totalValue = buffs.reduce((sum: any, buff: any) => {
              if (buff.buffType.valueType === 'percentage') {
                return sum + (buff.buffType.baseValue * buff.stacks);
              }
              return sum + (buff.value * buff.stacks);
            }, 0);

            const firstBuff = buffs[0];
            const isPercentage = firstBuff.buffType.valueType === 'percentage';
            
            return (
              <div 
                key={type}
                className={`relative overflow-hidden rounded-lg p-2 bg-gradient-to-r ${getBuffColor(firstBuff.buffType.rarity)} bg-opacity-20`}
              >
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{firstBuff.buffType.icon}</span>
                    <div>
                      <p className="text-xs font-semibold text-white">
                        {getBuffTypeLabel(type)}
                      </p>
                      <p className="text-xs text-gray-300">
                        +{totalValue}{isPercentage ? '%' : ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xs text-gray-400">
                      {timeLeft[firstBuff._id] || 'Permanent'}
                    </p>
                    {buffs.length > 1 && (
                      <p className="text-xs text-yellow-400">
                        x{buffs.reduce((sum: any, b: any) => sum + b.stacks, 0)}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Animated background effect */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Total buff summary */}
        <div className="mt-3 pt-2 border-t border-gray-700">
          <p className="text-xs text-gray-400">
            {activeBuffs.length} buff{activeBuffs.length !== 1 ? 's' : ''} active
          </p>
        </div>
      </div>
    </div>
  );
}