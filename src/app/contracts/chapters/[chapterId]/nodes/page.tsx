"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import theme from "@/lib/design-system";

interface Mission {
  id: string;
  tier: number;
  position: number;
  name: string;
  type: 'normal' | 'elite' | 'boss';
  description: string;
  requirements: string[];
  rewards: {
    gold: number;
    essence: number;
    powerChips: number;
    items?: Array<{
      name: string;
      rarity: 'common' | 'rare' | 'epic' | 'legendary';
      icon: string;
    }>;
  };
  successRate: number;
  duration: string;
  energy: number;
  unlocked: boolean;
  completed: boolean;
  mekSlots: number;
  ailments?: string[];
  weaknesses?: string[];
}

export default function ChapterNodesPage() {
  const router = useRouter();
  const params = useParams();
  const chapterId = params?.chapterId as string;
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [hoveredMission, setHoveredMission] = useState<string | null>(null);
  const [completedMissions, setCompletedMissions] = useState<Set<string>>(new Set());

  // Generate missions for pyramid layout (5 tiers)
  const generateMissions = (): Mission[] => {
    const missions: Mission[] = [];
    const tierConfigs = [
      { tier: 5, count: 1, type: 'boss' as const, baseGold: 50000, name: 'Final Boss' },
      { tier: 4, count: 2, type: 'elite' as const, baseGold: 20000, name: 'Elite' },
      { tier: 3, count: 3, type: 'elite' as const, baseGold: 10000, name: 'Elite' },
      { tier: 2, count: 4, type: 'normal' as const, baseGold: 5000, name: 'Mission' },
      { tier: 1, count: 5, type: 'normal' as const, baseGold: 2000, name: 'Mission' }
    ];

    tierConfigs.forEach(config => {
      for (let i = 0; i < config.count; i++) {
        const missionId = `t${config.tier}-m${i + 1}`;
        const isUnlocked = config.tier === 1 || (config.tier === 2 && completedMissions.size >= 3);
        
        missions.push({
          id: missionId,
          tier: config.tier,
          position: i,
          name: config.type === 'boss' ? 'Wren, The Corrupted' : `${config.name} ${config.tier}-${i + 1}`,
          type: config.type,
          description: config.type === 'boss' 
            ? 'Defeat the chapter boss to complete this storyline'
            : `Complete this ${config.type} mission to progress`,
          requirements: config.tier > 1 ? [`Complete ${config.tier - 1} missions from Tier ${config.tier - 1}`] : [],
          rewards: {
            gold: config.baseGold * (i + 1),
            essence: 10 * config.tier,
            powerChips: config.tier,
            items: config.type === 'boss' ? [
              { name: 'Legendary Core', rarity: 'legendary', icon: '💎' },
              { name: 'Epic Module', rarity: 'epic', icon: '🔷' }
            ] : config.type === 'elite' ? [
              { name: 'Rare Component', rarity: 'rare', icon: '🔵' }
            ] : []
          },
          successRate: 70 - (config.tier * 10),
          duration: config.type === 'boss' ? '1 hour' : config.type === 'elite' ? '30 min' : '15 min',
          energy: config.tier * 10,
          unlocked: isUnlocked,
          completed: completedMissions.has(missionId),
          mekSlots: config.tier,
          ailments: ['Burn', 'Freeze', 'Shock'].slice(0, config.tier - 2),
          weaknesses: ['Fire', 'Ice', 'Lightning'].slice(0, Math.floor(config.tier / 2))
        });
      }
    });

    return missions;
  };

  const [missions] = useState<Mission[]>(generateMissions());

  // Calculate pyramid positions
  const calculatePosition = (tier: number, position: number, tierCount: number) => {
    const pyramidWidth = 800;
    const tierHeight = 120;
    const nodeSize = 100;
    
    // Y position - tier 1 at bottom, tier 5 at top
    const y = (5 - tier) * tierHeight + 50;
    
    // X position - center the nodes for each tier
    const tierWidth = tierCount * (nodeSize + 20);
    const startX = (pyramidWidth - tierWidth) / 2;
    const x = startX + position * (nodeSize + 20) + 50;
    
    return { x, y };
  };

  const handleMissionClick = (mission: Mission) => {
    if (mission.unlocked) {
      setSelectedMission(mission);
    }
  };

  const handleStartMission = () => {
    if (selectedMission) {
      setCompletedMissions(prev => new Set([...prev, selectedMission.id]));
      // DON'T clear selectedMission - keep it selected to show in-progress state
      // setSelectedMission(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 20% 30%, rgba(250, 182, 23, 0.1) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 70%, rgba(250, 182, 23, 0.1) 0%, transparent 50%),
              linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.95) 100%)
            `,
          }}
        />
        <div className="absolute inset-0 mek-overlay-scratches opacity-20" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 h-screen flex">
        {/* Left Side - Mission Pyramid */}
        <div className="flex-1 p-8">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/contracts/chapters')}
              className="mek-button-secondary mb-4"
            >
              ← Back to Chapters
            </button>
            <h1 className="mek-text-industrial text-4xl mb-2">
              CHAPTER {chapterId} - MISSION PYRAMID
            </h1>
            <p className="text-gray-400">Complete missions from bottom to top to reach the final boss</p>
          </div>

          {/* Pyramid Container */}
          <div className="relative" style={{ height: '650px', width: '900px', margin: '0 auto' }}>
            {/* Connection Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
              {missions.map((mission, idx) => {
                if (mission.tier >= 5) return null;
                
                const tierMissions = missions.filter(m => m.tier === mission.tier);
                const nextTierMissions = missions.filter(m => m.tier === mission.tier + 1);
                const fromPos = calculatePosition(mission.tier, mission.position, tierMissions.length);
                
                return nextTierMissions.map((nextMission, nextIdx) => {
                  const toPos = calculatePosition(nextMission.tier, nextMission.position, nextTierMissions.length);
                  const isActive = mission.completed || mission.unlocked;
                  
                  return (
                    <line
                      key={`${mission.id}-${nextMission.id}`}
                      x1={fromPos.x}
                      y1={fromPos.y}
                      x2={toPos.x}
                      y2={toPos.y}
                      stroke={isActive ? '#fab617' : '#333'}
                      strokeWidth="2"
                      opacity={isActive ? 0.6 : 0.3}
                    />
                  );
                });
              })}
            </svg>

            {/* Mission Nodes */}
            {missions.map(mission => {
              const tierMissions = missions.filter(m => m.tier === mission.tier);
              const pos = calculatePosition(mission.tier, mission.position, tierMissions.length);
              const isHovered = hoveredMission === mission.id;
              const isSelected = selectedMission?.id === mission.id;
              
              return (
                <div
                  key={mission.id}
                  className={`absolute ${mission.unlocked ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                  style={{
                    left: `${pos.x - 50}px`,
                    top: `${pos.y - 50}px`,
                    zIndex: 10
                  }}
                  onMouseEnter={() => setHoveredMission(mission.id)}
                  onMouseLeave={() => setHoveredMission(null)}
                  onClick={() => handleMissionClick(mission)}
                >
                  {/* Mission Node */}
                  <div
                    className={`
                      relative transition-all duration-300
                      ${mission.unlocked ? 'transform hover:scale-110' : 'opacity-50 grayscale'}
                      ${isSelected ? 'scale-110' : ''}
                    `}
                    style={{
                      width: '100px',
                      height: '100px',
                    }}
                  >
                    {/* Node Background */}
                    <div
                      className={`
                        absolute inset-0 rounded-lg
                        ${mission.type === 'boss' ? 'mek-border-sharp-gold' : ''}
                        ${mission.type === 'elite' ? 'border-2 border-purple-500/50' : ''}
                        ${mission.type === 'normal' ? 'border border-gray-600/50' : ''}
                      `}
                      style={{
                        background: mission.type === 'boss'
                          ? 'linear-gradient(135deg, #8B0000 0%, #DC143C 100%)'
                          : mission.type === 'elite'
                          ? 'linear-gradient(135deg, #4B0082 0%, #8A2BE2 100%)'
                          : 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
                        boxShadow: isHovered || isSelected
                          ? mission.type === 'boss'
                            ? '0 0 30px rgba(250, 182, 23, 0.8)'
                            : '0 0 20px rgba(250, 182, 23, 0.4)'
                          : 'none'
                      }}
                    >
                      {/* Grunge overlay */}
                      <div className="absolute inset-0 mek-overlay-scratches opacity-30 rounded-lg" />
                      
                      {/* Node Content */}
                      <div className="relative h-full flex flex-col items-center justify-center p-2">
                        {/* Tier Badge */}
                        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-yellow-400 text-black text-xs font-bold flex items-center justify-center">
                          {mission.tier}
                        </div>
                        
                        {/* Icon */}
                        <div className="text-2xl mb-1">
                          {mission.type === 'boss' ? '👑' : mission.type === 'elite' ? '⚔️' : '🎯'}
                        </div>
                        
                        {/* Name */}
                        <div className="text-xs text-center font-bold text-white">
                          {mission.type === 'boss' ? 'BOSS' : `T${mission.tier}-${mission.position + 1}`}
                        </div>
                        
                        {/* Status */}
                        {mission.completed && (
                          <div className="text-green-400 text-xs mt-1">✓</div>
                        )}
                        {!mission.unlocked && (
                          <div className="text-gray-400 text-xs mt-1">🔒</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Hover Tooltip */}
                  {isHovered && !isSelected && (
                    <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-black/95 border border-yellow-400/50 rounded-lg p-3 min-w-[200px] z-50 pointer-events-none">
                      <h4 className="text-yellow-400 font-bold text-sm mb-1">{mission.name}</h4>
                      <p className="text-gray-400 text-xs mb-2">{mission.description}</p>
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Gold:</span>
                          <span className="text-yellow-400">{mission.rewards.gold.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Duration:</span>
                          <span className="text-white">{mission.duration}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Tier Labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between py-12">
              {[5, 4, 3, 2, 1].map(tier => (
                <div key={tier} className="text-yellow-400/50 text-sm font-bold">
                  TIER {tier}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side Panel - Mission Details */}
        <div className="w-[450px] h-full bg-gradient-to-b from-black/90 via-black/80 to-black/90 backdrop-blur-md border-l-2 border-yellow-500/50 overflow-hidden">
          {selectedMission ? (
            <div className="h-full flex flex-col">
              {/* Mission Header with Industrial Frame */}
              <div className="relative mek-header-industrial border-b-2 border-yellow-500/50">
                <div className="absolute inset-0 mek-overlay-hazard-stripes opacity-20" />
                <div className="absolute inset-0 mek-overlay-scratches" />
                <div className="relative z-10 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h2 className="mek-text-industrial text-2xl text-yellow-400 mek-text-shadow">
                        {selectedMission.name}
                      </h2>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`
                          px-3 py-1 rounded-sm font-bold text-xs uppercase tracking-wider
                          ${selectedMission.type === 'boss' ? 'bg-red-900/40 border border-red-500/50 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : ''}
                          ${selectedMission.type === 'elite' ? 'bg-purple-900/40 border border-purple-500/50 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.3)]' : ''}
                          ${selectedMission.type === 'normal' ? 'bg-gray-900/40 border border-gray-600/50 text-gray-400' : ''}
                        `}>
                          {selectedMission.type}
                        </span>
                        <span className="text-yellow-400 font-bold">TIER {selectedMission.tier}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedMission(null)}
                      className="w-10 h-10 flex items-center justify-center bg-black/60 border border-red-500/50 text-red-400 hover:bg-red-900/30 hover:border-red-400 transition-all"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>

              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
                {/* Mission Description with Glass Effect */}
                <div className="mek-card-industrial mek-border-sharp-gold relative overflow-hidden">
                  <div className="absolute inset-0 mek-overlay-glass" />
                  <div className="relative p-4">
                    <h3 className="mek-label-uppercase text-yellow-400 mb-3">MISSION BRIEFING</h3>
                    <p className="text-gray-300 leading-relaxed">{selectedMission.description}</p>
                  </div>
                </div>

                {/* Requirements with Hazard Pattern */}
                {selectedMission.requirements.length > 0 && (
                  <div className="mek-card-industrial border border-gray-700/50 relative overflow-hidden">
                    <div className="absolute inset-0 mek-overlay-diagonal-stripes opacity-10" />
                    <div className="relative p-4">
                      <h3 className="mek-label-uppercase text-yellow-400 mb-3">REQUIREMENTS</h3>
                      <ul className="space-y-2">
                        {selectedMission.requirements.map((req, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-yellow-400 mt-0.5">▸</span>
                            <span className="text-gray-300">{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Mission Stats Grid */}
                <div className="mek-card-industrial mek-border-sharp-gold relative overflow-hidden">
                  <div className="absolute inset-0 mek-overlay-metal-texture opacity-20" />
                  <div className="relative p-4">
                    <h3 className="mek-label-uppercase text-yellow-400 mb-4">OPERATIONAL PARAMETERS</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-black/40 border border-gray-800/50 p-3 mek-corner-cut">
                        <div className="mek-label-uppercase text-xs mb-1">Duration</div>
                        <div className="text-white font-bold">{selectedMission.duration}</div>
                      </div>
                      <div className="bg-black/40 border border-gray-800/50 p-3 mek-corner-cut">
                        <div className="mek-label-uppercase text-xs mb-1">Energy Cost</div>
                        <div className="text-cyan-400 font-bold">{selectedMission.energy}</div>
                      </div>
                      <div className="bg-black/40 border border-gray-800/50 p-3 mek-corner-cut">
                        <div className="mek-label-uppercase text-xs mb-1">Mek Slots</div>
                        <div className="text-yellow-400 font-bold">{selectedMission.mekSlots}</div>
                      </div>
                      <div className="bg-black/40 border border-gray-800/50 p-3 mek-corner-cut">
                        <div className="mek-label-uppercase text-xs mb-1">Success Rate</div>
                        <div className="relative">
                          <div className="mek-progress-container">
                            <div 
                              className="mek-progress-fill"
                              style={{ width: `${selectedMission.successRate}%` }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-sm font-bold text-white drop-shadow-lg">
                                {selectedMission.successRate}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Combat Modifiers with Industrial Style */}
                {(selectedMission.ailments?.length || selectedMission.weaknesses?.length) && (
                  <div className="mek-card-industrial border-2 border-orange-500/30 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-900/10 to-transparent" />
                    <div className="relative p-4">
                      <h3 className="mek-label-uppercase text-orange-400 mb-4">COMBAT MODIFIERS</h3>
                      
                      {selectedMission.ailments?.length > 0 && (
                        <div className="mb-4">
                          <div className="text-red-400 text-xs font-bold tracking-wider mb-2">▼ ENEMY AILMENTS</div>
                          <div className="flex flex-wrap gap-2">
                            {selectedMission.ailments.map(ailment => (
                              <span key={ailment} className="px-3 py-1.5 bg-red-900/30 border border-red-500/50 text-red-300 text-xs font-bold uppercase tracking-wider mek-corner-cut">
                                {ailment}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {selectedMission.weaknesses?.length > 0 && (
                        <div>
                          <div className="text-green-400 text-xs font-bold tracking-wider mb-2">▲ ENEMY WEAKNESSES</div>
                          <div className="flex flex-wrap gap-2">
                            {selectedMission.weaknesses.map(weakness => (
                              <span key={weakness} className="px-3 py-1.5 bg-green-900/30 border border-green-500/50 text-green-300 text-xs font-bold uppercase tracking-wider mek-corner-cut">
                                {weakness}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Rewards Section with Premium Feel */}
                <div className="mek-card-industrial-global mek-border-sharp-gold relative overflow-hidden">
                  <div className="absolute inset-0 mek-overlay-hazard-stripes opacity-10" />
                  <div className="absolute inset-0 mek-holographic opacity-30" />
                  <div className="relative p-4">
                    <h3 className="mek-label-uppercase text-yellow-400 mb-4 flex items-center gap-2">
                      MISSION REWARDS
                      <span className="text-xs text-gray-400">(GUARANTEED)</span>
                    </h3>
                    
                    {/* Base Rewards Grid */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-black/60 border border-yellow-500/30 p-3 text-center mek-corner-cut relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-yellow-900/20 to-transparent" />
                        <div className="relative">
                          <div className="mek-value-primary text-2xl">
                            {selectedMission.rewards.gold.toLocaleString()}
                          </div>
                          <div className="mek-label-uppercase text-xs mt-1">GOLD</div>
                        </div>
                      </div>
                      <div className="bg-black/60 border border-cyan-500/30 p-3 text-center mek-corner-cut relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-cyan-900/20 to-transparent" />
                        <div className="relative">
                          <div className="text-cyan-400 text-2xl font-bold">
                            {selectedMission.rewards.essence}
                          </div>
                          <div className="mek-label-uppercase text-xs mt-1">ESSENCE</div>
                        </div>
                      </div>
                      <div className="bg-black/60 border border-purple-500/30 p-3 text-center mek-corner-cut relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 to-transparent" />
                        <div className="relative">
                          <div className="text-purple-400 text-2xl font-bold">
                            {selectedMission.rewards.powerChips}
                          </div>
                          <div className="mek-label-uppercase text-xs mt-1">CHIPS</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Special Item Rewards */}
                    {selectedMission.rewards.items && selectedMission.rewards.items.length > 0 && (
                      <>
                        <div className="border-t border-yellow-500/30 my-4" />
                        <div className="mek-label-uppercase text-xs text-gray-400 mb-3">SPECIAL DROPS</div>
                        <div className="space-y-2">
                          {selectedMission.rewards.items.map((item, idx) => (
                            <div key={idx} className={`
                              relative overflow-hidden mek-corner-cut
                              ${item.rarity === 'legendary' ? 'bg-gradient-to-r from-orange-900/20 to-orange-800/10 border border-orange-500/50' : ''}
                              ${item.rarity === 'epic' ? 'bg-gradient-to-r from-purple-900/20 to-purple-800/10 border border-purple-500/50' : ''}
                              ${item.rarity === 'rare' ? 'bg-gradient-to-r from-blue-900/20 to-blue-800/10 border border-blue-500/50' : ''}
                              ${item.rarity === 'common' ? 'bg-gray-900/20 border border-gray-700/50' : ''}
                            `}>
                              <div className="relative p-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">{item.icon}</span>
                                  <div>
                                    <span className="font-bold">{item.name}</span>
                                    <div className={`
                                      text-xs uppercase tracking-wider mt-0.5
                                      ${item.rarity === 'legendary' ? 'text-orange-400 mek-reward-legendary' : ''}
                                      ${item.rarity === 'epic' ? 'text-purple-400 mek-reward-epic' : ''}
                                      ${item.rarity === 'rare' ? 'text-blue-400 mek-reward-rare' : ''}
                                      ${item.rarity === 'common' ? 'text-gray-400' : ''}
                                    `}>
                                      {item.rarity}
                                    </div>
                                  </div>
                                </div>
                                {item.rarity === 'legendary' && (
                                  <div className="text-xs text-orange-400 font-bold animate-pulse">
                                    ULTRA RARE
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button Area */}
              <div className="p-5 border-t-2 border-yellow-500/50 bg-gradient-to-t from-black to-black/80">
                <button
                  onClick={handleStartMission}
                  disabled={!selectedMission.unlocked || selectedMission.completed}
                  className={`
                    w-full py-4 font-bold text-lg uppercase tracking-wider transition-all relative overflow-hidden
                    ${selectedMission.unlocked && !selectedMission.completed
                      ? 'mek-button-primary mek-pulse'
                      : 'bg-gray-900/50 border-2 border-gray-700/50 text-gray-500 cursor-not-allowed'
                    }
                  `}
                >
                  <span className="relative z-10">
                    {selectedMission.completed 
                      ? '✓ MISSION COMPLETED'
                      : selectedMission.unlocked 
                      ? 'DEPLOY MEKS'
                      : '🔒 MISSION LOCKED'
                    }
                  </span>
                  {selectedMission.unlocked && !selectedMission.completed && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center relative">
              <div className="absolute inset-0 mek-overlay-diagonal-stripes opacity-5" />
              <div className="text-center relative z-10">
                <div className="text-6xl mb-4 opacity-20 animate-pulse">⚡</div>
                <h3 className="mek-text-industrial text-2xl text-gray-400 mb-3">NO MISSION SELECTED</h3>
                <p className="text-sm text-gray-500 px-8">
                  Select a mission node from the pyramid to view operational details
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}