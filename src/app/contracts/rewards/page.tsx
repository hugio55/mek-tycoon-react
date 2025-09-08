"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import theme from "@/lib/design-system";

// Mission pyramid data structure
const missionPyramid = {
  tier4: {  // Boss tier at the top
    id: "apex",
    name: "APEX PROTOCOL",
    level: "LEGENDARY",
    difficulty: 95,
    goldReward: 50000,
    essenceReward: { type: "Legendary", amount: 10 },
    timeLimit: "48h",
    requiredMeks: 5,
    color: "from-purple-600 to-pink-600",
    borderColor: "border-purple-500",
    glowColor: "shadow-[0_0_30px_rgba(168,85,247,0.5)]",
    rewards: [
      { name: "Legendary Frame", amount: 1, dropChance: 100, icon: "🏆", rarity: "legendary" },
      { name: "Epic Power Core", amount: 3, dropChance: 75, icon: "💎", rarity: "epic" },
      { name: "Quantum Essence", amount: 5, dropChance: 50, icon: "✨", rarity: "rare" }
    ]
  },
  tier3: [
    {
      id: "elite-1",
      name: "ELITE STRIKE",
      level: "EPIC",
      difficulty: 80,
      goldReward: 25000,
      essenceReward: { type: "Epic", amount: 7 },
      timeLimit: "24h",
      requiredMeks: 4,
      color: "from-red-600 to-orange-600",
      borderColor: "border-red-500",
      glowColor: "shadow-[0_0_25px_rgba(239,68,68,0.4)]",
      rewards: [
        { name: "Epic Chip", amount: 2, dropChance: 90, icon: "💾", rarity: "epic" },
        { name: "Rare Alloy", amount: 5, dropChance: 60, icon: "⚙️", rarity: "rare" }
      ]
    },
    {
      id: "elite-2",
      name: "SHADOW OPS",
      level: "EPIC",
      difficulty: 75,
      goldReward: 22000,
      essenceReward: { type: "Epic", amount: 6 },
      timeLimit: "24h",
      requiredMeks: 4,
      color: "from-indigo-600 to-blue-600",
      borderColor: "border-indigo-500",
      glowColor: "shadow-[0_0_25px_rgba(99,102,241,0.4)]",
      rewards: [
        { name: "Stealth Module", amount: 1, dropChance: 85, icon: "🔮", rarity: "epic" },
        { name: "Shadow Essence", amount: 4, dropChance: 70, icon: "🌑", rarity: "rare" }
      ]
    }
  ],
  tier2: [
    {
      id: "advanced-1",
      name: "STORM ASSAULT",
      level: "RARE",
      difficulty: 60,
      goldReward: 12000,
      essenceReward: { type: "Rare", amount: 4 },
      timeLimit: "12h",
      requiredMeks: 3,
      color: "from-yellow-600 to-orange-500",
      borderColor: "border-yellow-500",
      glowColor: "shadow-[0_0_20px_rgba(250,182,23,0.4)]",
      rewards: [
        { name: "Storm Core", amount: 2, dropChance: 80, icon: "⚡", rarity: "rare" },
        { name: "Energy Cell", amount: 10, dropChance: 95, icon: "🔋", rarity: "uncommon" }
      ]
    },
    {
      id: "advanced-2",
      name: "CYBER RAID",
      level: "RARE",
      difficulty: 55,
      goldReward: 10000,
      essenceReward: { type: "Rare", amount: 3 },
      timeLimit: "12h",
      requiredMeks: 3,
      color: "from-cyan-600 to-teal-500",
      borderColor: "border-cyan-500",
      glowColor: "shadow-[0_0_20px_rgba(34,211,238,0.4)]",
      rewards: [
        { name: "Data Chip", amount: 3, dropChance: 90, icon: "💿", rarity: "rare" },
        { name: "Circuit Board", amount: 5, dropChance: 100, icon: "🔧", rarity: "common" }
      ]
    },
    {
      id: "advanced-3",
      name: "VOID HUNTER",
      level: "RARE",
      difficulty: 50,
      goldReward: 8000,
      essenceReward: { type: "Rare", amount: 3 },
      timeLimit: "12h",
      requiredMeks: 3,
      color: "from-purple-600 to-indigo-600",
      borderColor: "border-purple-500",
      glowColor: "shadow-[0_0_20px_rgba(147,51,234,0.4)]",
      rewards: [
        { name: "Void Shard", amount: 2, dropChance: 75, icon: "💜", rarity: "rare" },
        { name: "Dark Matter", amount: 1, dropChance: 50, icon: "⚫", rarity: "uncommon" }
      ]
    }
  ],
  tier1: [  // Common tier at the bottom
    {
      id: "standard-1",
      name: "PATROL DUTY",
      level: "COMMON",
      difficulty: 30,
      goldReward: 3000,
      essenceReward: { type: "Common", amount: 2 },
      timeLimit: "6h",
      requiredMeks: 2,
      color: "from-green-600 to-emerald-500",
      borderColor: "border-green-500",
      glowColor: "shadow-[0_0_15px_rgba(34,197,94,0.3)]",
      rewards: [
        { name: "Scrap Metal", amount: 15, dropChance: 100, icon: "⚙️", rarity: "common" },
        { name: "Basic Chip", amount: 2, dropChance: 80, icon: "💾", rarity: "common" }
      ]
    },
    {
      id: "standard-2",
      name: "RECON MISSION",
      level: "COMMON",
      difficulty: 25,
      goldReward: 2500,
      essenceReward: { type: "Common", amount: 1 },
      timeLimit: "6h",
      requiredMeks: 2,
      color: "from-blue-600 to-sky-500",
      borderColor: "border-blue-500",
      glowColor: "shadow-[0_0_15px_rgba(59,130,246,0.3)]",
      rewards: [
        { name: "Intel Data", amount: 5, dropChance: 95, icon: "📊", rarity: "common" },
        { name: "Map Fragment", amount: 1, dropChance: 70, icon: "🗺️", rarity: "common" }
      ]
    },
    {
      id: "standard-3",
      name: "SALVAGE RUN",
      level: "COMMON",
      difficulty: 20,
      goldReward: 2000,
      essenceReward: { type: "Common", amount: 1 },
      timeLimit: "6h",
      requiredMeks: 1,
      color: "from-gray-600 to-slate-500",
      borderColor: "border-gray-500",
      glowColor: "shadow-[0_0_15px_rgba(107,114,128,0.3)]",
      rewards: [
        { name: "Salvage", amount: 20, dropChance: 100, icon: "🔩", rarity: "common" },
        { name: "Old Parts", amount: 10, dropChance: 90, icon: "🔨", rarity: "common" }
      ]
    },
    {
      id: "standard-4",
      name: "TRAINING OP",
      level: "COMMON",
      difficulty: 15,
      goldReward: 1500,
      essenceReward: { type: "Common", amount: 1 },
      timeLimit: "6h",
      requiredMeks: 1,
      color: "from-amber-600 to-yellow-500",
      borderColor: "border-amber-500",
      glowColor: "shadow-[0_0_15px_rgba(245,158,11,0.3)]",
      rewards: [
        { name: "XP Token", amount: 3, dropChance: 100, icon: "⭐", rarity: "common" },
        { name: "Training Manual", amount: 1, dropChance: 60, icon: "📖", rarity: "common" }
      ]
    }
  ]
};

// Get rarity color classes
const getRarityColor = (rarity: string) => {
  switch(rarity) {
    case "legendary": return "text-purple-400";
    case "epic": return "text-red-400";
    case "rare": return "text-orange-400";
    case "uncommon": return "text-yellow-400";
    case "common": return "text-green-400";
    default: return "text-gray-400";
  }
};

export default function ContractRewardsPage() {
  const [selectedMission, setSelectedMission] = useState<any>(missionPyramid.tier4);
  const [hoveredMission, setHoveredMission] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [scanlinePosition, setScanlinePosition] = useState(0);

  // Update timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Animated scanline effect
  useEffect(() => {
    const scanTimer = setInterval(() => {
      setScanlinePosition((prev) => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(scanTimer);
  }, []);

  const formatTimeLimit = (time: string) => {
    return time.replace("h", " hours");
  };

  const MissionCard = ({ mission, tier, index = 0 }: { mission: any; tier: number; index?: number }) => {
    const isSelected = selectedMission?.id === mission.id;
    const isHovered = hoveredMission === mission.id;

    return (
      <div
        className={`
          relative cursor-pointer transition-all duration-300 transform
          ${tier === 4 ? 'col-span-full mx-auto max-w-md' : ''}
          ${tier === 3 ? 'max-w-sm' : ''}
          ${isSelected ? 'scale-105 z-20' : 'hover:scale-102'}
          ${isHovered ? 'z-10' : ''}
        `}
        style={{
          animation: `floatAnimation ${8 + index * 0.5}s ease-in-out infinite`,
          animationDelay: `${index * 0.2}s`
        }}
        onClick={() => setSelectedMission(mission)}
        onMouseEnter={() => setHoveredMission(mission.id)}
        onMouseLeave={() => setHoveredMission(null)}
      >
        {/* Industrial card with glass morphism */}
        <div className={`
          mek-card-industrial mek-border-sharp-gold
          relative overflow-hidden p-4
          ${isSelected ? mission.glowColor : ''}
          ${isHovered ? 'border-yellow-400' : ''}
        `}>
          {/* Hazard stripe header */}
          <div className="absolute top-0 left-0 right-0 h-2 mek-overlay-hazard-stripes opacity-50" />
          
          {/* Grunge overlay */}
          <div className="absolute inset-0 mek-overlay-scratches pointer-events-none" />
          
          {/* Level indicator */}
          <div className={`
            absolute top-2 right-2 px-2 py-1 
            text-xs font-bold uppercase tracking-wider
            bg-gradient-to-r ${mission.color} 
            ${tier === 4 ? 'animate-pulse' : ''}
          `}
          style={{ clipPath: theme.clipPaths.angledButton }}>
            {mission.level}
          </div>

          {/* Mission content */}
          <div className="relative z-10">
            <h3 className="text-lg font-orbitron font-bold uppercase tracking-wider text-yellow-400 mb-2">
              {mission.name}
            </h3>
            
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="mek-slot-empty p-2">
                <span className="mek-label-uppercase">Difficulty</span>
                <div className="relative mt-1 h-2 bg-black/60 overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
                    style={{ width: `${mission.difficulty}%` }}
                  />
                </div>
                <span className="text-yellow-400 font-bold">{mission.difficulty}%</span>
              </div>
              
              <div className="mek-slot-empty p-2">
                <span className="mek-label-uppercase">Gold</span>
                <div className="mek-value-primary text-sm">
                  {mission.goldReward.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Required Meks indicator */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex gap-1">
                {Array.from({ length: mission.requiredMeks }).map((_, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 border border-yellow-500/30 bg-black/40 rounded"
                    style={{
                      boxShadow: isSelected ? '0 0 10px rgba(250, 182, 23, 0.3)' : 'none'
                    }}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-400 uppercase tracking-wider">
                {mission.timeLimit}
              </span>
            </div>
          </div>

          {/* Selection indicator */}
          {isSelected && (
            <div className="absolute inset-0 border-2 border-yellow-400 pointer-events-none animate-pulse" />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" 
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(250, 182, 23, 0.1) 50px, rgba(250, 182, 23, 0.1) 51px),
              repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(250, 182, 23, 0.1) 50px, rgba(250, 182, 23, 0.1) 51px)
            `
          }}
        />
      </div>

      {/* Animated scanline */}
      <div 
        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-50 pointer-events-none"
        style={{ 
          top: `${scanlinePosition}%`,
          boxShadow: '0 0 20px rgba(250, 182, 23, 0.8)'
        }}
      />

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Page header */}
        <div className="mek-header-industrial mb-8 relative overflow-hidden">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-orbitron font-bold uppercase tracking-wider text-yellow-400">
                CONTRACT REWARDS
              </h1>
              <p className="text-gray-400 mt-1">Mission Pyramid Protocol v2.0</p>
            </div>
            <div className="text-right">
              <div className="mek-label-uppercase">System Status</div>
              <div className="text-green-400 font-bold uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                ONLINE
              </div>
            </div>
          </div>
          
          {/* Header decoration */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Mission Pyramid */}
          <div className="lg:col-span-2">
            <div className="mek-card-industrial mek-border-sharp-gold p-6 relative">
              <div className="absolute inset-0 mek-overlay-metal-texture opacity-10 pointer-events-none" />
              
              {/* Pyramid header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-orbitron font-bold uppercase tracking-wider text-yellow-400">
                  MISSION HIERARCHY
                </h2>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                  <span className="text-xs text-gray-400 uppercase tracking-wider">
                    {Object.keys(missionPyramid).reduce((acc, tier) => {
                      if (tier === 'tier4') return acc + 1;
                      return acc + (missionPyramid[tier as keyof typeof missionPyramid] as any[]).length;
                    }, 0)} Active Missions
                  </span>
                </div>
              </div>

              {/* Pyramid structure - Start at bottom, Boss at top */}
              <div className="space-y-6 flex flex-col-reverse">
                {/* Tier 1 - Common/Standard (Bottom - Starting point) */}
                <div>
                  <div className="text-center mb-3">
                    <span className="px-3 py-1 bg-green-500/20 border border-green-500/50 rounded text-green-400 text-xs font-bold uppercase tracking-wider">
                      ▼ START HERE ▼
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {missionPyramid.tier1.map((mission, index) => (
                      <MissionCard key={mission.id} mission={mission} tier={1} index={index + 5} />
                    ))}
                  </div>
                </div>

                {/* Tier 2 - Advanced (Second from bottom) */}
                <div>
                  <div className="text-center mb-2">
                    <span className="text-gray-500 text-xs uppercase tracking-wider">TIER 2 - ADVANCED</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {missionPyramid.tier2.map((mission, index) => (
                      <MissionCard key={mission.id} mission={mission} tier={2} index={index + 2} />
                    ))}
                  </div>
                </div>

                {/* Tier 3 - Elite (Second from top) */}
                <div>
                  <div className="text-center mb-2">
                    <span className="text-gray-500 text-xs uppercase tracking-wider">TIER 3 - ELITE</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                    {missionPyramid.tier3.map((mission, index) => (
                      <MissionCard key={mission.id} mission={mission} tier={3} index={index} />
                    ))}
                  </div>
                </div>

                {/* Tier 4 - Apex/Boss (Top - Final goal) */}
                <div>
                  <div className="text-center mb-3">
                    <span className="px-3 py-1 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-xs font-bold uppercase tracking-wider animate-pulse">
                      ▲ FINAL BOSS ▲
                    </span>
                  </div>
                  <div className="flex justify-center">
                    <MissionCard mission={missionPyramid.tier4} tier={4} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mission Details Panel */}
          <div className="lg:col-span-1">
            {selectedMission && (
              <div className="mek-card-industrial mek-border-sharp-gold p-6 sticky top-4">
                <div className="absolute inset-0 mek-overlay-glass pointer-events-none" />
                
                {/* Mission header */}
                <div className="relative mb-6">
                  <div className={`
                    absolute -inset-2 bg-gradient-to-r ${selectedMission.color} 
                    opacity-20 blur-xl
                  `} />
                  <div className="relative">
                    <div className="mek-label-uppercase mb-1">{selectedMission.level} MISSION</div>
                    <h2 className="text-2xl font-orbitron font-bold uppercase tracking-wider text-yellow-400">
                      {selectedMission.name}
                    </h2>
                  </div>
                </div>

                {/* Mission stats */}
                <div className="space-y-4 mb-6">
                  <div className="mek-slot-empty p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="mek-label-uppercase">Difficulty Rating</span>
                      <span className="text-yellow-400 font-bold">{selectedMission.difficulty}%</span>
                    </div>
                    <div className="relative h-3 bg-black/60 overflow-hidden rounded-full">
                      <div 
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full"
                        style={{ width: `${selectedMission.difficulty}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="mek-slot-empty p-3">
                      <div className="mek-label-uppercase mb-1">Gold Reward</div>
                      <div className="mek-value-primary text-lg">
                        {selectedMission.goldReward.toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="mek-slot-empty p-3">
                      <div className="mek-label-uppercase mb-1">Time Limit</div>
                      <div className="text-cyan-400 font-bold">
                        {formatTimeLimit(selectedMission.timeLimit)}
                      </div>
                    </div>
                  </div>

                  <div className="mek-slot-empty p-3">
                    <div className="mek-label-uppercase mb-2">Essence Reward</div>
                    <div className="flex items-center justify-between">
                      <span className={getRarityColor(selectedMission.essenceReward.type.toLowerCase())}>
                        {selectedMission.essenceReward.type}
                      </span>
                      <span className="text-yellow-400 font-bold">
                        x{selectedMission.essenceReward.amount}
                      </span>
                    </div>
                  </div>

                  <div className="mek-slot-empty p-3">
                    <div className="mek-label-uppercase mb-2">Required Meks</div>
                    <div className="flex gap-2">
                      {Array.from({ length: selectedMission.requiredMeks }).map((_, i) => (
                        <div
                          key={i}
                          className="w-10 h-10 border-2 border-yellow-500/50 bg-black/60 rounded-lg flex items-center justify-center"
                        >
                          <span className="text-yellow-400/50 text-xs">?</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Rewards section */}
                <div className="relative">
                  <div className="mek-header-industrial -mx-6 px-6 py-2 mb-4">
                    <h3 className="font-orbitron font-bold uppercase tracking-wider text-yellow-400">
                      MISSION REWARDS
                    </h3>
                  </div>
                  
                  <div className="space-y-2">
                    {selectedMission.rewards.map((reward: any, index: number) => (
                      <div
                        key={index}
                        className="mek-reward-slot-filled flex items-center justify-between"
                        style={{
                          animation: `slideInRight ${0.3 + index * 0.1}s ease-out`
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{reward.icon}</span>
                          <div>
                            <div className={`font-semibold ${getRarityColor(reward.rarity)}`}>
                              {reward.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              Amount: {reward.amount}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`
                            text-sm font-bold
                            ${reward.dropChance === 100 ? 'text-green-400' : 
                              reward.dropChance >= 75 ? 'text-yellow-400' : 
                              reward.dropChance >= 50 ? 'text-orange-400' : 'text-red-400'}
                          `}>
                            {reward.dropChance}%
                          </div>
                          <div className="text-xs text-gray-500">Drop Rate</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Launch button */}
                <button className="mek-button-primary w-full mt-6 text-lg">
                  LAUNCH MISSION
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes floatAnimation {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}