"use client";

import { useState } from "react";
import Image from "next/image";
import MissionHeader from "./MissionHeader";
import MissionRewards from "./MissionRewards";
import MekSlotGrid from "./MekSlotGrid";
import SuccessRateMeter from "./SuccessRateMeter";
import DeploySection from "./DeploySection";
import WeaknessIndicators from "./WeaknessIndicators";
import type { Mission, Mek, ElegantVariation } from "@/app/contracts/types";
import { formatGoldAmount, formatCountdown } from "@/app/contracts/utils/helpers";

interface MissionCardProps {
  mission: Mission;
  variation?: ElegantVariation;
  onDeploy?: () => void;
  onMekSelect?: (missionId: string, slotIndex: number) => void;
  selectedMeks?: Mek[];
  matchedBonuses?: string[];
  animatingSuccess?: number;
  currentTime?: number;
  className?: string;
}

export default function MissionCard({
  mission,
  variation = "industrial-v1",
  onDeploy,
  onMekSelect,
  selectedMeks = [],
  matchedBonuses = [],
  animatingSuccess,
  currentTime = Date.now(),
  className = ""
}: MissionCardProps) {
  const [hoveredAilment, setHoveredAilment] = useState<string | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);
  
  const bonusPercentage = matchedBonuses.reduce((acc, id) => {
    const mult = mission.multipliers?.find(m => m.id === id);
    return acc + parseInt(mult?.bonus.replace('+', '').replace('%', '') || '0');
  }, 0);
  
  const baseSuccessRate = (selectedMeks.length / mission.mekSlots) * 70;
  const targetSuccessRate = Math.min(100, baseSuccessRate + bonusPercentage);
  const successRate = animatingSuccess || baseSuccessRate;

  const renderIndustrialV1 = () => (
    <div className={`relative group ${className}`}>
      <div className={`relative ${mission.isGlobal ? 'bg-gradient-to-b from-yellow-900/20 via-black/90 to-black/95' : 'bg-gradient-to-b from-gray-900/60 via-black/90 to-black/95'} backdrop-blur-md border-2 ${mission.isGlobal ? 'border-yellow-500/50' : 'border-gray-700/50'} shadow-2xl`}>
        
        {/* Header with diagonal stripes */}
        <div className="relative p-5 border-b-2 border-yellow-500/30" style={{
          background: `
            repeating-linear-gradient(
              45deg,
              rgba(250, 182, 23, 0.03),
              rgba(250, 182, 23, 0.03) 10px,
              transparent 10px,
              transparent 20px
            )
          `
        }}>
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-wider text-yellow-400 drop-shadow-[0_0_10px_rgba(250,182,23,0.5)]">
                {mission.isGlobal ? mission.name : mission.name?.toUpperCase()}
              </h2>
              <div className="text-sm text-gray-400 mt-1">
                {mission.isGlobal ? 'GLOBAL' : 'STANDARD CONTRACT'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">MISSION DURATION</div>
              <div className="text-2xl font-bold text-yellow-400">
                {mission.isGlobal ? '24 Hours' : '2 Hours'}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {mission.contractExpiry ? `Contract Expires: ${formatCountdown(mission.contractExpiry)}` : ''}
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-5">
          
          {/* Main Rewards Section */}
          <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-lg p-4 mb-4 border border-yellow-500/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-yellow-400">
                  {formatGoldAmount(mission.goldReward)} 
                  <span className="text-sm font-normal ml-1">Gold</span>
                </div>
                <div className="text-xs text-yellow-300/70 uppercase tracking-wider">PRIMARY REWARD</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-semibold text-blue-400">
                  +{mission.xpReward.toLocaleString()} <span className="text-blue-300">XP</span>
                </div>
                <div className="text-xs text-blue-300/70 uppercase tracking-wider">EXPERIENCE</div>
              </div>
            </div>
          </div>

          {/* Potential Rewards */}
          <div className="mb-4">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">POTENTIAL REWARDS</div>
            <MissionRewards 
              rewards={mission.rewards}
              limit={mission.isGlobal ? 6 : 3}
              variant="detailed"
              className=""
            />
          </div>

          {/* Variation Buffs Section */}
          {mission.multipliers && mission.multipliers.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">VARIATION BUFFS</div>
              <div className="grid grid-cols-5 gap-2">
                {mission.multipliers.slice(0, 10).map((mult) => {
                  const isMatched = matchedBonuses.includes(mult.id);
                  return (
                    <div 
                      key={mult.id}
                      className={`relative group/buff`}
                    >
                      <div className={`
                        w-full aspect-square rounded-full border-2 flex flex-col items-center justify-center transition-all
                        ${isMatched 
                          ? 'bg-yellow-900/40 border-yellow-400 shadow-lg shadow-yellow-400/50 scale-110' 
                          : 'bg-black/40 border-gray-700 hover:border-gray-600'
                        }
                      `}>
                        <span className="text-[10px] font-bold text-center leading-tight text-yellow-400">
                          {mult.id.length > 7 ? mult.id.substring(0, 7) : mult.id}
                        </span>
                        <span className={`text-[10px] font-bold ${isMatched ? 'text-yellow-300' : 'text-gray-500'}`}>
                          {mult.bonus}
                        </span>
                      </div>
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black/95 rounded p-2 opacity-0 group-hover/buff:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap border border-yellow-500/30">
                        <div className="text-xs font-bold text-yellow-400">{mult.id}</div>
                        <div className="text-[10px] text-gray-300">Bonus: {mult.bonus}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mek Slots Grid */}
          <MekSlotGrid 
            mekSlots={mission.mekSlots}
            selectedMeks={selectedMeks}
            missionId={mission.id}
            onSlotClick={onMekSelect}
            hoveredSlot={hoveredSlot}
            setHoveredSlot={setHoveredSlot}
            variant="detailed"
            className="mb-4"
          />
          
          {/* Success Rate Meter */}
          <SuccessRateMeter 
            successRate={successRate}
            targetRate={targetSuccessRate}
            variant="detailed"
            className="mb-4"
          />

          {/* Deploy Section */}
          <DeploySection 
            mission={mission}
            onDeploy={onDeploy}
            disabled={selectedMeks.length === 0}
            variant="detailed"
          />
        </div>
      </div>
    </div>
  );

  const renderIndustrialV2 = () => (
    <div className={`relative ${className}`}>
      <div className="bg-gradient-to-br from-gray-900/90 via-black/95 to-gray-900/90 rounded-2xl border-2 border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 p-4 border-b border-gray-700">
          <MissionHeader 
            mission={mission}
            currentTime={currentTime}
            variant="compact"
          />
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-black/40 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Reward</div>
              <div className="text-xl font-bold text-yellow-400">{formatGoldAmount(mission.goldReward)}</div>
            </div>
            <div className="bg-black/40 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Experience</div>
              <div className="text-xl font-bold text-blue-400">+{mission.xpReward}</div>
            </div>
          </div>

          <SuccessRateMeter 
            successRate={successRate}
            targetRate={targetSuccessRate}
            variant="compact"
            className="mb-4"
          />

          <div className="grid grid-cols-3 gap-3 mb-4 max-w-xs mx-auto">
            {Array.from({ length: 6 }).map((_, i) => {
              const isLocked = i >= mission.mekSlots;
              const mek = selectedMeks[i];
              return (
                <div key={i} className="aspect-square">
                  <button
                    onClick={() => !isLocked && onMekSelect?.(mission.id, i)}
                    disabled={isLocked}
                    className={`
                      w-full h-full rounded-lg border-2 flex items-center justify-center transition-all
                      ${isLocked 
                        ? 'bg-gray-900/50 border-gray-800 cursor-not-allowed' 
                        : mek
                          ? 'bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-yellow-500/50 hover:border-yellow-400'
                          : 'bg-black/60 border-gray-600 hover:border-yellow-500/50 hover:bg-black/80'
                      }
                    `}
                  >
                    {isLocked ? (
                      <span className="text-gray-600 text-2xl">🔒</span>
                    ) : mek ? (
                      <div className="p-1">
                        <Image 
                          src={mek.image || "/variation-images/default.png"} 
                          alt={mek.name}
                          width={40}
                          height={40}
                          className="rounded"
                        />
                      </div>
                    ) : (
                      <span className="text-gray-400 text-3xl">+</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <DeploySection 
            mission={mission}
            onDeploy={onDeploy}
            disabled={selectedMeks.length === 0}
            variant="compact"
          />
        </div>
      </div>
    </div>
  );

  const renderIndustrialV3Grid = () => (
    <div className={`relative ${className}`}>
      <div className="bg-black/80 backdrop-blur-sm rounded-lg border border-gray-800 p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-yellow-400">
            {mission.isGlobal ? 'GLOBAL EVENT' : mission.name?.toUpperCase()}
          </h3>
          <span className="text-xs text-gray-400">
            {formatCountdown(mission.endTime)}
          </span>
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 bg-gray-900/50 rounded px-2 py-1">
            <span className="text-xs text-gray-400">Gold: </span>
            <span className="text-sm font-bold text-yellow-400">{formatGoldAmount(mission.goldReward)}</span>
          </div>
          <div className="bg-gray-900/50 rounded px-2 py-1">
            <span className="text-xs text-blue-300">+{mission.xpReward} XP</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1 mb-2">
          {Array.from({ length: 8 }).map((_, i) => {
            const isLocked = i >= mission.mekSlots;
            const mek = selectedMeks[i];
            return (
              <button
                key={i}
                onClick={() => !isLocked && onMekSelect?.(mission.id, i)}
                disabled={isLocked}
                className={`
                  aspect-square rounded border flex items-center justify-center transition-all
                  ${isLocked 
                    ? 'bg-gray-900/30 border-gray-800 cursor-not-allowed' 
                    : mek
                      ? 'bg-yellow-900/20 border-yellow-600/40'
                      : 'bg-black/40 border-gray-700 hover:border-yellow-600/40'
                  }
                `}
              >
                {isLocked ? '🔒' : mek ? '⚡' : '+'}
              </button>
            );
          })}
        </div>

        <button 
          onClick={onDeploy}
          disabled={selectedMeks.length === 0}
          className="w-full py-1.5 bg-green-600/80 hover:bg-green-500/80 disabled:bg-gray-700/50 text-white text-sm rounded transition-colors"
        >
          DEPLOY
        </button>
      </div>
    </div>
  );

  switch (variation) {
    case "industrial-v1":
      return renderIndustrialV1();
    case "industrial-v2":
      return renderIndustrialV2();
    case "industrial-v3-grid":
      return renderIndustrialV3Grid();
    default:
      return renderIndustrialV1();
  }
}