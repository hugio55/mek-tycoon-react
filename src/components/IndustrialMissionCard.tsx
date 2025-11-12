'use client';

import React, { useState } from 'react';
import Image from 'next/image';

// Type definitions
interface MissionReward {
  name: string;
  icon?: string;
  amount?: number;
  dropChance: number;
}

interface MissionMultiplier {
  id: string;
  name: string;
  image: string;
  bonus: string;
}

interface AssignedMek {
  name: string;
  image?: string;
  power: number;
  matchedTraits?: Array<{
    id: string;
    bonus: string;
  }>;
}

interface IndustrialMissionCardProps {
  // Mission Data
  missionTitle?: string;
  missionDuration?: string;
  contractType?: string;
  expiryLabel?: string;
  expiryTime?: string;
  
  // Rewards
  goldReward?: number;
  xpReward?: number;
  missionRewards?: MissionReward[];
  
  // Variation Buffs
  missionMultipliers?: MissionMultiplier[];
  matchedVariations?: string[];
  onBuffClick?: (buff: MissionMultiplier) => void;

  // Genesis Buffs
  genesisBuffs?: MissionMultiplier[];
  onGenesisBuffClick?: (buff: MissionMultiplier) => void;
  
  // Mek Slots
  mekSlotCount?: number;
  selectedMeks?: (AssignedMek | null)[];
  onMekSlotClick?: (slotIndex: number, currentMek: AssignedMek | null) => void;
  hoveredMekIndex?: number | null;
  clickedMekIndex?: number | null;
  onMekHover?: (slotIndex: number | null) => void;
  onMekRemove?: (slotIndex: number) => void;
  onMekChange?: (slotIndex: number) => void;
  
  // Success Rate
  successRate?: number;
  animatedSuccessRate?: number;
  
  // Deploy
  deployFee?: number;
  onDeploy?: () => void;
  
  // Styling
  isGlobal?: boolean;
  borderStyle?: string;
  headerStyle?: number;
  traitIndicatorStyle?: number;
  
  // Helper functions (optional overrides)
  formatGoldAmount?: (amount: number) => string;
  getRewardColor?: (chance: number) => string;
}

// Default formatter functions
const defaultFormatGoldAmount = (amount: number): string => {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
  return amount.toLocaleString();
};

const defaultGetRewardColor = (chance: number): string => {
  if (chance >= 80) return 'text-green-400';
  if (chance >= 50) return 'text-yellow-400';
  if (chance >= 20) return 'text-orange-400';
  return 'text-red-400';
};

// Animated Success Bar Component
const AnimatedSuccessBar = ({ 
  successRate, 
  height = 'medium', 
  showLabel = false 
}: { 
  successRate: number; 
  height?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}) => {
  const heightClasses = {
    small: 'h-3',
    medium: 'h-5',
    large: 'h-7'
  };
  
  return (
    <div className={`bg-black/60 rounded-full overflow-hidden ${heightClasses[height]}`}>
      <div
        className={`h-full transition-[width,background] duration-500 ease-out relative overflow-hidden ${
          successRate >= 80 ? 'bg-gradient-to-r from-green-500 to-green-400' :
          successRate >= 50 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
          'bg-gradient-to-r from-orange-500 to-orange-400'
        }`}
        style={{ width: `${successRate}%` }}
      >
        {/* Animated shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        {showLabel && (
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-black">
            {successRate}%
          </span>
        )}
      </div>
    </div>
  );
};

export default function IndustrialMissionCard({
  // Default props
  missionTitle = "OPERATION PHOENIX",
  missionDuration = "2 Hours",
  contractType = "Standard Contract",
  expiryLabel = "Expires in",
  expiryTime = "23:45:30",
  
  goldReward = 50000,
  xpReward = 1500,
  missionRewards = [
    { name: "Rare Component", icon: "⚙️", dropChance: 75 },
    { name: "Epic Material", icon: "💎", dropChance: 45 },
    { name: "Legendary Core", icon: "🔮", dropChance: 15 },
    { name: "Mystery Box", icon: "📦", dropChance: 5 }
  ],
  
  missionMultipliers = [],
  matchedVariations = [],
  onBuffClick,

  genesisBuffs = [],
  onGenesisBuffClick,
  
  mekSlotCount = 8,
  selectedMeks = [],
  onMekSlotClick,
  hoveredMekIndex = null,
  clickedMekIndex = null,
  onMekHover,
  onMekRemove,
  onMekChange,
  
  successRate = 45,
  animatedSuccessRate,
  
  deployFee = 5000,
  onDeploy,
  
  isGlobal = false,
  borderStyle = "border-2",
  headerStyle = 1,
  traitIndicatorStyle = 1,
  
  formatGoldAmount = defaultFormatGoldAmount,
  getRewardColor = defaultGetRewardColor
}: IndustrialMissionCardProps) {
  
  const [selectedBuff, setSelectedBuff] = useState<MissionMultiplier | null>(null);
  
  const getBorderClasses = (style: string) => {
    return `${style} ${isGlobal ? 'border-yellow-500/50' : 'border-gray-700'}`;
  };
  
  return (
    <div className="relative w-full">
      <div
        className={`relative overflow-hidden ${getBorderClasses(borderStyle)}`}
        style={{
          background: `
            linear-gradient(135deg,
              ${isGlobal ? 'rgba(250, 182, 23, 0.02)' : 'rgba(255, 255, 255, 0.02)'} 0%,
              ${isGlobal ? 'rgba(250, 182, 23, 0.05)' : 'rgba(255, 255, 255, 0.05)'} 50%,
              ${isGlobal ? 'rgba(250, 182, 23, 0.02)' : 'rgba(255, 255, 255, 0.02)'} 100%)`,
          backdropFilter: 'blur(6px)',
          boxShadow: isGlobal
            ? 'inset 0 0 40px rgba(250, 182, 23, 0.03)'
            : 'inset 0 0 40px rgba(255, 255, 255, 0.03)',
          willChange: 'auto',
        }}
      >
        {/* Glass effect overlays - Style J */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(circle at 20% 30%, rgba(250, 182, 23, 0.08) 0%, transparent 30%),
              radial-gradient(circle at 80% 70%, ${isGlobal ? 'rgba(250, 182, 23, 0.06)' : 'rgba(139, 92, 246, 0.06)'} 0%, transparent 25%),
              radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.02) 0%, transparent 40%)`,
            mixBlendMode: 'screen',
          }}
        />
        
        {/* Dirty glass smudge pattern */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        
        {/* Header with Industrial Grunge Style */}
        <div className="relative p-4 overflow-hidden flex flex-col" style={{
          background: `
            repeating-linear-gradient(
              45deg,
              rgba(0, 0, 0, 0.9),
              rgba(0, 0, 0, 0.9) 10px,
              rgba(250, 182, 23, 0.15) 10px,
              rgba(250, 182, 23, 0.15) 20px
            ),
            linear-gradient(to right, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.8))
          `
        }}>
          {/* Procedural grunge overlay 1 - scratches and wear */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              background: `
                linear-gradient(105deg, transparent 40%, rgba(0, 0, 0, 0.3) 41%, transparent 43%),
                linear-gradient(85deg, transparent 65%, rgba(0, 0, 0, 0.2) 66%, transparent 67%),
                linear-gradient(175deg, transparent 70%, rgba(0, 0, 0, 0.25) 71%, transparent 72%),
                linear-gradient(27deg, transparent 55%, rgba(0, 0, 0, 0.15) 56%, transparent 58%),
                linear-gradient(-20deg, transparent 33%, rgba(0, 0, 0, 0.2) 34%, transparent 35%)
              `,
              mixBlendMode: 'multiply',
            }}
          />
          
          {/* Procedural grunge overlay 2 - rust and stains */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              background: `
                radial-gradient(ellipse at 15% 20%, rgba(139, 69, 19, 0.4) 0%, transparent 25%),
                radial-gradient(ellipse at 85% 80%, rgba(101, 67, 33, 0.3) 0%, transparent 20%),
                radial-gradient(ellipse at 45% 60%, rgba(184, 134, 11, 0.2) 0%, transparent 30%),
                radial-gradient(circle at 70% 30%, rgba(0, 0, 0, 0.5) 0%, transparent 15%),
                radial-gradient(circle at 25% 75%, rgba(139, 69, 19, 0.3) 0%, transparent 20%)
              `,
              filter: 'blur(1px)',
            }}
          />
          
          {/* Procedural grunge overlay 3 - metal texture noise */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              backgroundImage: `
                repeating-linear-gradient(90deg, 
                  transparent, 
                  transparent 2px, 
                  rgba(0, 0, 0, 0.1) 2px, 
                  rgba(0, 0, 0, 0.1) 3px),
                repeating-linear-gradient(0deg, 
                  transparent, 
                  transparent 2px, 
                  rgba(0, 0, 0, 0.08) 2px, 
                  rgba(0, 0, 0, 0.08) 3px)
              `,
            }}
          />
          
          {/* Paint chips and wear marks */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25" xmlns="http://www.w3.org/2000/svg">
            <path d="M10,5 L15,7 L12,9 L14,6" stroke="rgba(0,0,0,0.4)" strokeWidth="0.5" fill="rgba(0,0,0,0.2)"/>
            <path d="M90,8 L92,5 L94,8 L91,7" stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" fill="rgba(0,0,0,0.15)"/>
            <path d="M50,3 L52,6 L51,8 L49,5" stroke="rgba(0,0,0,0.35)" strokeWidth="0.5" fill="rgba(0,0,0,0.18)"/>
            <path d="M30,50 L35,52 L32,54" stroke="rgba(0,0,0,0.3)" strokeWidth="0.4" fill="none"/>
            <path d="M70,45 L75,47 L72,48" stroke="rgba(0,0,0,0.25)" strokeWidth="0.4" fill="none"/>
            <circle cx="20%" cy="70%" r="2" fill="rgba(0,0,0,0.2)"/>
            <circle cx="80%" cy="30%" r="1.5" fill="rgba(0,0,0,0.15)"/>
            <circle cx="60%" cy="60%" r="1" fill="rgba(0,0,0,0.25)"/>
          </svg>
          
          {/* Procedural grunge overlay 4 - oil stains */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-15"
            style={{
              background: `
                conic-gradient(from 45deg at 20% 30%, transparent 0deg, rgba(0, 0, 0, 0.4) 45deg, transparent 90deg),
                conic-gradient(from 180deg at 75% 70%, transparent 0deg, rgba(0, 0, 0, 0.3) 60deg, transparent 120deg),
                radial-gradient(circle at 40% 50%, rgba(0, 0, 0, 0.2) 0%, transparent 20%)
              `,
              filter: 'blur(2px)',
            }}
          />
          
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold tracking-wider text-yellow-400 mb-1 leading-tight break-words max-w-[350px]" style={{ 
                fontFamily: "'Orbitron', sans-serif",
                fontSize: 'clamp(0.75rem, 2vw, 1.125rem)',
                lineHeight: '1.1'
              }}>
                {missionTitle}
              </h2>
              <div className={`text-xs uppercase tracking-wider font-medium ${
                contractType === "Daily Global Contract" 
                  ? "text-green-400" 
                  : "text-gray-300"
              }`}
              style={{
                textShadow: contractType === "Daily Global Contract" 
                  ? "0 0 10px rgba(74, 222, 128, 0.5), 0 0 20px rgba(74, 222, 128, 0.3)" 
                  : "none"
              }}>
                {contractType}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-gray-300 uppercase tracking-wider font-medium">Mission Duration</div>
              <div className="text-xl font-bold text-yellow-400">{missionDuration}</div>
              <div className="text-xs mt-1 font-medium whitespace-nowrap">
                <span className="text-orange-400/70">{expiryLabel}</span>
                <span className="text-orange-400 ml-1">{expiryTime}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5">
          {/* Gold & XP Display */}
          <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-lg p-4 mb-4 border border-yellow-500/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-yellow-400">
                  {formatGoldAmount(goldReward)} <span className="text-sm font-normal">Gold</span>
                </div>
                <div className="text-xs text-yellow-300/60 uppercase tracking-wider">Primary Reward</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-semibold text-blue-400">+{xpReward.toLocaleString()} <span className="text-blue-300">XP</span></div>
                <div className="text-xs text-blue-300/60 uppercase tracking-wider">Experience</div>
              </div>
            </div>
          </div>

          {/* Rewards List - Sorted by chance with color coding */}
          <div className="bg-black/60 rounded-lg p-4 mb-4 border border-gray-800">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Potential Rewards</div>
            <div className="space-y-2">
              {missionRewards.map((reward, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gray-900/80 rounded flex items-center justify-center text-xs">
                      {reward.icon || "📦"}
                    </div>
                    <span className="text-sm text-gray-300">{reward.name}</span>
                    {reward.amount && <span className="text-xs text-gray-500">x{reward.amount}</span>}
                  </div>
                  <span className={`text-sm font-bold ${getRewardColor(reward.dropChance)}`}>
                    {reward.dropChance}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Variation Buffs Section */}
          {missionMultipliers.length > 0 && (
            <div className="mb-4">
              <div className="mb-3">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Variation Buffs</div>
                <div className="text-[10px] text-gray-400 mt-1">
                  Match Mek traits to these variations for success bonuses
                </div>
              </div>

              {/* Grid Layout for Variation Buffs - Max 10 circular images */}
              <div className="flex justify-center">
                <div className="grid grid-cols-5 gap-2 max-w-[400px]">
                  {missionMultipliers.map((mult) => {
                    const isMatched = matchedVariations.includes(mult.id);
                    return (
                      <div key={mult.id} className="relative">
                        <div className="flex flex-col items-center">
                          <div
                            onClick={() => {
                              setSelectedBuff(mult);
                              onBuffClick?.(mult);
                            }}
                            className={`
                            relative w-[60px] h-[60px] rounded-full bg-black/60 border-2 overflow-hidden cursor-pointer
                            ${isMatched ? 'border-yellow-400 shadow-lg shadow-yellow-400/30' : 'border-gray-700'}
                            transition-transform duration-200 hover:scale-110
                          `}>
                            <Image
                              src={mult.image}
                              alt={mult.id}
                              fill
                              className="rounded-full object-cover"
                              sizes="60px"
                            />
                          </div>
                          <div className="flex flex-col items-center justify-center min-h-[26px] mb-0.5">
                            <div className={`text-[9px] font-medium ${isMatched ? 'text-white' : 'text-gray-400'} uppercase tracking-wider text-center leading-tight px-1`}>
                              {mult.name}
                            </div>
                          </div>
                          <div className={`text-[10px] font-bold ${isMatched ? 'text-yellow-400 drop-shadow-[0_0_4px_rgba(250,182,23,0.5)]' : 'text-gray-500'}`}>
                            {mult.bonus}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Genesis Buffs Section */}
          {genesisBuffs.length > 0 && (
            <div className="mb-4">
              <div className="mb-3">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Genesis Buffs</div>
                <div className="text-[10px] text-gray-400 mt-1">
                  Attach Genesis Tokens for success bonuses
                </div>
              </div>

              {/* Grid Layout for Genesis Buffs - 5 circular images */}
              <div className="flex justify-center">
                <div className="grid grid-cols-5 gap-2 max-w-[400px]">
                  {genesisBuffs.map((buff) => (
                    <div key={buff.id} className="relative">
                      <div className="flex flex-col items-center">
                        <div
                          onClick={() => {
                            onGenesisBuffClick?.(buff);
                          }}
                          className="relative w-[60px] h-[60px] rounded-full bg-black/60 border-2 border-gray-700 overflow-hidden cursor-pointer transition-[transform,border-color] duration-200 hover:scale-110 hover:border-yellow-400"
                        >
                          <Image
                            src={buff.image}
                            alt={buff.id}
                            fill
                            className="rounded-full object-cover"
                            sizes="60px"
                          />
                        </div>
                        <div className="text-[9px] font-medium mt-1 text-gray-400 uppercase tracking-wider text-center">
                          {buff.name}
                        </div>
                        <div className="text-[10px] font-bold text-gray-500">
                          {buff.bonus}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Mek Slots - Industrial Grid */}
          <div className="mb-4">
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => {
                const isLocked = i >= mekSlotCount;
                const assignedMek = selectedMeks[i];
                const isHovered = hoveredMekIndex === i;
                const isClicked = clickedMekIndex === i;
                
                return (
                  <div key={i} className="aspect-square relative mek-slot">
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isLocked) {
                          onMekSlotClick?.(i, assignedMek);
                        }
                      }}
                      onMouseEnter={() => {
                        if (assignedMek) {
                          onMekHover?.(i);
                        }
                      }}
                      onMouseLeave={() => onMekHover?.(null)}
                      className={`
                        w-full h-full flex flex-col items-center justify-center transition-[border-color,box-shadow,background-color,opacity] duration-200 relative
                        ${isLocked
                          ? 'bg-black/80 opacity-30'
                          : assignedMek
                            ? 'bg-gradient-to-br from-yellow-900/40 to-yellow-800/20'
                            : 'bg-gradient-to-br from-yellow-900/20 to-yellow-800/10 hover:shadow-lg hover:shadow-yellow-500/20 cursor-pointer'
                        }
                        border-2 ${isLocked ? 'border-gray-900' : assignedMek?.matchedTraits && assignedMek.matchedTraits.length > 0 ? 'border-yellow-400 shadow-[0_0_10px_rgba(250,182,23,0.5)]' : assignedMek ? (isHovered ? 'border-yellow-400 shadow-[0_0_15px_rgba(250,182,23,0.6)]' : 'border-white') : 'border-gray-700 hover:border-yellow-400'}
                      `}>
                      {!isLocked && (
                        assignedMek ? (
                          <div className="relative w-full h-full overflow-hidden">
                            <Image
                              src={assignedMek.image || `/mek-images/150px/mek${String(Math.floor(Math.random() * 1000) + 1).padStart(4, '0')}.png`}
                              alt={assignedMek.name}
                              fill
                              className={`object-cover transition-[transform,filter] duration-300 ${
                                isHovered
                                  ? 'scale-110 brightness-110'
                                  : 'scale-100 brightness-100'
                              }`}
                            />
                            {/* Trait match indicators */}
                            {assignedMek.matchedTraits && assignedMek.matchedTraits.length > 0 && (
                              <>
                                {/* Corner Badge style by default */}
                                {traitIndicatorStyle === 1 && (
                                  <div className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded">
                                    +{assignedMek.matchedTraits.reduce((acc: number, trait: any) => acc + parseInt(trait.bonus.replace("%", "").replace("+", "")), 0)}%
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center">
                            <span className="text-3xl text-yellow-500/60 hover:text-yellow-400 transition-colors">+</span>
                            <span className="text-[9px] text-yellow-500/40 uppercase tracking-wider">Empty</span>
                          </div>
                        )
                      )}
                    </div>
                    
                    {/* Mek Tooltip - Smart positioning to stay on screen */}
                    {isClicked && assignedMek && (
                      <div className="mek-tooltip absolute z-50 bg-black/95 border border-yellow-400/50 rounded-lg p-3 min-w-[200px] max-w-[250px]" style={{
                        ...(i % 4 === 0 ? 
                          { left: '0', right: 'auto' } : 
                          i % 4 === 3 ? 
                          { right: '0', left: 'auto' } : 
                          { left: '50%', transform: 'translateX(-50%)' }),
                        ...(i >= 4 ? 
                          { top: '100%', marginTop: '8px', bottom: 'auto' } : 
                          { bottom: '100%', marginBottom: '8px', top: 'auto' })
                      }}>
                        <div className="text-sm font-bold text-yellow-400 mb-2">{assignedMek.name}</div>
                        <div className="text-xs text-gray-400 mb-2">Power: {assignedMek.power}</div>
                        {assignedMek.matchedTraits && assignedMek.matchedTraits.length > 0 && (
                          <div className="mb-2">
                            <div className="text-xs text-green-400 font-bold mb-1">Matched Bonuses:</div>
                            {assignedMek.matchedTraits.map((trait: any) => (
                              <div key={trait.id} className="text-xs text-gray-300">
                                {trait.id}: <span className="text-green-400 font-bold">{trait.bonus}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2 mt-3">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onMekChange?.(i);
                            }}
                            className="flex-1 px-2 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 rounded text-xs text-yellow-400 font-bold transition-[background-color] duration-200"
                          >
                            Change
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onMekRemove?.(i);
                            }}
                            className="flex-1 px-2 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded text-xs text-red-400 font-bold transition-[background-color] duration-200"
                          >
                            Remove
                          </button>
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
              <span className="text-xs text-gray-500 uppercase tracking-wider">Success Chance</span>
              <span className={`text-lg font-bold transition-colors duration-500 ${
                (animatedSuccessRate || successRate) >= 80 ? 'text-green-400' :
                (animatedSuccessRate || successRate) >= 50 ? 'text-yellow-400' : 'text-orange-400'
              }`}>
                {animatedSuccessRate || successRate}%
              </span>
            </div>
            <AnimatedSuccessBar 
              successRate={animatedSuccessRate || successRate} 
              height="medium"
              showLabel={false}
            />
          </div>

          {/* Deploy Button */}
          <div className="text-center">
            <div className="text-xs text-gray-400 mb-2">
              Deployment Fee: <span className="text-yellow-400 font-bold">{formatGoldAmount(deployFee)} Gold</span>
            </div>
            <button
              onClick={onDeploy}
              className="relative px-12 py-4 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black rounded font-bold text-lg uppercase tracking-[0.2em] transition-[background,box-shadow] duration-300 shadow-lg hover:shadow-yellow-500/30 overflow-hidden group"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              {/* Particle effect overlay */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-white rounded-full opacity-60 animate-pulse"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 2}s`,
                      animationDuration: `${1 + Math.random() * 2}s`
                    }}
                  />
                ))}
              </div>

              {/* Hover glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Button content with arrow */}
              <div className="relative flex flex-col items-center justify-center">
                {/* Upward arrow */}
                <svg
                  className="w-5 h-5 -mb-3"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M10 3L10 17M10 3L5 8M10 3L15 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>

                {/* DEPLOY text */}
                <span className="font-black text-shadow-sm">DEPLOY</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}