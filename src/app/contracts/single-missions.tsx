"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import MekRecruitmentModal from './components/MekRecruitmentModal';
import MekRecruitmentModalV1 from './components/MekRecruitmentModalV1';
import MekRecruitmentModalV2 from './components/MekRecruitmentModalV2';
import MekRecruitmentModalV3 from './components/MekRecruitmentModalV3';
import MekRecruitmentModalV4 from './components/MekRecruitmentModalV4';
import AnimatedSuccessBar from './components/AnimatedSuccessBar';
import StandardizedMissionRewards from './components/StandardizedMissionRewards';
import { successMultipliers, missionAilments, missionWeaknesses, globalMissionTypes, regularMissionTitles } from './constants/missionData';
import { formatGoldAmount, formatCountdown, getRewardColor, generateSampleMeks } from './utils/helpers';
import { getMekCardStyle, getTraitCircleStyle } from './utils/styleHelpers';

// Sample rewards with drop rates (sorted by chance)
const sampleRewardsWithRates = {
  global: [
    { id: 1, name: "Common Power Chip", amount: 2, dropChance: 75, type: "chip", icon: "💾" },
    { id: 2, name: "Bumblebee Essence", amount: 1.5, dropChance: 45, type: "essence", image: "/variation-images/bumblebee.png" },
    { id: 3, name: "Paul Essence", amount: 2, dropChance: 30, type: "essence", image: "/variation-images/paul.png" },
    { id: 4, name: "DMT Canister", amount: 1, dropChance: 15, type: "item", icon: "🧪" },
    { id: 5, name: "Rare Power Chip", amount: 1, dropChance: 8, type: "chip", icon: "💎" },
    { id: 6, name: "Legendary Frame", amount: 1, dropChance: 1, type: "frame", icon: "🏆" },
  ],
  regular: [
    { id: 1, name: "Chrome Essence", amount: 0.5, dropChance: 100, type: "essence", image: "/variation-images/chrome.png" },
    { id: 2, name: "Scrap Metal", amount: 15, dropChance: 95, type: "material", icon: "⚙️" },
    { id: 3, name: "Common Power Chip", amount: 1, dropChance: 60, type: "chip", icon: "💾" },
  ]
};

type ElegantVariation = 
  | "elegant-v1-clean"
  | "elegant-v2-minimal"
  | "elegant-v3-gradient"
  | "elegant-v4-flat"
  | "elegant-v5-asymmetric"

// Border style types
type BorderStyle = 
  | "rounded-gray"
  | "rounded-gold"
  | "sharp-gray"
  | "sharp-gold"
  | "rounded-thick-gray"
  | "rounded-thick-gold"
  | "sharp-double-gray"
  | "sharp-double-gold"
  | "rounded-gradient"
  | "sharp-neon"
  | "elegant-v6-compact"
  | "elegant-v7-horizontal"
  | "elegant-v8-cards"
  | "elegant-v9-modern"
  | "elegant-v10-premium"
  | "industrial-v1"
  | "industrial-v2"
  | "industrial-v3-grid"
  | "style-f-yellow";

export default function ContractsLayoutOption11() {
  const [selectedMeks, setSelectedMeks] = useState<Record<string, any[]>>({});
  const [dailyMeks, setDailyMeks] = useState<any[]>([]);
  const [elegantVariation, setElegantVariation] = useState<ElegantVariation>("industrial-v1");
  const [borderStyle, setBorderStyle] = useState<BorderStyle>("sharp-gold");
  const [stars, setStars] = useState<Array<{id: number, left: string, top: string, size: number, opacity: number, twinkle: boolean}>>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [hoveredAilment, setHoveredAilment] = useState<string | null>(null);
  const [showMekModal, setShowMekModal] = useState<string | null>(null);
  const [hoveredMekSlot, setHoveredMekSlot] = useState<string | null>(null);
  const [matchedBonuses, setMatchedBonuses] = useState<Record<string, string[]>>({});
  const [animatingSuccess, setAnimatingSuccess] = useState<Record<string, number>>({});
  const [animatedSuccessRate, setAnimatedSuccessRate] = useState<Record<string, number>>({});
  const [selectedMekSlot, setSelectedMekSlot] = useState<{ missionId: string; slotIndex: number } | null>(null);
  const [mekCardStyle, setMekCardStyle] = useState<number>(1);
  const [traitCircleStyle, setTraitCircleStyle] = useState<number>(1);
  const [hoveredMek, setHoveredMek] = useState<{ missionId: string; slotIndex: number } | null>(null);
  const [clickedMek, setClickedMek] = useState<{ missionId: string; slotIndex: number } | null>(null);
  const [mekSlotStyle, setMekSlotStyle] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [traitIndicatorStyle, setTraitIndicatorStyle] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10>(1);
  const [headerStyle, setHeaderStyle] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [mekModalStyle, setMekModalStyle] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [mekFrameStyle, setMekFrameStyle] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [contractExpiry, setContractExpiry] = useState(Date.now() + 2 * 60 * 60 * 1000 + 43 * 60 * 1000 + 21 * 1000); // 2h 43m 21s from now
  const [mekCount, setMekCount] = useState<3 | 10 | 40 | 100>(40);
  const [showOnlyMatched, setShowOnlyMatched] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeBuffFilters, setActiveBuffFilters] = useState<string[]>([]);
  const [selectedBuff, setSelectedBuff] = useState<any | null>(null);
  const [buffModalStyle, setBuffModalStyle] = useState<1 | 2 | 3 | 4 | 5>(1);
  const dailyVariation = "Acid";
  
  // Update timer every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle click outside to close tooltip
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (clickedMek) {
        const target = e.target as HTMLElement;
        if (!target.closest('.mek-tooltip') && !target.closest('.mek-slot')) {
          setClickedMek(null);
        }
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [clickedMek]);
  
  // Generate stars on mount
  useEffect(() => {
    const newStars = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: `${((i * 37) % 100)}%`,
      top: `${((i * 61) % 100)}%`,
      size: 1 + ((i * 13) % 20) / 10,
      opacity: 0.2 + ((i * 17) % 80) / 100,
      twinkle: i % 2 === 0
    }));
    setStars(newStars);
  }, []);

  const formatGoldAmount = (amount: number): string => {
    return amount.toLocaleString();
  };

  const formatCountdown = (endTime: number): string => {
    const remaining = Math.max(0, endTime - currentTime);
    const h = Math.floor(remaining / (1000 * 60 * 60));
    const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((remaining % (1000 * 60)) / 1000);
    if (remaining <= 0) return "Expired";
    return `${h}h ${m}m ${s}s`;
  };

  // Format contract expiry countdown
  const formatContractExpiry = (): string => {
    const remaining = Math.max(0, contractExpiry - currentTime);
    const h = Math.floor(remaining / (1000 * 60 * 60));
    const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((remaining % (1000 * 60)) / 1000);
    if (remaining <= 0) return "Contract Expired";
    return { label: "Contract Expires:", time: `${h}h ${m}m ${s}s` };
  };

  const calculateSuccessRate = (meks: any[], mekSlotCount: number, matchedWeaknesses: number): number => {
    const baseRate = (meks.length / mekSlotCount) * 70; // Max 70% from meks alone
    const weaknessBonus = matchedWeaknesses * 10; // +10% per matched weakness
    return Math.min(100, baseRate + weaknessBonus);
  };

  
  // Get border classes based on selected style
  const getBorderClasses = (style: BorderStyle) => {
    switch(style) {
      case "rounded-gray":
        return "rounded-xl border border-gray-700/50";
      case "rounded-gold":
        return "rounded-xl border-2 border-yellow-500/50";
      case "sharp-gray":
        return "border border-gray-700/50";
      case "sharp-gold":
        return "border-2 border-yellow-500/50";
      case "rounded-thick-gray":
        return "rounded-2xl border-4 border-gray-600/50";
      case "rounded-thick-gold":
        return "rounded-2xl border-4 border-yellow-500/40";
      case "sharp-double-gray":
        return "border-2 border-double border-gray-600/60";
      case "sharp-double-gold":
        return "border-2 border-double border-yellow-500/60";
      case "rounded-gradient":
        return "rounded-xl border-2 border-transparent bg-gradient-to-r from-yellow-500/30 via-orange-500/30 to-red-500/30 p-[2px]";
      case "sharp-neon":
        return "border-2 border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.3)]";
      default:
        return "rounded-xl border border-gray-700/50";
    }
  };

  // Handle mek selection from modal
  const handleMekSelection = (mek: any, matchedTraits: any[], hasMatch: boolean) => {
    if (!selectedMekSlot) return;
    
    const missionId = selectedMekSlot.missionId;
    const newMeks = [...(selectedMeks[missionId] || [])];
    
    // Ensure array is long enough
    while (newMeks.length <= selectedMekSlot.slotIndex) {
      newMeks.push(null);
    }
    
    // Store the selected mek with its matched traits info
    newMeks[selectedMekSlot.slotIndex] = {
      ...mek,
      matchedTraits,
      hasMatch
    };
    
    setSelectedMeks({
      ...selectedMeks,
      [missionId]: newMeks
    });
    
    // Calculate and animate new success rate
    const mekSlotCount = missionId === 'global' ? 6 : 2;
    const actualMekCount = newMeks.filter(m => m !== null && m !== undefined).length;
    const baseRate = (actualMekCount / mekSlotCount) * 70;
    const bonusRate = hasMatch ? 10 : 0; // Add bonus if this mek has matching traits
    const newSuccessRate = Math.min(100, baseRate + bonusRate);
    
    // Trigger success rate animation
    setAnimatingSuccess({
      ...animatingSuccess,
      [missionId]: newSuccessRate
    });
    
    // Store matched bonuses
    if (hasMatch && matchedTraits.length > 0) {
      const matchedIds = matchedTraits.map((t: any) => t.id);
      setMatchedBonuses({
        ...matchedBonuses,
        [missionId]: [...(matchedBonuses[missionId] || []), ...matchedIds]
      });
    }
    
    // Close modal
    setShowMekModal(null);
    setSelectedMekSlot(null);
  };

  const renderContract = (contract: any, isGlobal: boolean = false) => {
    const contractId = isGlobal ? 'global' : (contract?.id || 'default');
    const meks = isGlobal ? dailyMeks : (selectedMeks[contractId] || []);
    const mekSlotCount = isGlobal ? 6 : (contract?.mekSlots || 2);
    const goldReward = isGlobal ? 250000 : 3500;
    const xpReward = isGlobal ? 5000 : 250;
    const deployFee = isGlobal ? 50000 : 2000;
    const deployFeeType = isGlobal ? "gold" : (contract?.id && contract.id.charCodeAt(0) % 10 > 7) ? "essence" : "gold";
    const deployFeeEssence = { name: "Paul Essence", amount: 2 };
    const expiryHours = isGlobal ? 24 : 2;
    const missionEndTime = currentTime + (expiryHours * 60 * 60 * 1000); // Calculate end time from current time
    
    const missionRewards = isGlobal ? sampleRewardsWithRates.global : sampleRewardsWithRates.regular;
    
    // Random variation buffs for this mission - select random variations
    const missionMultipliers = isGlobal 
      ? successMultipliers.slice(0, 10) // Max 10 for global missions
      : successMultipliers.slice(0, 10); // Max 10 for regular missions too
    
    // Calculate matched bonuses
    const matched = matchedBonuses[contractId] || [];
    const bonusPercentage = matched.reduce((acc, id) => {
      const mult = successMultipliers.find(m => m.id === id);
      return acc + parseInt(mult?.bonus.replace('+', '').replace('%', '') || '0');
    }, 0);
    
    // Count actual meks (non-null entries)
    const actualMekCount = meks.filter((m: any) => m !== null && m !== undefined).length;
    const baseSuccessRate = (actualMekCount / mekSlotCount) * 70;
    const targetSuccessRate = Math.min(100, baseSuccessRate + bonusPercentage);
    const currentAnimatedRate = animatingSuccess[contractId] || targetSuccessRate;
    const successRate = Math.round(currentAnimatedRate);

    // Elegant V1: Clean Design
    if (elegantVariation === "elegant-v1-clean") {
      return (
        <div className="relative group">
          <div className={`relative ${isGlobal ? 'bg-gradient-to-br from-yellow-900/10 via-black/40 to-purple-900/10' : 'bg-gradient-to-br from-gray-900/30 to-black/50'} backdrop-blur-md rounded-xl border ${isGlobal ? 'border-yellow-500/20' : 'border-gray-700/20'} transition-all duration-300`}>
            
            {/* Clean Header */}
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-medium text-yellow-400">
                    {isGlobal ? `global ${dailyVariation.toLowerCase()} event` : contract?.name?.toLowerCase() || 'mining outpost'}
                  </h3>
                  <div className="text-xs text-gray-400 mt-1">
                    Expires: <span className="text-yellow-400">{formatCountdown(missionEndTime)}</span>
                  </div>
                </div>
                
                {/* Weaknesses */}
                <div className="flex gap-2">
                  {missionWeaknesses.map(weakness => (
                    <div 
                      key={weakness}
                      className="relative group/tooltip"
                      onMouseEnter={() => setHoveredAilment(weakness)}
                      onMouseLeave={() => setHoveredAilment(null)}
                    >
                      <div className={`w-10 h-10 rounded-lg bg-black/40 border ${matchedWeaknesses > 0 ? 'border-yellow-500/50 shadow-lg shadow-yellow-500/20' : 'border-gray-700/50'} flex items-center justify-center transition-all hover:scale-110`}>
                        <span className="text-lg">{missionAilments[weakness as keyof typeof missionAilments].icon}</span>
                      </div>
                      {hoveredAilment === weakness && (
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black/90 rounded-lg p-2 text-xs whitespace-nowrap z-50 border border-gray-700">
                          <div className="font-semibold text-yellow-400 mb-1">{missionAilments[weakness as keyof typeof missionAilments].name}</div>
                          <div className="text-gray-300">Counters: {missionAilments[weakness as keyof typeof missionAilments].counters.join(", ")}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Gold & XP Bar */}
              <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 rounded-lg p-3 flex items-center justify-between mb-3">
                <div>
                  <div className="text-2xl font-bold text-yellow-400">{formatGoldAmount(goldReward)} <span className="text-sm font-normal">Gold</span></div>
                  <div className="text-xs text-yellow-300/70">Primary Reward</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-blue-400">+{xpReward.toLocaleString()} <span className="text-blue-300">XP</span></div>
                  <div className="text-xs text-blue-300/70">Experience</div>
                </div>
              </div>

              {/* Success Rate Meter */}
              <AnimatedSuccessBar 
                successRate={successRate} 
                height="small"
                className="mb-3"
              />

              {/* Rewards List */}
              <StandardizedMissionRewards 
                rewards={missionRewards}
                variant="list"
                className="mb-3"
              />

              {/* Squad Grid */}
              <div className="grid grid-cols-6 gap-1.5 mb-3">
                {Array.from({ length: 6 }).map((_, i) => {
                  const isLocked = i >= mekSlotCount;
                  return (
                    <div key={i} className={`aspect-square ${isLocked ? 'bg-gray-900/30' : 'bg-gray-800/30'} rounded-lg border ${isLocked ? 'border-gray-800' : 'border-yellow-500/15'} flex items-center justify-center`}>
                      {isLocked ? '🔒' : '+'}
                    </div>
                  );
                })}
              </div>

              {/* Deploy Section */}
              <div className="flex gap-2">
                <div className="bg-red-900/20 rounded-lg px-4 py-2.5 border border-red-500/30">
                  <div className="text-[10px] text-red-300/70 uppercase">Fee</div>
                  <div className="text-sm font-medium text-red-400">
                    {deployFeeType === "essence" ? "Paul Essence: 2" : `${formatGoldAmount(deployFee)} Gold`}
                  </div>
                </div>
                <button className="flex-1 py-2.5 bg-gradient-to-r from-green-600/80 to-emerald-500/80 text-white rounded-lg font-medium text-sm">
                  DEPLOY SQUAD
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Elegant V2: Minimal Frames
    if (elegantVariation === "elegant-v2-minimal") {
      return (
        <div className="relative">
          <div className={`${isGlobal ? 'bg-gradient-to-b from-yellow-900/5 to-purple-900/5' : 'bg-gray-900/20'} backdrop-blur-sm rounded-xl p-4`}>
            
            {/* Minimal Header */}
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base text-yellow-400">{isGlobal ? `global ${dailyVariation.toLowerCase()}` : contract?.name?.toLowerCase() || 'station'}</h3>
                <div className="text-xs text-gray-500">Expires: {formatCountdown(missionEndTime)}</div>
              </div>
              <div className="flex gap-1">
                {missionWeaknesses.map(w => (
                  <span key={w} className="text-sm">{missionAilments[w as keyof typeof missionAilments].icon}</span>
                ))}
              </div>
            </div>

            {/* Flat Rewards Section */}
            <div className="bg-yellow-500/5 rounded-lg p-3 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xl font-bold text-yellow-400">{formatGoldAmount(goldReward)} <span className="text-sm font-normal">Gold</span></span>
                <span className="text-sm text-blue-400">+{xpReward.toLocaleString()} <span className="text-blue-300">XP</span></span>
              </div>
              <div className="text-xs text-gray-400 space-y-1">
                {missionRewards.slice(0, 3).map((r, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{r.name}</span>
                    <span className="text-yellow-400">{r.dropChance}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Success Bar */}
            <AnimatedSuccessBar 
              successRate={successRate} 
              height="small"
              showLabel={false}
              className="mb-3"
            />

            {/* Squad & Deploy */}
            <div className="flex items-center gap-3">
              <div className="flex gap-1 flex-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={`flex-1 aspect-square ${i >= mekSlotCount ? 'bg-black/20' : 'bg-black/40'} rounded border ${i >= mekSlotCount ? 'border-gray-800' : 'border-gray-700'}`} />
                ))}
              </div>
              <button className="px-6 py-2 bg-green-600/70 text-white rounded-lg text-sm">
                Deploy · {formatGoldAmount(deployFee)}
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Elegant V3: Gradient Focus
    if (elegantVariation === "elegant-v3-gradient") {
      const missionColor = isGlobal ? 'from-yellow-600/20 to-purple-600/20' : 'from-blue-600/20 to-green-600/20';
      return (
        <div className="relative">
          <div className={`bg-gradient-to-br ${missionColor} backdrop-blur-md rounded-xl border border-white/10 overflow-hidden`}>
            
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-black/40 to-transparent p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-light text-white">{isGlobal ? `global ${dailyVariation.toLowerCase()} event` : contract?.name?.toLowerCase() || 'salvage mission'}</h3>
                  <div className="text-xs text-white/60 mt-1">Expires: <span className="text-yellow-300">{formatCountdown(missionEndTime)}</span></div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-yellow-400">{(goldReward/1000).toFixed(0)}K</div>
                  <div className="text-xs text-blue-400">+{xpReward.toLocaleString()} <span className="text-blue-300">XP</span></div>
                </div>
              </div>
            </div>

            <div className="p-4">
              {/* Weaknesses Row */}
              <div className="flex items-center gap-4 mb-4">
                <span className="text-xs text-white/50 uppercase">Ailments:</span>
                <div className="flex gap-2">
                  {missionWeaknesses.map(w => (
                    <div key={w} className="px-3 py-1 bg-black/30 rounded-full border border-white/20 flex items-center gap-1">
                      <span>{missionAilments[w as keyof typeof missionAilments].icon}</span>
                      <span className="text-xs text-white/70">{missionAilments[w as keyof typeof missionAilments].name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Success Meter Large */}
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-white/70">Success Rate</span>
                  <span className="text-lg font-bold text-green-400">{successRate}%</span>
                </div>
                <AnimatedSuccessBar 
                  successRate={successRate} 
                  height="medium"
                  showLabel={false}
                />
              </div>

              {/* Rewards Grid */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {missionRewards.slice(0, 6).map((r, i) => (
                  <div key={i} className="bg-black/30 rounded-lg p-2 text-center">
                    <div className="text-[10px] text-white/60">{r.name}</div>
                    <div className="text-sm font-bold text-yellow-400">{r.dropChance}%</div>
                  </div>
                ))}
              </div>

              {/* Squad & Action */}
              <div className="flex gap-2">
                <div className="flex gap-1 flex-1">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className={`flex-1 aspect-square ${i >= mekSlotCount ? 'bg-black/20' : 'bg-white/10'} rounded-lg`} />
                  ))}
                </div>
                <button className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-400 text-black font-bold rounded-lg">
                  DEPLOY
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Elegant V4: Flat Design
    if (elegantVariation === "elegant-v4-flat") {
      return (
        <div className={`${isGlobal ? 'bg-yellow-900/10' : 'bg-gray-900/10'} rounded-lg p-4`}>
          
          {/* Flat Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base text-gray-300">{isGlobal ? `global ${dailyVariation.toLowerCase()}` : contract?.name?.toLowerCase() || 'depot'}</h3>
            <div className="text-xs text-gray-500">
              {formatCountdown(missionEndTime)}
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Left: Rewards */}
            <div>
              <div className="text-2xl font-bold text-yellow-400 mb-1">{formatGoldAmount(goldReward)}</div>
              <div className="text-xs text-blue-400 mb-3">+{xpReward.toLocaleString()} <span className="text-blue-300">XP</span></div>
              <div className="space-y-1">
                {missionRewards.slice(0, 3).map((r, i) => (
                  <div key={i} className="text-xs text-gray-400">
                    {r.name} · {r.dropChance}%
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Weaknesses & Success */}
            <div>
              <div className="flex gap-2 mb-3">
                {missionWeaknesses.map(w => (
                  <span key={w} className="text-lg">{missionAilments[w as keyof typeof missionAilments].icon}</span>
                ))}
              </div>
              <AnimatedSuccessBar 
                successRate={successRate} 
                height="small"
                showLabel={false}
              />
              <div className="text-lg font-black text-green-400 mt-1 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]" style={{ fontFamily: "'Orbitron', monospace" }}>SUCCESS: {successRate}%</div>
            </div>
          </div>

          {/* Bottom Action */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1 flex-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`flex-1 h-8 ${i >= mekSlotCount ? 'bg-gray-800' : 'bg-gray-700'} rounded`} />
              ))}
            </div>
            <div className="text-xs text-red-400">Fee: {formatGoldAmount(deployFee)}</div>
            <button className="px-4 py-2 bg-green-600 text-white rounded text-sm">Deploy</button>
          </div>
        </div>
      );
    }

    // Elegant V5: Asymmetric Layout
    if (elegantVariation === "elegant-v5-asymmetric") {
      return (
        <div className="relative">
          <div className={`${isGlobal ? 'bg-gradient-to-br from-yellow-900/15 to-purple-900/15' : 'bg-gradient-to-br from-gray-900/30 to-black/40'} backdrop-blur-md rounded-2xl overflow-hidden`}>
            
            {/* Asymmetric Grid */}
            <div className="grid grid-cols-3">
              {/* Left: Large Reward Panel */}
              <div className="col-span-2 p-5 border-r border-white/10">
                <h3 className="text-lg font-light text-yellow-400 mb-2">
                  {isGlobal ? `global ${dailyVariation.toLowerCase()}` : contract?.name?.toLowerCase() || 'outpost'}
                </h3>
                <div className="text-xs text-gray-400 mb-4">Expires: {formatCountdown(missionEndTime)}</div>
                
                <div className="flex items-baseline gap-4 mb-4">
                  <div className="text-3xl font-light text-yellow-400">{formatGoldAmount(goldReward)}</div>
                  <div className="text-lg text-blue-400">+{xpReward.toLocaleString()} <span className="text-blue-300">XP</span></div>
                </div>

                {/* Rewards with percentages */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {missionRewards.slice(0, 4).map((r, i) => (
                    <div key={i} className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-2">
                      <span className="text-xs text-gray-300">{r.name}</span>
                      <span className={`text-xs font-bold ${r.dropChance > 50 ? 'text-green-400' : 'text-gray-400'}`}>{r.dropChance}%</span>
                    </div>
                  ))}
                </div>

                {/* Squad slots */}
                <div className="flex gap-1.5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className={`flex-1 aspect-square ${i >= mekSlotCount ? 'bg-black/20' : 'bg-black/40'} rounded-lg border ${i >= mekSlotCount ? 'border-gray-800' : 'border-yellow-500/10'}`} />
                  ))}
                </div>
              </div>

              {/* Right: Status Panel */}
              <div className="p-5 bg-black/30">
                {/* Weaknesses */}
                <div className="mb-6">
                  <div className="text-xs text-gray-500 uppercase mb-2">Ailments</div>
                  <div className="space-y-2">
                    {missionWeaknesses.map(w => (
                      <div key={w} className="flex items-center gap-2">
                        <span className="text-lg">{missionAilments[w as keyof typeof missionAilments].icon}</span>
                        <span className="text-xs text-gray-400">{missionAilments[w as keyof typeof missionAilments].name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Success Meter */}
                <div className="mb-6">
                  <div className="text-xs text-gray-500 uppercase mb-2">Success</div>
                  <div className="text-3xl font-black text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]" style={{ fontFamily: "'Orbitron', monospace" }}>{successRate}%</div>
                  <AnimatedSuccessBar 
                    successRate={successRate} 
                    height="small"
                    showLabel={false}
                    className="mt-2"
                  />
                </div>

                {/* Deploy Button */}
                <div>
                  <div className="text-xs text-red-400 mb-2">Fee: {formatGoldAmount(deployFee)} Gold</div>
                  <button className="w-full py-2.5 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-lg font-semibold text-sm">
                    DEPLOY
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Elegant V6: Compact Cards
    if (elegantVariation === "elegant-v6-compact") {
      return (
        <div className={`relative ${isGlobal ? 'ring-2 ring-yellow-500/30' : ''}`}>
          <div className="bg-black/60 backdrop-blur-sm rounded-xl p-3">
            
            {/* Compact Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h4 className="text-sm text-yellow-400">{isGlobal ? 'global' : contract?.name?.toLowerCase() || 'mission'}</h4>
                <div className="flex gap-1">
                  {missionWeaknesses.map(w => (
                    <span key={w} className="text-xs">{missionAilments[w as keyof typeof missionAilments].icon}</span>
                  ))}
                </div>
              </div>
              <div className="text-[10px] text-gray-500">{formatCountdown(missionEndTime)}</div>
            </div>

            {/* Inline Rewards */}
            <div className="flex items-center gap-3 bg-yellow-900/20 rounded-lg px-3 py-2 mb-2">
              <div className="text-lg font-bold text-yellow-400">{(goldReward/1000).toFixed(0)}K</div>
              <div className="text-xs text-blue-400">+{xpReward.toLocaleString()}</div>
              <div className="flex-1 text-right">
                <span className="text-xs text-green-400">{successRate}% success</span>
              </div>
            </div>

            {/* Mini Rewards */}
            <div className="flex gap-2 mb-2 overflow-x-auto">
              {missionRewards.slice(0, 4).map((r, i) => (
                <div key={i} className="bg-black/40 rounded px-2 py-1 flex-shrink-0">
                  <div className="text-[9px] text-gray-400">{r.name}</div>
                  <div className="text-[10px] text-yellow-400">{r.dropChance}%</div>
                </div>
              ))}
            </div>

            {/* Action Row */}
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5 flex-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={`flex-1 h-6 ${i >= mekSlotCount ? 'bg-gray-800' : 'bg-gray-700'} rounded-sm`} />
                ))}
              </div>
              <button className="px-3 py-1.5 bg-green-600/80 text-white rounded text-xs">
                Deploy
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Elegant V7: Horizontal Flow
    if (elegantVariation === "elegant-v7-horizontal") {
      return (
        <div className={`${isGlobal ? 'bg-gradient-to-r from-yellow-900/10 to-purple-900/10' : 'bg-gray-900/20'} rounded-xl`}>
          <div className="flex items-stretch">
            
            {/* Left: Title & Timer */}
            <div className="p-4 border-r border-white/10">
              <h3 className="text-base font-medium text-yellow-400 mb-1">
                {isGlobal ? `global ${dailyVariation.toLowerCase()}` : contract?.name?.toLowerCase() || 'station'}
              </h3>
              <div className="text-xs text-gray-400">Expires</div>
              <div className="text-sm text-yellow-300">{formatCountdown(missionEndTime)}</div>
            </div>

            {/* Center: Rewards & Success */}
            <div className="flex-1 p-4 border-r border-white/10">
              <div className="flex items-center gap-4 mb-2">
                <div>
                  <div className="text-xl font-bold text-yellow-400">{formatGoldAmount(goldReward)}</div>
                  <div className="text-xs text-blue-400">+{xpReward.toLocaleString()} <span className="text-blue-300">XP</span></div>
                </div>
                <div className="flex-1">
                  <AnimatedSuccessBar 
                    successRate={successRate} 
                    height="small"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                {missionRewards.slice(0, 3).map((r, i) => (
                  <div key={i} className="text-[10px] text-gray-400">
                    {r.name} ({r.dropChance}%)
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Weaknesses & Deploy */}
            <div className="p-4 flex items-center gap-3">
              <div className="flex flex-col gap-1">
                {missionWeaknesses.map(w => (
                  <span key={w} className="text-sm">{missionAilments[w as keyof typeof missionAilments].icon}</span>
                ))}
              </div>
              <button className="px-4 py-2 bg-green-600/80 text-white rounded-lg text-sm">
                Deploy<br/>
                <span className="text-[10px] opacity-70">{formatGoldAmount(deployFee)} Gold</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Elegant V8: Card Stack
    if (elegantVariation === "elegant-v8-cards") {
      return (
        <div className="relative">
          {/* Stacked Card Effect */}
          <div className="absolute inset-x-2 -top-1 h-2 bg-gray-800/30 rounded-t-xl" />
          <div className="absolute inset-x-1 -top-0.5 h-1 bg-gray-700/30 rounded-t-xl" />
          
          <div className={`relative ${isGlobal ? 'bg-gradient-to-br from-yellow-900/20 to-purple-900/20' : 'bg-gray-900/40'} backdrop-blur-md rounded-xl border border-white/10 p-4`}>
            
            {/* Header with Timer */}
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-base text-yellow-400">
                {isGlobal ? `global ${dailyVariation.toLowerCase()} event` : contract?.name?.toLowerCase() || 'research lab'}
              </h3>
              <div className="text-right">
                <div className="text-[10px] text-gray-500">Expires in</div>
                <div className="text-xs text-yellow-300">{formatCountdown(missionEndTime)}</div>
              </div>
            </div>

            {/* Main Reward Card */}
            <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 rounded-lg p-3 mb-3">
              <div className="flex justify-between items-center">
                <div className="text-2xl font-bold text-yellow-400">{formatGoldAmount(goldReward)}</div>
                <div className="text-base text-blue-400">+{xpReward.toLocaleString()} <span className="text-blue-300">XP</span></div>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {/* Weaknesses */}
              <div className="bg-black/30 rounded-lg p-2">
                <div className="text-[9px] text-gray-500 mb-1">AILMENTS</div>
                <div className="flex gap-1">
                  {missionWeaknesses.map(w => (
                    <span key={w} className="text-sm">{missionAilments[w as keyof typeof missionAilments].icon}</span>
                  ))}
                </div>
              </div>

              {/* Success */}
              <div className="bg-black/30 rounded-lg p-2">
                <div className="text-[9px] text-gray-500 mb-1">SUCCESS</div>
                <div className="text-base font-bold text-green-400">{successRate}%</div>
              </div>

              {/* Top Drop */}
              <div className="bg-black/30 rounded-lg p-2">
                <div className="text-[9px] text-gray-500 mb-1">TOP DROP</div>
                <div className="text-[10px] text-yellow-400">{missionRewards[0].name}</div>
              </div>
            </div>

            {/* Squad & Deploy */}
            <div className="flex items-center gap-2">
              <div className="flex gap-1 flex-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={`flex-1 h-7 ${i >= mekSlotCount ? 'bg-black/20' : 'bg-black/40'} rounded border ${i >= mekSlotCount ? 'border-gray-800' : 'border-gray-700'}`} />
                ))}
              </div>
              <button className="px-4 py-2 bg-green-600/80 text-white rounded-lg text-sm font-medium">
                Deploy
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Elegant V9: Modern Clean
    if (elegantVariation === "elegant-v9-modern") {
      return (
        <div className={`${isGlobal ? 'shadow-lg shadow-yellow-500/10' : ''}`}>
          <div className="bg-gradient-to-b from-gray-900/80 to-black/80 backdrop-blur-sm rounded-xl overflow-hidden">
            
            {/* Modern Header */}
            <div className="bg-black/40 px-4 py-3 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-base text-gray-200">
                    {isGlobal ? `global ${dailyVariation.toLowerCase()}` : contract?.name?.toLowerCase() || 'depot'}
                  </h3>
                  <div className="flex gap-1.5">
                    {missionWeaknesses.map(w => (
                      <div key={w} className="w-6 h-6 bg-black/50 rounded flex items-center justify-center">
                        <span className="text-xs">{missionAilments[w as keyof typeof missionAilments].icon}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-amber-400">⏱ {formatCountdown(missionEndTime)}</div>
              </div>
            </div>

            <div className="p-4">
              {/* Primary Stats */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-baseline gap-3">
                  <div className="text-2xl font-light text-yellow-400">{formatGoldAmount(goldReward)}</div>
                  <div className="text-sm text-blue-400">+{xpReward.toLocaleString()} <span className="text-blue-300">XP</span></div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]" style={{ fontFamily: "'Orbitron', monospace" }}>{successRate}%</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Success</div>
                </div>
              </div>

              {/* Clean Rewards List */}
              <div className="bg-black/30 rounded-lg p-3 mb-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {missionRewards.slice(0, 4).map((r, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{r.name}</span>
                      <span className="text-xs text-yellow-400">{r.dropChance}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Section */}
              <div className="flex items-center gap-3">
                <div className="grid grid-cols-6 gap-1 flex-1">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className={`aspect-square ${i >= mekSlotCount ? 'bg-gray-800/50' : 'bg-gray-700/50'} rounded`} />
                  ))}
                </div>
                <div>
                  <div className="text-[10px] text-red-400 text-right mb-1">Fee: {formatGoldAmount(deployFee)}</div>
                  <button className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium">
                    Deploy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Elegant V10: Premium Refined
    if (elegantVariation === "elegant-v10-premium") {
      return (
        <div className="relative group">
          {/* Glow Effect for Global */}
          {isGlobal && (
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-purple-500/20 blur-xl opacity-50" />
          )}
          
          <div className={`relative ${isGlobal ? 'bg-gradient-to-br from-yellow-900/25 via-black/70 to-purple-900/25' : 'bg-gradient-to-br from-gray-900/50 to-black/70'} backdrop-blur-xl rounded-2xl border ${isGlobal ? 'border-yellow-500/30' : 'border-gray-700/30'} overflow-hidden`}>
            
            {/* Premium Header */}
            <div className="relative bg-gradient-to-r from-black/60 to-black/40 p-5">
              <div className="absolute top-0 right-0 p-2">
                <div className="text-xs text-amber-400 font-medium">
                  {formatCountdown(missionEndTime)}
                </div>
              </div>
              
              <div className="pr-20">
                <h2 className="text-xl font-light tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">
                  {isGlobal ? `global ${dailyVariation.toLowerCase()} event` : contract?.name?.toLowerCase() || 'omega station'}
                </h2>
                <div className="text-sm text-gray-400 mt-1">
                  Expires in {formatCountdown(missionEndTime)}
                </div>
              </div>
            </div>

            <div className="p-5">
              {/* Premium Reward Display */}
              <div className="bg-gradient-to-r from-yellow-900/40 to-orange-900/40 rounded-xl p-4 mb-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl" />
                <div className="relative flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-light text-yellow-400 mb-1">
                      {formatGoldAmount(goldReward)} <span className="text-sm font-normal">Gold</span>
                    </div>
                    <div className="text-sm text-yellow-300/70">Primary Reward</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-medium text-blue-400">+{xpReward.toLocaleString()}</div>
                    <div className="text-sm text-blue-300/70">Experience</div>
                  </div>
                </div>
              </div>

              {/* Ailments & Success Grid */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Ailments */}
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Mission Ailments</div>
                  <div className="flex gap-2">
                    {missionWeaknesses.map(w => {
                      const ailment = missionAilments[w as keyof typeof missionAilments];
                      return (
                        <div key={w} className="relative group/ailment">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-gray-800/60 to-gray-900/60 border ${matchedWeaknesses > 0 ? 'border-yellow-500/40 shadow-lg shadow-yellow-500/20' : 'border-gray-700/40'} flex items-center justify-center transition-all hover:scale-110`}>
                            <span className="text-xl">{ailment.icon}</span>
                          </div>
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black/95 rounded-lg p-3 opacity-0 group-hover/ailment:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap border border-gray-700/50">
                            <div className="text-xs font-semibold text-yellow-400 mb-1">{ailment.name}</div>
                            <div className="text-[10px] text-gray-300">Counters: {ailment.counters.join(", ")}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Success Meter */}
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Success Chance</div>
                  <div className="text-4xl font-black text-green-400 mb-2 drop-shadow-[0_0_12px_rgba(34,197,94,0.9)]" style={{ fontFamily: "'Orbitron', monospace" }}>{successRate}%</div>
                  <AnimatedSuccessBar 
                    successRate={successRate} 
                    height="medium"
                    showLabel={false}
                  />
                </div>
              </div>

              {/* Premium Rewards List */}
              <div className="bg-black/40 rounded-xl p-4 mb-4">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Additional Rewards</div>
                <div className="space-y-2">
                  {missionRewards.map((reward, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-800/30 rounded-lg px-3 py-2 hover:bg-gray-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-900/60 rounded-lg flex items-center justify-center">
                          <Image src="/variation-images/angler.png" alt="" width={20} height={20} />
                        </div>
                        <div>
                          <div className="text-sm text-gray-200">{reward.name}</div>
                          {reward.amount && <div className="text-[10px] text-gray-500">Amount: {reward.amount}</div>}
                        </div>
                      </div>
                      <div className={`text-sm font-bold ${reward.dropChance === 100 ? 'text-green-400' : reward.dropChance > 50 ? 'text-yellow-400' : reward.dropChance > 10 ? 'text-gray-400' : 'text-purple-400'}`}>
                        {reward.dropChance}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Squad Grid */}
              <div className="grid grid-cols-6 gap-2 mb-4">
                {Array.from({ length: 6 }).map((_, i) => {
                  const isLocked = i >= mekSlotCount;
                  return (
                    <div key={i} className="aspect-square">
                      <div className={`w-full h-full ${isLocked ? 'bg-gradient-to-br from-gray-900/50 to-black/50' : 'bg-gradient-to-br from-gray-800/60 to-gray-900/60'} rounded-xl border ${isLocked ? 'border-gray-800' : 'border-yellow-500/20 hover:border-yellow-400/40'} flex flex-col items-center justify-center transition-all`}>
                        {isLocked ? (
                          <>
                            <span className="text-gray-700">🔒</span>
                            <span className="text-[8px] text-gray-700 mt-1">Locked</span>
                          </>
                        ) : (
                          <>
                            <span className="text-2xl text-gray-600 hover:text-yellow-500/60 transition-colors cursor-pointer">+</span>
                            <span className="text-[8px] text-gray-600">Empty</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Premium Action Bar */}
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-red-900/40 to-red-800/40 rounded-xl px-5 py-3 border border-red-500/40">
                  <div className="text-xs text-red-300/70 uppercase tracking-wider">Deployment Fee</div>
                  <div className="text-lg font-medium text-red-400 mt-0.5">
                    {deployFeeType === "essence" ? "Paul Essence: 2" : `${formatGoldAmount(deployFee)} Gold`}
                  </div>
                </div>
                <button className="flex-1 relative py-3 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-xl font-bold text-base uppercase tracking-wider overflow-hidden group/btn shadow-lg hover:shadow-green-500/30 transition-all">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-300 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                  <span className="relative">Deploy Squad</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Industrial V1: Locked in as default
    {
      // Epic mission titles
      const epicTitles: Record<string, string> = {
        "mining outpost": "EXCAVATION ALPHA-7",
        "trading station": "TRADE NEXUS OMEGA", 
        "research facility": "QUANTUM LAB SIGMA",
        "defense post": "FORTRESS DELTA-9"
      };
      
      const missionTitle = isGlobal 
        ? `GLOBAL ${dailyVariation.toUpperCase()} CRISIS`
        : epicTitles[contract?.name?.toLowerCase() || ""] || "OPERATION PHOENIX";
      
      const missionDuration = isGlobal ? "24 Hours" : "2 Hours";
      
      return (
        <div className="relative">
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
            
            {/* Header Layout Variations - All with Industrial Grunge Style */}
            {headerStyle === 1 && (
              /* Layout 1: Separate Cards (Current) */
              <>
                <div className="relative p-4 overflow-hidden" style={{
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
                  <h2 className="text-lg font-bold tracking-wider text-yellow-400 mb-1 leading-tight break-words max-w-[200px]" style={{ 
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: 'clamp(0.75rem, 2vw, 1.125rem)',
                    lineHeight: '1.1'
                  }}>
                    {isGlobal ? `${dailyVariation} Crisis` : missionTitle}
                  </h2>
                  <div className="text-xs text-gray-300 uppercase tracking-wider font-medium">
                    {isGlobal ? "Daily Global Contract" : "Standard Contract"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-gray-300 uppercase tracking-wider font-medium">Mission Duration</div>
                  <div className="text-xl font-bold text-yellow-400">{missionDuration}</div>
                  <div className="text-xs mt-1 font-medium whitespace-nowrap">
                    {(() => {
                      const expiry = formatContractExpiry();
                      return (
                        <>
                          <span className="text-orange-400/70">{expiry.label}</span>
                          <span className="text-orange-400 ml-1">{expiry.time}</span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
                </>
              )}
            
            {headerStyle === 2 && (
              /* Layout 2: Unified Banner - Header and Rewards Combined */
              <div className="relative p-4 overflow-hidden" style={{
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
                {/* Same grunge overlays */}
                <div className="absolute inset-0 pointer-events-none opacity-30" style={{
                  background: `linear-gradient(105deg, transparent 40%, rgba(0, 0, 0, 0.3) 41%, transparent 43%)`
                }} />
                
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h2 className="text-lg font-bold tracking-wider text-yellow-400 mb-1 leading-tight break-words max-w-[200px]" style={{ 
                      fontFamily: "'Orbitron', sans-serif",
                      fontSize: 'clamp(0.75rem, 2vw, 1.125rem)',
                      lineHeight: '1.1'
                    }}>
                      {isGlobal ? `${dailyVariation} Crisis` : missionTitle}
                    </h2>
                    <div className="text-xs text-gray-300 uppercase tracking-wider font-medium">
                      {isGlobal ? "Daily Global Contract" : "Standard Contract"}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 bg-black/40 rounded-lg px-4 py-2">
                    <div>
                      <div className="text-2xl font-bold text-yellow-400">{formatGoldAmount(goldReward)}</div>
                      <div className="text-[10px] text-gray-400 uppercase">Gold</div>
                    </div>
                    <div className="h-8 w-px bg-yellow-400/30" />
                    <div>
                      <div className="text-xl font-bold text-blue-400">+{xpReward.toLocaleString()}</div>
                      <div className="text-[10px] text-gray-400 uppercase">XP</div>
                    </div>
                    <div className="h-8 w-px bg-yellow-400/30" />
                    <div className="text-right">
                      <div className="text-sm font-bold text-yellow-400">{missionDuration}</div>
                      <div className="text-[10px] whitespace-nowrap">
                        {(() => {
                          const expiry = formatContractExpiry();
                          return (
                            <>
                              <span className="text-orange-400/70">{expiry.label}</span>
                              <span className="text-orange-400 ml-1">{expiry.time}</span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {headerStyle === 3 && (
              /* Layout 3: Compact Strip - Everything in One Line */
              <div className="relative px-5 py-3" style={{
                background: `
                  repeating-linear-gradient(
                    90deg,
                    rgba(0, 0, 0, 0.9),
                    rgba(0, 0, 0, 0.9) 20px,
                    rgba(250, 182, 23, 0.1) 20px,
                    rgba(250, 182, 23, 0.1) 40px
                  )
                `
              }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg font-bold text-yellow-400" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                      {isGlobal ? `${dailyVariation} Crisis` : missionTitle}
                    </h2>
                    <span className="text-xs text-gray-500">|</span>
                    <div className="text-xs text-gray-400 uppercase">
                      {isGlobal ? "Global" : "Standard"}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-400 text-lg font-bold">{formatGoldAmount(goldReward)}</span>
                      <span className="text-xs text-gray-500">GOLD</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400 text-lg font-bold">+{xpReward.toLocaleString()}</span>
                      <span className="text-xs text-gray-500">XP</span>
                    </div>
                    <div className="text-yellow-400 font-mono text-sm">{missionDuration}</div>
                    <div className="text-orange-400 text-xs">{formatContractExpiry()}</div>
                  </div>
                </div>
              </div>
            )}
            
            {headerStyle === 4 && (
              /* Layout 4: Split Layout - Left Title, Right Stats */
              <div className="relative flex" style={{
                background: `linear-gradient(to right, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.8))`
              }}>
                {/* Left Section - Title */}
                <div className="flex-1 p-4" style={{
                  background: `
                    repeating-linear-gradient(
                      45deg,
                      transparent,
                      transparent 10px,
                      rgba(250, 182, 23, 0.05) 10px,
                      rgba(250, 182, 23, 0.05) 20px
                    )
                  `
                }}>
                  <h2 className="text-lg font-bold text-yellow-400 leading-tight break-words max-w-[200px]" style={{ 
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: 'clamp(0.75rem, 2vw, 1.125rem)',
                    lineHeight: '1.1'
                  }}>
                    {isGlobal ? `${dailyVariation} Crisis` : missionTitle}
                  </h2>
                  <div className="text-xs text-gray-300 uppercase tracking-wider font-medium">
                    {isGlobal ? "Daily Global Contract" : "Standard Contract"}
                  </div>
                  <div className="text-sm mt-1 font-medium whitespace-nowrap">
                    {(() => {
                      const expiry = formatContractExpiry();
                      return (
                        <>
                          <span className="text-orange-400/70">{expiry.label}</span>
                          <span className="text-orange-400 ml-1">{expiry.time}</span>
                        </>
                      );
                    })()}
                  </div>
                </div>
                
                {/* Right Section - Rewards */}
                <div className="flex items-center bg-gradient-to-l from-yellow-900/30 to-transparent px-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-400">{(goldReward/1000).toFixed(0)}K</div>
                      <div className="text-[10px] text-gray-400">GOLD</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">+{xpReward.toLocaleString()}</div>
                      <div className="text-[10px] text-gray-400">EXP</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-white">{missionDuration}</div>
                      <div className="text-[10px] text-gray-400">TIME</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {headerStyle === 5 && (
              /* Layout 5: Integrated Bar - All Info in Gradient Bar */
              <div className="relative overflow-hidden">
                <div className="relative p-4" style={{
                  background: `
                    linear-gradient(90deg, 
                      rgba(0, 0, 0, 0.95) 0%,
                      rgba(250, 182, 23, 0.15) 30%,
                      rgba(250, 182, 23, 0.2) 50%,
                      rgba(139, 92, 246, 0.15) 70%,
                      rgba(0, 0, 0, 0.95) 100%)
                  `
                }}>
                  {/* Industrial texture overlay */}
                  <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0, 0, 0, 0.3) 2px, rgba(0, 0, 0, 0.3) 3px)`
                  }} />
                  
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div>
                        <h2 className="text-xl font-bold text-yellow-400" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                          {isGlobal ? `${dailyVariation} Crisis` : missionTitle}
                        </h2>
                        <div className="text-[10px] text-gray-400 uppercase">
                          {isGlobal ? "Daily Global" : "Standard"} • {formatContractExpiry()}
                        </div>
                      </div>
                      <div className="h-10 w-px bg-yellow-400/30" />
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <span className="text-2xl">💰</span>
                          <span className="text-xl font-bold text-yellow-400">{formatGoldAmount(goldReward)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-2xl">✨</span>
                          <span className="text-xl font-bold text-blue-400">+{xpReward.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-mono text-white">{missionDuration}</div>
                      <div className="text-[10px] text-gray-400 uppercase">Duration</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                      const isMatched = matched.includes(mult.id);
                      return (
                        <div key={mult.id} className="relative">
                          <div className="flex flex-col items-center">
                            <div 
                              onClick={() => setSelectedBuff(mult)}
                              className={`
                              relative w-[60px] h-[60px] rounded-full bg-black/60 border-2 overflow-hidden cursor-pointer
                              ${isMatched ? 'border-yellow-400 shadow-lg shadow-yellow-400/30' : 'border-gray-700'}
                              transition-all hover:scale-110
                            `}>
                              <Image
                                src={mult.image}
                                alt={mult.id}
                                fill
                                className="rounded-full object-cover"
                                sizes="60px"
                              />
                            </div>
                            <div className={`text-[9px] font-medium mt-1 ${isMatched ? 'text-white' : 'text-gray-400'} uppercase tracking-wider text-center`}>
                              {mult.name}
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

              {/* Mek Slots - Industrial Grid Locked In */}
              <div className="mb-4">
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 8 }).map((_, i) => {
                    const isLocked = i >= mekSlotCount;
                    const assignedMek = (selectedMeks[contractId] || [])[i];
                    const isHovered = hoveredMek?.missionId === contractId && hoveredMek?.slotIndex === i;
                    
                    return (
                      <div key={i} className="aspect-square relative mek-slot">
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isLocked) {
                              if (assignedMek) {
                                // Toggle clicked state for removal tooltip
                                if (clickedMek?.missionId === contractId && clickedMek?.slotIndex === i) {
                                  setClickedMek(null);
                                } else {
                                  setClickedMek({ missionId: contractId, slotIndex: i });
                                }
                              } else {
                                // Open modal to add mek
                                setSelectedMekSlot({ missionId: contractId, slotIndex: i });
                                setShowMekModal(contractId);
                              }
                            }
                          }}
                          onMouseEnter={() => {
                            if (assignedMek) {
                              setHoveredMek({ missionId: contractId, slotIndex: i });
                            }
                          }}
                          onMouseLeave={() => setHoveredMek(null)}
                          className={`
                            w-full h-full flex flex-col items-center justify-center transition-all relative
                            ${isLocked 
                              ? 'bg-black/80 opacity-30' 
                              : assignedMek
                                ? 'bg-gradient-to-br from-yellow-900/40 to-yellow-800/20'
                                : 'bg-gradient-to-br from-yellow-900/20 to-yellow-800/10 hover:shadow-lg hover:shadow-yellow-500/20 cursor-pointer'
                            }
                            border-2 ${isLocked ? 'border-gray-900' : assignedMek?.matchedTraits?.length > 0 ? 'border-yellow-400 shadow-[0_0_10px_rgba(250,182,23,0.5)]' : assignedMek ? 'border-white' : 'border-gray-700 hover:border-yellow-400'}
                          `}>
                          {!isLocked && (
                            assignedMek ? (
                              <div className="relative w-full h-full">
                                <Image
                                  src={assignedMek.image || `/mek-images/150px/mek${String(Math.floor(Math.random() * 1000) + 1).padStart(4, '0')}.png`}
                                  alt={assignedMek.name}
                                  fill
                                  className="object-cover"
                                />
                                {/* Remove the wrapping div and render indicators directly on image */}
                                {assignedMek.matchedTraits && assignedMek.matchedTraits.length > 0 && (
                                  <>
                                    {/* Trait Indicator Style 1: Corner Badge */}
                                    {traitIndicatorStyle === 1 && (
                                      <div className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded">
                                        +{assignedMek.matchedTraits.reduce((acc: number, trait: any) => acc + parseInt(trait.bonus.replace("%", "").replace("+", "")), 0)}%
                                      </div>
                                    )}
                                    {/* Style 2: Bottom Bar */}
                                    {traitIndicatorStyle === 2 && (
                                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-yellow-400 to-yellow-500 h-1.5" />
                                    )}
                                    {/* Style 3: Glow Ring */}
                                    {traitIndicatorStyle === 3 && (
                                      <div className="absolute inset-0 border-2 border-yellow-400 animate-pulse pointer-events-none overflow-hidden" />
                                    )}
                                    {/* Style 4: Star Icon */}
                                    {traitIndicatorStyle === 4 && (
                                      <div className="absolute -top-1.5 -right-1.5 text-yellow-400 text-lg drop-shadow-[0_0_4px_rgba(250,182,23,0.8)]">
                                        ⭐
                                      </div>
                                    )}
                                    {/* Style 5: Side Banner */}
                                    {traitIndicatorStyle === 5 && (
                                      <div className="absolute top-1 -right-1 bg-black/80 border border-yellow-400 text-yellow-400 text-[9px] font-bold px-1.5 py-0.5 rounded-l">
                                        +{assignedMek.matchedTraits.reduce((acc: number, trait: any) => acc + parseInt(trait.bonus.replace("%", "").replace("+", "")), 0)}%
                                      </div>
                                    )}
                                    {/* Style 6: Lightning Bolt */}
                                    {traitIndicatorStyle === 6 && (
                                      <div className="absolute -top-1 -right-1 text-yellow-400 text-base">
                                        ⚡
                                      </div>
                                    )}
                                    {/* Style 7: Corner Triangle */}
                                    {traitIndicatorStyle === 7 && (
                                      <div className="absolute top-0 right-0">
                                        <div className="w-0 h-0 border-t-[20px] border-t-yellow-400 border-l-[20px] border-l-transparent" />
                                      </div>
                                    )}
                                    {/* Style 8: Plus Symbol */}
                                    {traitIndicatorStyle === 8 && (
                                      <div className="absolute -top-2 -right-2 bg-black rounded-full p-0.5">
                                        <div className="text-yellow-400 font-bold text-sm">+</div>
                                      </div>
                                    )}
                                    {/* Style 9: Gradient Overlay */}
                                    {traitIndicatorStyle === 9 && (
                                      <div className="absolute inset-0 bg-gradient-to-t from-yellow-400/30 to-transparent pointer-events-none" />
                                    )}
                                    {/* Style 10: Text Only */}
                                    {traitIndicatorStyle === 10 && (
                                      <div className="absolute top-0.5 right-0.5 text-[8px] text-yellow-400 font-bold drop-shadow-[0_0_2px_rgba(0,0,0,1)]">
                                        {assignedMek.matchedTraits.reduce((acc: number, trait: any) => acc + parseInt(trait.bonus.replace("%", "").replace("+", "")), 0)}%
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
                        {clickedMek?.missionId === contractId && clickedMek?.slotIndex === i && assignedMek && (
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
                                  setSelectedMekSlot({ missionId: contractId, slotIndex: i });
                                  setShowMekModal(contractId);
                                }}
                                className="flex-1 px-2 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 rounded text-xs text-yellow-400 font-bold transition-all"
                              >
                                Change
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newMeks = [...(selectedMeks[contractId] || [])];
                                  newMeks[i] = null;
                                  setSelectedMeks({ ...selectedMeks, [contractId]: newMeks });
                                  // Trigger success rate animation
                                  setAnimatedSuccessRate({ ...animatedSuccessRate, [contractId]: calculateNewSuccessRate(contractId, newMeks) });
                                }}
                                className="flex-1 px-2 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded text-xs text-red-400 font-bold transition-all"
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
                  <span className={`text-lg font-bold transition-all duration-500 ${
                    (animatedSuccessRate[contractId] || successRate) >= 80 ? 'text-green-400' : 
                    (animatedSuccessRate[contractId] || successRate) >= 50 ? 'text-yellow-400' : 'text-orange-400'
                  }`}>
                    {animatedSuccessRate[contractId] || successRate}%
                  </span>
                </div>
                <AnimatedSuccessBar 
                  successRate={animatedSuccessRate[contractId] || successRate} 
                  height="medium"
                  showLabel={false}
                />
              </div>

              {/* Deploy Button */}
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-2">
                  Deployment Fee: <span className="text-yellow-400 font-bold">{formatGoldAmount(deployFee)} Gold</span>
                </div>
                <button className="px-12 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black rounded font-bold text-base uppercase tracking-wider transition-all shadow-lg hover:shadow-yellow-500/30">
                  DEPLOY
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Industrial V2: 2x3 Grid Layout
    if (elegantVariation === "industrial-v2") {
      const epicTitles: Record<string, string> = {
        "mining outpost": "DRILL SITE ECHO",
        "trading station": "MARKET STATION XI", 
        "research facility": "TECH LAB PRIME",
        "defense post": "SHIELD POINT ZETA"
      };
      
      const missionTitle = isGlobal 
        ? `${dailyVariation.toUpperCase()} GLOBAL EVENT`
        : epicTitles[contract?.name?.toLowerCase() || ""] || "STRIKE MISSION";
      
      const missionDuration = isGlobal ? "1 Day" : "2 Hours";
      
      return (
        <div className="relative">
          <div className={`relative ${isGlobal ? 'bg-gradient-to-b from-yellow-900/15 to-black/90' : 'bg-gradient-to-b from-gray-900/50 to-black/90'} backdrop-blur-md overflow-hidden ${getBorderClasses(borderStyle)}`}>
            
            {/* Header with diagonal stripes */}
            <div className="relative p-4 border-b-2 border-yellow-500/20" style={{
              background: `
                repeating-linear-gradient(
                  135deg,
                  rgba(250, 182, 23, 0.05),
                  rgba(250, 182, 23, 0.05) 2px,
                  rgba(0, 0, 0, 0.95) 2px,
                  rgba(0, 0, 0, 0.95) 20px
                )
              `
            }}>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black tracking-wide text-yellow-400">
                  {missionTitle}
                </h2>
                <div className="bg-black/60 rounded-lg px-3 py-2 border border-yellow-500/30">
                  <div className="text-[9px] text-gray-500 uppercase tracking-wider">Duration</div>
                  <div className="text-lg font-bold text-yellow-400">{missionDuration}</div>
                </div>
              </div>
            </div>

            <div className="p-5">
              {/* Compact Rewards Section */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-yellow-900/20 rounded-lg p-3 border border-yellow-500/30">
                  <div className="text-2xl font-bold text-yellow-400">{formatGoldAmount(goldReward)}</div>
                  <div className="text-xs text-yellow-300/60">Gold Reward</div>
                </div>
                <div className="bg-yellow-900/20 rounded-lg p-3 border border-yellow-500/30">
                  <div className="text-2xl font-bold text-yellow-300">+{xpReward.toLocaleString()}</div>
                  <div className="text-xs text-yellow-300/60">Experience</div>
                </div>
              </div>

              {/* Compact Rewards List */}
              <div className="bg-black/50 rounded-lg p-3 mb-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {missionRewards.slice(0, 4).map((reward, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{reward.name}</span>
                      <span className={`text-xs font-bold ${getRewardColor(reward.dropChance)}`}>
                        {reward.dropChance}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ailments Row */}
              <div className="flex gap-2 justify-center mb-4">
                {missionWeaknesses.map(w => {
                  const ailment = missionAilments[w as keyof typeof missionAilments];
                  return (
                    <div key={w} className="relative group/ailment">
                      <div className="w-12 h-12 rounded bg-black/60 border border-yellow-500/40 flex items-center justify-center">
                        <span className="text-xl">{ailment.icon}</span>
                      </div>
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black rounded p-2 opacity-0 group-hover/ailment:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap border border-yellow-500/30 text-xs">
                        <div className="font-bold text-yellow-400">{ailment.name}</div>
                        <div className="text-gray-300 text-[10px]">{ailment.counters.join(", ")}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 2x3 Mek Grid */}
              <div className="grid grid-cols-3 gap-3 mb-4 max-w-xs mx-auto">
                {Array.from({ length: 6 }).map((_, i) => {
                  const isLocked = i >= mekSlotCount;
                  return (
                    <div key={i} className="aspect-square">
                      <div className={`
                        w-full h-full rounded-lg border-2 flex items-center justify-center transition-all
                        ${isLocked 
                          ? 'bg-black/90 border-gray-900 opacity-20' 
                          : 'bg-gradient-to-br from-yellow-900/30 to-transparent border-yellow-500/50 hover:border-yellow-400 hover:shadow-lg hover:shadow-yellow-500/30 cursor-pointer'
                        }
                      `}>
                        {!isLocked && (
                          <span className="text-4xl text-yellow-500/50 hover:text-yellow-400 transition-colors">+</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Success Bar */}
              <div className="mb-4">
                <AnimatedSuccessBar 
                  successRate={successRate} 
                  height="medium"
                  showLabel={false}
                />
                <div className="text-center text-sm font-bold text-yellow-400 mt-1">{successRate}% Success Rate</div>
              </div>

              {/* Deploy Section */}
              <div className="bg-black/40 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">Fee: <span className="text-yellow-400 font-bold">{formatGoldAmount(deployFee)} Gold</span></div>
                </div>
                <button className="px-8 py-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg font-bold text-sm uppercase tracking-wider transition-all">
                  Deploy
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Industrial V3: Horizontal Grid Layout
    if (elegantVariation === "industrial-v3-grid") {
      const epicTitles: Record<string, string> = {
        "mining outpost": "CORE EXTRACTION",
        "trading station": "COMMERCE HUB ALPHA", 
        "research facility": "LAB COMPLEX 7",
        "defense post": "BASTION PROTOCOL"
      };
      
      const missionTitle = isGlobal 
        ? `CRITICAL: ${dailyVariation.toUpperCase()}`
        : epicTitles[contract?.name?.toLowerCase() || ""] || "TACTICAL OPERATION";
      
      return (
        <div className="relative">
          <div className={`relative bg-black/90 backdrop-blur-sm overflow-hidden ${getBorderClasses(borderStyle)}`}>
            
            {/* Minimal Industrial Header */}
            <div className="bg-gradient-to-r from-yellow-500/20 via-black to-yellow-500/20 p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-yellow-400">{missionTitle}</h2>
                  <div className="h-8 w-px bg-yellow-500/30" />
                  <div className="text-sm">
                    <span className="text-gray-500">Time: </span>
                    <span className="text-yellow-400 font-bold">{isGlobal ? "24h" : "2h"}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-yellow-400">{formatGoldAmount(goldReward)}</div>
                  <div className="text-xs text-blue-400/80">+{xpReward.toLocaleString()} <span className="text-blue-300">XP</span></div>
                </div>
              </div>
            </div>

            <div className="p-5">
              {/* Horizontal Layout */}
              <div className="flex gap-4">
                {/* Left: Rewards & Ailments */}
                <div className="flex-1">
                  <div className="bg-black/60 rounded-lg p-3 mb-3">
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Rewards</div>
                    {missionRewards.slice(0, 3).map((r, i) => (
                      <div key={i} className="flex justify-between items-center py-1">
                        <span className="text-sm text-gray-300">{r.name}</span>
                        <span className={`text-sm font-bold ${getRewardColor(r.dropChance)}`}>{r.dropChance}%</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    {missionWeaknesses.map(w => (
                      <div key={w} className="w-10 h-10 rounded bg-black/60 border border-yellow-500/40 flex items-center justify-center">
                        <span className="text-lg">{missionAilments[w as keyof typeof missionAilments].icon}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Mek Grid & Action */}
                <div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {Array.from({ length: 6 }).map((_, i) => {
                      const isLocked = i >= mekSlotCount;
                      return (
                        <div key={i} className={`
                          w-16 h-16 rounded-lg border-2 flex items-center justify-center
                          ${isLocked 
                            ? 'bg-black border-gray-900 opacity-10' 
                            : 'bg-yellow-900/20 border-yellow-500/40 hover:border-yellow-400 hover:bg-yellow-900/30 cursor-pointer'
                          }
                        `}>
                          {!isLocked && <span className="text-2xl text-yellow-500/50">+</span>}
                        </div>
                      );
                    })}
                  </div>
                  
                  <AnimatedSuccessBar 
                    successRate={successRate} 
                    height="small"
                    showLabel={false}
                    className="mb-2"
                  />
                  
                  <button className="w-full py-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg font-bold text-sm uppercase">
                    Deploy ({formatGoldAmount(deployFee)})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Style F: Yellow tinted glass (based on UI showcase Style F)
    if (elegantVariation === "style-f-yellow") {
      const epicTitles: Record<string, string> = {
        "mining outpost": "EXCAVATION SITE DELTA",
        "trading station": "COMMERCE NEXUS", 
        "research facility": "R&D COMPLEX",
        "defense post": "SECURITY OUTPOST"
      };
      
      const missionTitle = isGlobal 
        ? `${dailyVariation.toUpperCase()} GLOBAL ALERT`
        : epicTitles[contract?.name?.toLowerCase() || ""] || "TACTICAL MISSION";
      
      const missionDuration = isGlobal ? "24 Hours" : "2 Hours";
      
      return (
        <div className="relative">
          <div 
            className={`relative overflow-hidden ${getBorderClasses(borderStyle)}`}
            style={{
              background: isGlobal 
                ? 'rgba(250, 182, 23, 0.25)' // 25% yellow opacity for global
                : 'rgba(250, 182, 23, 0.15)', // 15% yellow opacity for regular
              backdropFilter: 'blur(8px)',
            }}
          >
            {/* Clean header without extra textures */}
            <div className="p-4 border-b border-yellow-500/20">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-yellow-400">
                    {missionTitle}
                  </h2>
                  <div className="text-xs text-gray-300 mt-1 font-medium">
                    {isGlobal ? "Priority Mission" : "Standard Contract"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">Duration</div>
                  <div className="text-lg font-bold text-yellow-400">{missionDuration}</div>
                </div>
              </div>
            </div>

            <div className="p-5">
              {/* Gold & XP Bar */}
              <div className="bg-black/30 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-yellow-400">
                      {formatGoldAmount(goldReward)} <span className="text-sm font-normal">Gold</span>
                    </div>
                    <div className="text-xs text-yellow-300/70">Primary Reward</div>
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-blue-400">+{xpReward.toLocaleString()} <span className="text-blue-300">XP</span></div>
                    <div className="text-xs text-blue-300/70">Experience</div>
                  </div>
                </div>
              </div>

              {/* Rewards Grid */}
              <div className="bg-black/20 rounded-lg p-3 mb-4">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Rewards</div>
                <div className="space-y-1.5">
                  {missionRewards.map((reward, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
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

              {/* Mission Ailments */}
              <div className="flex gap-2 justify-center mb-4">
                {missionWeaknesses.map(w => {
                  const ailment = missionAilments[w as keyof typeof missionAilments];
                  return (
                    <div key={w} className="relative group/ailment">
                      <div className="w-12 h-12 rounded-lg bg-black/40 border border-yellow-500/30 flex items-center justify-center hover:scale-110 transition-all">
                        <span className="text-xl">{ailment.icon}</span>
                      </div>
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black/90 rounded-lg p-2 opacity-0 group-hover/ailment:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap border border-yellow-500/20">
                        <div className="text-xs font-bold text-yellow-400">{ailment.name}</div>
                        <div className="text-[10px] text-gray-300">Counters: {ailment.counters.join(", ")}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mek Slots - Clean grid */}
              <div className="grid grid-cols-6 gap-2 mb-4">
                {Array.from({ length: 6 }).map((_, i) => {
                  const isLocked = i >= mekSlotCount;
                  return (
                    <div key={i} className="aspect-square">
                      <div className={`
                        w-full h-full rounded-lg border-2 flex items-center justify-center transition-all
                        ${isLocked 
                          ? 'bg-black/60 border-gray-800 opacity-20' 
                          : 'bg-yellow-900/20 border-yellow-500/30 hover:border-yellow-400/50 hover:bg-yellow-900/30 cursor-pointer'
                        }
                      `}>
                        {!isLocked && (
                          <span className="text-2xl text-yellow-500/40 hover:text-yellow-400/60">+</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Success Rate */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Success Rate</span>
                  <span className={`text-sm font-bold ${successRate >= 80 ? 'text-green-400' : successRate >= 50 ? 'text-yellow-400' : 'text-orange-400'}`}>
                    {successRate}%
                  </span>
                </div>
                <AnimatedSuccessBar 
                  successRate={successRate} 
                  height="small"
                  showLabel={false}
                />
              </div>

              {/* Deploy Section */}
              <div className="flex items-center gap-3">
                <div className="bg-black/30 rounded-lg px-4 py-2.5">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">Fee</div>
                  <div className="text-sm font-bold text-gray-300">
                    {deployFeeType === "essence" ? "2 Paul Essence" : `${formatGoldAmount(deployFee)} Gold`}
                  </div>
                </div>
                <button className="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg font-bold text-sm uppercase tracking-wider transition-all">
                  Deploy Meks
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };
  
  // Helper function to calculate new success rate with animation
  const calculateNewSuccessRate = (missionId: string, meks: any[]) => {
    const mekCount = meks.filter(m => m).length;
    const mekSlotCount = missionId === 'global' ? 6 : 3; // Average slot count
    const baseRate = (mekCount / mekSlotCount) * 70;
    
    // Calculate bonus from matched traits
    const bonusRate = meks.reduce((acc, mek) => {
      if (mek?.matchedTraits) {
        return acc + mek.matchedTraits.reduce((sum: number, trait: any) => 
          sum + parseInt(trait.bonus.replace("+", "").replace("%", "")), 0
        );
      }
      return acc;
    }, 0);
    
    return Math.min(100, Math.floor(baseRate + bonusRate));
  };
  
  // Helper function to calculate reward buff percentage
  const calculateRewardBuff = (meks: any[]) => {
    const totalBuff = meks.reduce((acc, mek) => {
      if (mek?.matchedTraits?.length > 0) {
        // Each matched trait gives 1-5% reward buff based on rarity
        const rarityBuff = mek.matchedTraits.reduce((sum: number, trait: any) => {
          const bonus = parseInt(trait.bonus.replace("+", "").replace("%", ""));
          return sum + Math.ceil(bonus / 5); // 5% = +1%, 10% = +2%, etc.
        }, 0);
        return acc + rarityBuff;
      }
      return acc;
    }, 0);
    return Math.min(25, totalBuff); // Cap at 25% max reward buff
  };
  
  // Animate success rate changes
  useEffect(() => {
    Object.keys(animatedSuccessRate).forEach(missionId => {
      const targetRate = animatedSuccessRate[missionId];
      const currentRate = animatingSuccess[missionId] || 0;
      
      if (currentRate !== targetRate) {
        const increment = targetRate > currentRate ? 1 : -1;
        const timer = setTimeout(() => {
          setAnimatingSuccess(prev => ({
            ...prev,
            [missionId]: currentRate + increment
          }));
        }, 10);
        return () => clearTimeout(timer);
      }
    });
  }, [animatedSuccessRate, animatingSuccess]);
  
  return (
    <div className="min-h-screen text-white overflow-x-hidden overflow-y-hidden relative">
      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-yellow-400">CONTRACTS SYSTEM</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4">
            </div>
          </div>
        </div>
        
        {/* Grid Layout */}
        <div className="grid grid-cols-2 gap-5">
          {/* Global Event */}
          {renderContract(null, true)}
          
          {/* Regular Contracts */}
          {[
            { id: 'c1', name: 'mining outpost delta', mekSlots: 3 },
            { id: 'c2', name: 'research lab seven', mekSlots: 2 },
            { id: 'c3', name: 'defense grid omega', mekSlots: 4 },
            { id: 'c4', name: 'trade depot alpha', mekSlots: 2 },
            { id: 'c5', name: 'salvage yard beta', mekSlots: 3 },
          ].map(contract => <div key={contract.id}>{renderContract(contract, false)}</div>)}
        </div>
      </div>
      
      {/* Mek Recruitment Modal - Locked to V4 */}
      <MekRecruitmentModalV4
        showMekModal={showMekModal}
        selectedMekSlot={selectedMekSlot}
        onClose={() => {
          setShowMekModal(null);
          setSelectedMekSlot(null);
        }}
        onMekSelection={handleMekSelection}
        mekCount={mekCount}
        mekCardStyle={mekCardStyle}
        traitCircleStyle={traitCircleStyle}
        mekFrameStyle={mekFrameStyle}
      />

      {/* Buff Details Modal */}
      {selectedBuff && (
        <div 
          className="fixed inset-0 bg-black/30 z-50 flex items-start justify-center pt-12 overflow-y-auto overflow-x-hidden transition-all duration-300"
          style={{ backdropFilter: 'blur(8px)' }}
          onClick={() => setSelectedBuff(null)}
        >
          {/* Style 1: Floating Circle */}
          {buffModalStyle === 1 && (
            <div className="relative modal-slideUp" onClick={(e) => e.stopPropagation()}>
              {/* Info Card Behind (z-index lower) - Card Style K */}
              <div className="absolute top-[40%] left-1/2 -translate-x-1/2 w-72">
                {/* Card Style K: Semi-translucent with glass effect */}
                <div className="relative bg-black/50 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                  
                  <div className="relative pt-64 px-6 pb-6">
                    {/* Variation Name at Top */}
                    <h2 className="text-2xl font-bold text-white text-center mb-3 uppercase tracking-wide">
                      {selectedBuff.name}
                    </h2>

                    {/* Stats - with conditional green color for ownership */}
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">Total copies:</span>
                        <span className="text-sm font-semibold text-white">4</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className={`text-sm ${2 > 0 ? 'text-green-400' : 'text-gray-300'}`}>You Own:</span>
                        <span className={`text-sm font-semibold ${2 > 0 ? 'text-green-400' : 'text-white'}`}>2</span>
                      </div>
                    </div>

                    {/* Success Rate Buff Section - Improved Layout */}
                    <div className="border-t border-white/20 pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="text-base font-semibold text-cyan-400 uppercase tracking-wider">
                          Success Rate Buff
                        </div>
                        <div className="text-5xl font-bold text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text -mt-2" style={{ fontFamily: 'Orbitron, monospace' }}>
                          10%
                        </div>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        If you deploy a Mek with this variation chip attached, you increase your success rate.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Large Stationary Image (z-index higher) - NO animation */}
              <div className="relative z-10 w-[420px] h-[420px] rounded-full overflow-hidden shadow-2xl">
                <Image
                  src={selectedBuff.image}
                  alt={selectedBuff.name}
                  fill
                  className="object-cover"
                  sizes="420px"
                  priority
                />
              </div>
            </div>
          )}

          {/* Style 2: Holographic */}
          {buffModalStyle === 2 && (
            <div className="relative modal-slideUp" onClick={(e) => e.stopPropagation()}>
              {/* Holographic Frame */}
              <div className="relative overflow-hidden rounded-full">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full blur-xl opacity-50 animate-pulse pointer-events-none" />
                <div className="relative w-72 h-72 rounded-full border-2 border-cyan-400/50 overflow-hidden">
                  <Image
                    src={selectedBuff.image}
                    alt={selectedBuff.name}
                    fill
                    className="object-cover"
                    sizes="288px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 via-transparent to-purple-400/20" />
                </div>
              </div>

              {/* Holographic Info Panel */}
              <div className="absolute top-[65%] left-1/2 -translate-x-1/2 w-80">
                <div className="bg-black/80 backdrop-blur-xl border border-cyan-400/30 rounded-2xl p-5 shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/20 via-purple-900/20 to-pink-900/20 rounded-2xl" />
                  <div className="relative">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent text-center mb-4">
                      {selectedBuff.name.toUpperCase()}
                    </h2>
                    <div className="flex justify-around mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">{selectedBuff.bonus}</div>
                        <div className="text-[10px] text-cyan-300 uppercase">Success</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400">243</div>
                        <div className="text-[10px] text-purple-300 uppercase">Copies</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-pink-400">4.2%</div>
                        <div className="text-[10px] text-pink-300 uppercase">Rarity</div>
                      </div>
                    </div>
                    <div className="text-xs text-cyan-200 text-center">
                      Equip to boost mission success rate
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Style 3: Card Stack */}
          {buffModalStyle === 3 && (
            <div className="relative modal-slideUp" onClick={(e) => e.stopPropagation()}>
              {/* Stacked Card Effect */}
              <div className="relative overflow-visible" style={{ padding: '1rem' }}>
                {/* Back cards - Contained within parent */}
                <div className="absolute left-0 top-4 w-64 h-64 rounded-2xl bg-gray-800/40 transform -rotate-6 origin-center" style={{ left: '-1rem' }} />
                <div className="absolute right-0 top-4 w-64 h-64 rounded-2xl bg-gray-700/40 transform rotate-6 origin-center" style={{ right: '-1rem' }} />
                
                {/* Main Image Card */}
                <div className="relative w-64 h-64 rounded-2xl overflow-hidden border-4 border-yellow-400/60 shadow-2xl">
                  <Image
                    src={selectedBuff.image}
                    alt={selectedBuff.name}
                    fill
                    className="object-cover"
                    sizes="256px"
                  />
                </div>
              </div>

              {/* Info Card Stack Below */}
              <div className="mt-8 relative">
                {/* Shadow cards */}
                <div className="absolute inset-x-4 -bottom-1 h-full bg-gray-800/30 rounded-xl" />
                <div className="absolute inset-x-2 -bottom-0.5 h-full bg-gray-700/30 rounded-xl" />
                
                {/* Main Info Card */}
                <div className="relative bg-gray-900/95 border-2 border-yellow-400/40 rounded-xl p-5 shadow-2xl">
                  <h2 className="text-2xl font-bold text-yellow-400 text-center mb-3 uppercase">
                    {selectedBuff.name}
                  </h2>
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-center flex-1">
                      <div className="text-xl font-bold text-green-400">{selectedBuff.bonus}</div>
                      <div className="text-[10px] text-gray-400 uppercase">Bonus</div>
                    </div>
                    <div className="w-px h-10 bg-gray-700" />
                    <div className="text-center flex-1">
                      <div className="text-xl font-bold text-purple-400">Rare</div>
                      <div className="text-[10px] text-gray-400 uppercase">Tier</div>
                    </div>
                    <div className="w-px h-10 bg-gray-700" />
                    <div className="text-center flex-1">
                      <div className="text-xl font-bold text-blue-400">243</div>
                      <div className="text-[10px] text-gray-400 uppercase">Total</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-300 text-center">
                    Stack multiple {selectedBuff.name} traits for increased bonuses
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Style 4: Split View */}
          {buffModalStyle === 4 && (
            <div className="relative max-w-3xl w-full modal-slideUp" onClick={(e) => e.stopPropagation()}>
              <div className="flex gap-6 items-center">
                {/* Left: Large Floating Image */}
                <div className="relative flex-shrink-0 overflow-hidden rounded-full">
                  <div className="w-80 h-80 rounded-full overflow-hidden border-4 border-gradient-to-r from-yellow-400 to-orange-400 shadow-2xl">
                    <Image
                      src={selectedBuff.image}
                      alt={selectedBuff.name}
                      fill
                      className="object-cover"
                      sizes="320px"
                    />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  </div>
                  {/* Decorative rings - Fixed to prevent overflow */}
                  <div className="absolute inset-0 rounded-full border-2 border-yellow-400/20 animate-ping pointer-events-none" style={{ animation: 'ping-contained 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
                  <div className="absolute inset-2 rounded-full border border-yellow-400/10 animate-pulse pointer-events-none" />
                </div>

                {/* Right: Info Panel */}
                <div className="flex-1 bg-gray-900/90 backdrop-blur-xl border border-yellow-400/30 rounded-2xl p-6 shadow-2xl">
                  <h2 className="text-3xl font-bold text-yellow-400 mb-2 uppercase tracking-wide">
                    {selectedBuff.name}
                  </h2>
                  <div className="text-sm text-gray-400 mb-4">Variation Enhancement</div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-black/40 rounded-lg">
                      <span className="text-gray-400 text-sm">Success Bonus</span>
                      <span className="text-2xl font-bold text-green-400">{selectedBuff.bonus}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-black/40 rounded-lg">
                      <span className="text-gray-400 text-sm">Rarity Percentage</span>
                      <span className="text-xl font-bold text-purple-400">4.2%</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-black/40 rounded-lg">
                      <span className="text-gray-400 text-sm">In Circulation</span>
                      <span className="text-xl font-bold text-blue-400">243 units</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
                    <p className="text-sm text-yellow-200">
                      Selecting a Mek with {selectedBuff.name} trait provides {selectedBuff.bonus} mission success bonus. Stack multiple for greater effect!
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Style 5: Minimal Float */}
          {buffModalStyle === 5 && (
            <div className="relative modal-slideUp" onClick={(e) => e.stopPropagation()}>
              {/* Large Minimal Image */}
              <div className="relative w-96 h-96 rounded-full overflow-hidden shadow-2xl">
                <Image
                  src={selectedBuff.image}
                  alt={selectedBuff.name}
                  fill
                  className="object-cover"
                  sizes="384px"
                />
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
              </div>

              {/* Minimal Info Bar */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-light text-white uppercase tracking-widest">
                    {selectedBuff.name}
                  </h2>
                  <div className="text-3xl font-bold text-green-400">{selectedBuff.bonus}</div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Rarity: <span className="text-purple-400 font-medium">4.2%</span></span>
                  <span className="text-gray-400">Copies: <span className="text-blue-400 font-medium">243</span></span>
                  <span className="text-gray-400">Type: <span className="text-yellow-400 font-medium">Trait Buff</span></span>
                </div>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}
