"use client";

import Image from "next/image";
import AnimatedSuccessBar from "../../contracts/components/AnimatedSuccessBar";

interface IndustrialMissionCardProps {
  nodeData: {
    id: string;
    label: string;
    index?: number;
    storyNodeType?: 'normal' | 'event' | 'boss' | 'final_boss';
    completed?: boolean;
    available?: boolean;
    current?: boolean;
  } | null;
  onStartMission: () => void;
  simulateProgress?: () => void;
}

// Helper function to format gold amounts
const formatGoldAmount = (amount: number): string => {
  return amount.toLocaleString();
};

// Helper function to get reward color based on drop chance
const getRewardColor = (dropChance: number): string => {
  if (dropChance >= 90) return "text-green-400";
  if (dropChance >= 60) return "text-yellow-400";
  if (dropChance >= 30) return "text-orange-400";
  if (dropChance >= 10) return "text-purple-400";
  return "text-gray-400";
};

// Mission ailments with icons and descriptions
const missionAilments = {
  poison: { icon: "☠️", name: "Poison", counters: ["Antidote", "Immunity"] },
  fire: { icon: "🔥", name: "Fire", counters: ["Water", "Shield"] },
  ice: { icon: "❄️", name: "Ice", counters: ["Heat", "Warmth"] },
  electric: { icon: "⚡", name: "Electric", counters: ["Insulation", "Ground"] },
  psychic: { icon: "🧠", name: "Psychic", counters: ["Mental Shield", "Focus"] }
};

export default function IndustrialMissionCard({ nodeData, onStartMission, simulateProgress }: IndustrialMissionCardProps) {
  if (!nodeData) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <p>Select a node to view mission details</p>
      </div>
    );
  }

  // Calculate mission rewards based on node position and type
  const isGlobal = nodeData.storyNodeType === 'final_boss';
  const goldReward = isGlobal ? 250000 : (nodeData.index || 1) * (nodeData.storyNodeType === 'boss' ? 5000 : 1500);
  const xpReward = isGlobal ? 5000 : (nodeData.index || 1) * 100;
  const deployFee = isGlobal ? 50000 : Math.floor(goldReward * 0.2);
  const mekSlotCount = nodeData.storyNodeType === 'boss' || nodeData.storyNodeType === 'final_boss' ? 6 : 3;
  
  // Mission title based on type
  const missionTitle = nodeData.storyNodeType === 'final_boss' 
    ? "FINAL BOSS: OVERLORD"
    : nodeData.storyNodeType === 'boss'
    ? `BOSS: ${nodeData.label || 'GUARDIAN'}`
    : nodeData.storyNodeType === 'event'
    ? "MYSTERY EVENT"
    : `OPERATION: STAGE ${nodeData.index || 1}`;

  const missionDuration = isGlobal ? "24 Hours" : "2 Hours";
  
  // Calculate success rate (simulated for now)
  const baseSuccessRate = nodeData.completed ? 100 : nodeData.current ? 75 : nodeData.available ? 50 : 0;
  
  // Sample rewards with drop rates
  const missionRewards = nodeData.storyNodeType === 'boss' || nodeData.storyNodeType === 'final_boss' ? [
    { name: "Boss Essence", dropChance: 100, type: "essence" },
    { name: "Rare Power Chip", dropChance: 75, type: "chip" },
    { name: "Epic Frame", dropChance: 45, type: "frame" },
    { name: "Mystery Box", dropChance: 30, type: "item" },
    { name: "Legendary Core", dropChance: 8, type: "core" },
    { name: "Ultimate Token", dropChance: 1, type: "token" },
  ] : nodeData.storyNodeType === 'event' ? [
    { name: "Mystery Reward", dropChance: 100, type: "mystery" },
    { name: "Event Token", dropChance: 60, type: "token" },
    { name: "Choice Box", dropChance: 30, type: "item" },
  ] : [
    { name: "Chrome Essence", dropChance: 100, type: "essence" },
    { name: "Scrap Metal", dropChance: 95, type: "material" },
    { name: "Common Chip", dropChance: 60, type: "chip" },
  ];

  // Select random ailments for this mission
  const ailmentKeys = Object.keys(missionAilments) as Array<keyof typeof missionAilments>;
  const missionWeaknesses = nodeData.storyNodeType === 'boss' || nodeData.storyNodeType === 'final_boss'
    ? ailmentKeys.slice(0, 3)
    : ailmentKeys.slice(0, 2);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="relative">
        <div 
          className="relative overflow-hidden border-2 border-yellow-500/50"
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
          {/* Glass effect overlays */}
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
          
          {/* Header with hazard stripes */}
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
            {/* Grunge overlays */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-30"
              style={{
                background: `
                  linear-gradient(105deg, transparent 40%, rgba(0, 0, 0, 0.3) 41%, transparent 43%),
                  linear-gradient(85deg, transparent 65%, rgba(0, 0, 0, 0.2) 66%, transparent 67%),
                  linear-gradient(175deg, transparent 70%, rgba(0, 0, 0, 0.25) 71%, transparent 72%)
                `,
                mixBlendMode: 'multiply',
              }}
            />
            
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold tracking-wider text-yellow-400 mb-1" style={{ 
                  fontFamily: "'Orbitron', sans-serif"
                }}>
                  {missionTitle}
                </h2>
                <div className="text-xs text-gray-300 uppercase tracking-wider font-medium">
                  {nodeData.storyNodeType === 'event' ? "Mystery Event" : isGlobal ? "Final Challenge" : "Combat Mission"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-gray-300 uppercase tracking-wider font-medium">Stage</div>
                <div className="text-xl font-bold text-yellow-400">{nodeData.index || 1}</div>
                <div className="text-xs mt-1 font-medium">
                  {nodeData.completed ? (
                    <span className="text-green-400">Completed</span>
                  ) : nodeData.current ? (
                    <span className="text-blue-400 animate-pulse">Current</span>
                  ) : nodeData.available ? (
                    <span className="text-yellow-400">Available</span>
                  ) : (
                    <span className="text-gray-500">Locked</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-5">
            {/* Gold & XP Bar */}
            <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 rounded-lg p-4 mb-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative flex items-center justify-between">
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
                const ailment = missionAilments[w];
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

            {/* Mek Slots Grid */}
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
                <span className={`text-sm font-bold ${baseSuccessRate >= 80 ? 'text-green-400' : baseSuccessRate >= 50 ? 'text-yellow-400' : 'text-orange-400'}`}>
                  {baseSuccessRate}%
                </span>
              </div>
              <AnimatedSuccessBar 
                successRate={baseSuccessRate} 
                height="small"
                showLabel={false}
              />
            </div>

            {/* Deploy Section */}
            {(nodeData.available || nodeData.current) && !nodeData.completed ? (
              <div className="flex items-center gap-3">
                <div className="bg-black/30 rounded-lg px-4 py-2.5">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">Fee</div>
                  <div className="text-sm font-bold text-gray-300">
                    {formatGoldAmount(deployFee)} Gold
                  </div>
                </div>
                <button 
                  onClick={onStartMission}
                  className="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg font-bold text-sm uppercase tracking-wider transition-all"
                >
                  {nodeData.storyNodeType === 'event' ? 'Enter Event' :
                   nodeData.storyNodeType === 'boss' ? 'Challenge Boss' :
                   nodeData.storyNodeType === 'final_boss' ? 'Face Final Boss' :
                   'Deploy Meks'}
                </button>
              </div>
            ) : nodeData.completed ? (
              <div className="bg-green-900/20 rounded-lg p-3 border border-green-500/30">
                <div className="text-center">
                  <p className="text-sm font-bold text-green-400 mb-1">Mission Complete</p>
                  <div className="text-xs text-gray-400">
                    Rewards Collected: {formatGoldAmount(goldReward)} Gold | +{xpReward} XP
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-900/20 rounded-lg p-3 border border-gray-700/30">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-2">Complete previous stages to unlock</p>
                  {simulateProgress && (
                    <button 
                      onClick={simulateProgress}
                      className="px-3 py-1 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 text-xs rounded transition-all"
                    >
                      Debug: Simulate Progress
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}