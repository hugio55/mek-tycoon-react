"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import Image from "next/image";

// Contract duration configurations with proper scaling
const contractDurations = [
  { id: "5min", label: "5 Minutes", displayLabel: "5 MIN", duration: 5 * 60 * 1000, slots: 1, goldFee: 250, essenceReward: 1, goldReward: { min: 100, max: 500 } },
  { id: "1hour", label: "1 Hour", displayLabel: "1 HR", duration: 60 * 60 * 1000, slots: 2, goldFee: 1500, essenceReward: 2, goldReward: { min: 500, max: 3000 } },
  { id: "5hour", label: "5 Hours", displayLabel: "5 HRS", duration: 5 * 60 * 60 * 1000, slots: 3, goldFee: 7500, essenceReward: 4, goldReward: { min: 2500, max: 15000 } },
  { id: "10hour", label: "10 Hours", displayLabel: "10 HRS", duration: 10 * 60 * 60 * 1000, slots: 4, goldFee: 15000, essenceReward: 7, goldReward: { min: 5000, max: 35000 } },
  { id: "1day", label: "1 Day", displayLabel: "1 DAY", duration: 24 * 60 * 60 * 1000, slots: 5, goldFee: 40000, essenceReward: 12, goldReward: { min: 15000, max: 100000 } },
  { id: "3day", label: "3 Days", displayLabel: "3 DAYS", duration: 3 * 24 * 60 * 60 * 1000, slots: 7, goldFee: 150000, essenceReward: 25, goldReward: { min: 75000, max: 500000 } },
  { id: "5day", label: "5 Days", displayLabel: "5 DAYS", duration: 5 * 24 * 60 * 60 * 1000, slots: 10, goldFee: 300000, essenceReward: 40, goldReward: { min: 200000, max: 1500000 } },
];

// Mission types with icons
const missionTypes = [
  { id: "salvage", name: "Salvage", icon: "⚙️", color: "#4169E1" },
  { id: "rescue", name: "Rescue", icon: "🚑", color: "#FF69B4" },
  { id: "exploration", name: "Exploration", icon: "🔍", color: "#90EE90" },
  { id: "combat", name: "Combat", icon: "⚔️", color: "#FF4500" },
  { id: "diplomacy", name: "Diplomacy", icon: "🤝", color: "#FFD700" },
  { id: "stealth", name: "Stealth", icon: "🥷", color: "#8A2BE2" },
  { id: "engineering", name: "Engineering", icon: "🔧", color: "#00CED1" },
  { id: "science", name: "Science", icon: "🔬", color: "#32CD32" }
];

// Mission locations with descriptions
const missionLocations = [
  { name: "Abandoned Station Alpha-7", desc: "Derelict space station with valuable salvage" },
  { name: "Distress Beacon - Sector 9", desc: "Unknown origin, high risk/reward" },
  { name: "Derelict Cargo Freighter", desc: "Massive hauler with intact cargo bays" },
  { name: "Mining Colony Delta-3", desc: "Former mining operation, mineral rich" },
  { name: "Ghost Ship Nebula", desc: "Mysterious vessel in uncharted space" },
  { name: "Research Outpost Omega", desc: "Advanced tech laboratory ruins" },
  { name: "Crashed Colony Ship", desc: "Generation ship with preserved systems" },
  { name: "Ancient Alien Ruins", desc: "Pre-collapse civilization artifacts" },
  { name: "Pirate Stronghold", desc: "Heavily defended but lucrative target" },
  { name: "Temporal Anomaly Zone", desc: "Time-distorted region with unique rewards" }
];

// Essence types for distribution
const essenceTypes = [
  { id: "common", name: "Common", color: "#8B8B8B", rarity: 1, icon: "⬜" },
  { id: "uncommon", name: "Uncommon", color: "#4169E1", rarity: 3, icon: "🟦" },
  { id: "rare", name: "Rare", color: "#FF69B4", rarity: 5, icon: "🟪" },
  { id: "epic", name: "Epic", color: "#90EE90", rarity: 7, icon: "🟩" },
  { id: "legendary", name: "Legendary", color: "#FFD700", rarity: 10, icon: "🟨" },
];

interface Contract {
  id: string;
  location: typeof missionLocations[number];
  missionType: typeof missionTypes[number];
  duration: typeof contractDurations[number];
  assignedMeks: any[];
  startTime?: number;
  status: "available" | "active" | "completed";
}

interface SelectedMek {
  id: string;
  name: string;
  imageUrl?: string;
  stats?: {
    salvage?: number;
    combat?: number;
    stealth?: number;
    engineering?: number;
  };
  onMission?: boolean;
  missionEndTime?: number;
}

interface ActiveContract {
  id: string;
  missionName: string;
  mekCount: number;
  startTime: number;
  endTime: number;
  goldReward: number;
  essenceType: string;
}

export default function ContractsPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [activeContracts, setActiveContracts] = useState<ActiveContract[]>([]);
  const [selectedContract, setSelectedContract] = useState<string | null>(null);
  const [selectedMeks, setSelectedMeks] = useState<Record<string, SelectedMek[]>>({});
  const [showMekSelector, setShowMekSelector] = useState<{ contractId: string; slotIndex: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [animatingBias, setAnimatingBias] = useState<Record<string, number>>({});
  const [showCancelWarning, setShowCancelWarning] = useState<string | null>(null);
  const [selectedRendition, setSelectedRendition] = useState<number>(1);
  
  // Daily global mission state
  const [dailyVariation] = useState("Acid");
  const [dailyMeks, setDailyMeks] = useState<SelectedMek[]>([]);
  
  // Generate stars for background
  const stars = useMemo(() => [...Array(30)].map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() * 2 + 0.5,
    opacity: Math.random() * 0.8 + 0.2,
  })), []);
  
  const fineStars = useMemo(() => [...Array(50)].map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
  })), []);
  
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  
  useEffect(() => {
    const initUser = async () => {
      const user = await getOrCreateUser({ 
        walletAddress: "demo_wallet_123" 
      });
      if (user) {
        setUserId(user._id as Id<"users">);
      }
    };
    initUser();
  }, [getOrCreateUser]);
  
  // Initialize contracts
  useEffect(() => {
    const generatedContracts = contractDurations.map((duration, index) => ({
      id: `contract_${index}`,
      location: missionLocations[index % missionLocations.length],
      missionType: missionTypes[index % missionTypes.length],
      duration,
      assignedMeks: [],
      status: "available" as const
    }));
    setContracts(generatedContracts);
    
    // Mock some active contracts
    setActiveContracts([
      {
        id: "active_1",
        missionName: "Ghost Ship Nebula",
        mekCount: 3,
        startTime: Date.now() - 30 * 60 * 1000,
        endTime: Date.now() + 30 * 60 * 1000,
        goldReward: 5000,
        essenceType: "rare"
      }
    ]);
  }, []);
  
  // Mock user's Meks with mission status
  const userMeks = useMemo(() => [
    { id: "mek1", name: "Thunder Strike", imageUrl: "/mek-images/mek1.png", stats: { salvage: 21, combat: 15 } },
    { id: "mek2", name: "Shadow Runner", imageUrl: "/mek-images/mek2.png", stats: { stealth: 18, salvage: 12 }, onMission: true, missionEndTime: Date.now() + 2 * 60 * 60 * 1000 },
    { id: "mek3", name: "Tech Master", imageUrl: "/mek-images/mek3.png", stats: { engineering: 25, salvage: 8 } },
    { id: "mek4", name: "War Machine", imageUrl: "/mek-images/mek4.png", stats: { combat: 30, salvage: 5 } },
    { id: "mek5", name: "Scout Alpha", imageUrl: "/mek-images/mek5.png", stats: { exploration: 22, salvage: 10 } },
    { id: "mek6", name: "Acid Burn", imageUrl: "/mek-images/mek6.png", stats: { salvage: 15, combat: 12 }, hasAcid: true },
  ], []);
  
  // Calculate bias score for a contract
  const calculateBiasScore = (contractId: string) => {
    const meks = contractId === "daily" ? dailyMeks : (selectedMeks[contractId] || []);
    const baseScore = 150;
    let mekMultiplier = 1;
    
    if (contractId === "daily") {
      // Daily mission gets 2x boost for matching trait
      const hasAcidMek = meks.some((m: any) => m?.hasAcid);
      mekMultiplier = hasAcidMek ? 2 : 1;
    } else {
      mekMultiplier = 1 + (meks.length * 0.1);
    }
    
    // Add stat bonuses
    let statBonus = 0;
    meks.forEach(mek => {
      if (mek?.stats?.salvage) statBonus += mek.stats.salvage * 0.01;
    });
    
    return Math.round(baseScore * mekMultiplier * (1 + statBonus));
  };
  
  // Fixed gold distribution calculation
  const calculateGoldDistribution = (contract: Contract | null, biasScore: number) => {
    if (!contract) {
      // For daily mission
      return Array.from({ length: 10 }, (_, i) => {
        const value = 50000 + (i * 50000);
        const normalizedBias = Math.min(biasScore / 1000, 1);
        const skew = 1 - normalizedBias;
        const position = i / 9;
        const probability = Math.exp(-Math.pow((position - skew) * 3, 2)) * 100;
        return { value, probability: Math.max(2, probability) };
      });
    }
    
    const { min, max } = contract.duration.goldReward;
    const steps = 10;
    const distribution = [];
    
    for (let i = 0; i < steps; i++) {
      const value = min + ((max - min) / (steps - 1)) * i;
      const normalizedBias = Math.min(biasScore / 1000, 1);
      const skew = 1 - normalizedBias; // Lower bias favors left (lower rewards)
      const position = i / (steps - 1);
      const probability = Math.exp(-Math.pow((position - skew) * 3, 2)) * 100;
      distribution.push({ value, probability: Math.max(2, probability) });
    }
    
    return distribution;
  };
  
  // Calculate probabilities for essence distribution
  const calculateProbabilities = (biasScore: number) => {
    const sigma = 0.8;
    const maxBias = 1000;
    const sqrtProgress = Math.sqrt(Math.min(biasScore, maxBias) / maxBias);
    const bellCenter = sqrtProgress * 4;
    
    const probs = essenceTypes.map((_, index) => {
      const distance = index - bellCenter;
      const prob = Math.exp(-0.5 * Math.pow(distance / sigma, 2));
      return prob;
    });
    
    const total = probs.reduce((a, b) => a + b, 0);
    return probs.map(p => (p / total) * 100);
  };
  
  // Handle Mek selection
  const handleMekSelect = (mek: SelectedMek) => {
    if (!showMekSelector) return;
    
    const { contractId, slotIndex } = showMekSelector;
    
    if (contractId === "daily") {
      const newMeks = [...dailyMeks];
      newMeks[slotIndex] = mek;
      setDailyMeks(newMeks);
    } else {
      const currentMeks = selectedMeks[contractId] || [];
      const newMeks = [...currentMeks];
      newMeks[slotIndex] = mek;
      
      // Animate bias score change
      const oldBias = calculateBiasScore(contractId);
      setSelectedMeks({ ...selectedMeks, [contractId]: newMeks });
      
      setTimeout(() => {
        const newBias = calculateBiasScore(contractId);
        animateBiasChange(contractId, oldBias, newBias);
      }, 50);
    }
    
    setShowMekSelector(null);
    setSearchQuery("");
  };
  
  // Animate bias score counting up
  const animateBiasChange = (contractId: string, from: number, to: number) => {
    const duration = 1000;
    const steps = 30;
    const increment = (to - from) / steps;
    let current = from;
    let step = 0;
    
    const interval = setInterval(() => {
      step++;
      current += increment;
      setAnimatingBias(prev => ({ ...prev, [contractId]: Math.round(current) }));
      
      if (step >= steps) {
        clearInterval(interval);
        setAnimatingBias(prev => ({ ...prev, [contractId]: to }));
      }
    }, duration / steps);
  };
  
  // Format time remaining
  const formatTimeRemaining = (endTime: number) => {
    const remaining = endTime - Date.now();
    if (remaining <= 0) return "Complete!";
    
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };
  
  // Cancel contract
  const handleCancelContract = (contractId: string) => {
    setActiveContracts(prev => prev.filter(c => c.id !== contractId));
    setShowCancelWarning(null);
  };
  
  // Start mission
  const handleStartMission = (contractId: string) => {
    const meks = selectedMeks[contractId] || [];
    if (meks.length === 0) return;
    
    console.log(`Starting mission ${contractId} with ${meks.length} Meks`);
  };
  
  // Render bias graph bars
  const renderBiasGraph = (probabilities: number[], colors: string[]) => {
    const maxProb = Math.max(...probabilities);
    return probabilities.map((prob, index) => {
      const height = Math.max(15, (prob / maxProb) * 60);
      return { height, percentage: prob, color: colors[index] };
    });
  };
  
  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div 
          className="absolute left-0 top-0 w-full h-full"
          style={{
            background: `
              radial-gradient(ellipse at 10% 20%, rgba(250, 182, 23, 0.12) 0%, transparent 50%),
              radial-gradient(ellipse at 90% 80%, rgba(250, 182, 23, 0.12) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, rgba(250, 182, 23, 0.05) 0%, transparent 70%)
            `
          }}
        />
        
        {/* Fine stars */}
        {fineStars.map((star) => (
          <div
            key={`fine-${star.id}`}
            className="absolute rounded-full bg-white"
            style={{
              left: star.left,
              top: star.top,
              width: '1px',
              height: '1px',
              opacity: 0.6,
            }}
          />
        ))}
        
        {/* Stars */}
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              left: star.left,
              top: star.top,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
            }}
          />
        ))}
      </div>
      
      <div className="relative z-10 p-5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 tracking-wider uppercase mb-2">
              CONTRACTS
            </h1>
            <p className="text-gray-400 font-inter">
              Send your Meks on missions to earn gold and essence
            </p>
          </div>
          
          {/* Rendition Selector Dropdown */}
          <div className="mb-6 flex justify-end">
            <select
              value={selectedRendition}
              onChange={(e) => setSelectedRendition(Number(e.target.value))}
              className="px-4 py-2 bg-black/60 border border-yellow-500/40 rounded-lg text-yellow-400 focus:border-yellow-500 focus:outline-none"
            >
              <option value={1}>Rendition 1: Classic Mirror</option>
              <option value={2}>Rendition 2: Gradient Blend</option>
              <option value={3}>Rendition 3: Split View</option>
            </select>
          </div>
          
          {/* Active Contracts Section */}
          {activeContracts.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-yellow-400 mb-4">Active Contracts</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activeContracts.map(contract => (
                  <div key={contract.id} className="bg-black/40 backdrop-blur-md rounded-lg p-4 border border-green-500/30">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-green-400">{contract.missionName}</h3>
                        <p className="text-sm text-gray-400">{contract.mekCount} Meks deployed</p>
                      </div>
                      <button
                        onClick={() => setShowCancelWarning(contract.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="mb-2">
                      <div className="text-2xl font-bold text-yellow-400 font-mono">
                        {formatTimeRemaining(contract.endTime)}
                      </div>
                      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mt-1">
                        <div 
                          className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-1000"
                          style={{ width: `${((Date.now() - contract.startTime) / (contract.endTime - contract.startTime)) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      Rewards: {contract.goldReward.toLocaleString()} Gold • {contract.essenceType} Essence
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Daily Global Mission */}
          <div className="mb-8">
            <div className="bg-black/60 backdrop-blur-md rounded-xl border-2 border-yellow-500/60 shadow-2xl relative overflow-visible">
              {/* Coin Badge */}
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 z-20">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border-4 border-black flex items-center justify-center shadow-lg">
                  <span className="text-3xl font-bold text-black">⚗️</span>
                </div>
              </div>
              
              <div className="p-6 pt-12">
                <div className="text-center mb-4">
                  <h2 className="text-3xl font-bold text-yellow-400 mb-1">DAILY GLOBAL: {dailyVariation.toUpperCase()}</h2>
                  <p className="text-gray-400">
                    Meks with {dailyVariation} trait get <span className="text-green-400 font-bold">2x bias boost</span> • 
                    Chance to loot <span className="text-purple-400 font-bold">{dailyVariation} Power Chip</span>
                  </p>
                </div>
                
                <div className="grid grid-cols-3 gap-6 mb-4">
                  {/* Mission Info */}
                  <div className="space-y-3">
                    <div className="bg-black/40 rounded-lg p-3">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Duration</div>
                      <div className="text-2xl font-bold text-yellow-400">24 HOURS</div>
                    </div>
                    <div className="bg-black/40 rounded-lg p-3">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Entry Fee</div>
                      <div className="text-xl font-bold text-red-400">50,000 G</div>
                    </div>
                    <div className="bg-black/40 rounded-lg p-3">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Rarity Bias</div>
                      <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
                        {calculateBiasScore("daily")}
                      </div>
                    </div>
                  </div>
                  
                  {/* Mek Slots */}
                  <div className="flex flex-col justify-center">
                    <div className="text-sm text-gray-400 mb-2">Assigned Meks (5 slots)</div>
                    <div className="grid grid-cols-5 gap-2">
                      {Array.from({ length: 5 }).map((_, slotIndex) => {
                        const mek = dailyMeks[slotIndex];
                        return (
                          <button
                            key={slotIndex}
                            onClick={() => setShowMekSelector({ contractId: "daily", slotIndex })}
                            className="aspect-square bg-gray-800/50 border-2 border-gray-700 rounded-lg hover:border-yellow-500/50 transition-all flex items-center justify-center group"
                          >
                            {mek ? (
                              <div className="text-center p-1">
                                <div className="text-[10px] text-yellow-400 truncate">{mek.name}</div>
                                {mek.hasAcid && <div className="text-[8px] text-green-400">2x</div>}
                              </div>
                            ) : (
                              <span className="text-gray-600 text-3xl group-hover:text-yellow-500/50">+</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Rewards */}
                  <div className="space-y-3">
                    <div className="bg-black/40 rounded-lg p-3">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Gold Rewards</div>
                      <div className="flex items-end gap-1 h-12">
                        {calculateGoldDistribution(null, calculateBiasScore("daily")).map((item, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center justify-end">
                            {i % 3 === 0 && (
                              <div className="text-[8px] text-gray-500 mb-1">{item.probability.toFixed(0)}%</div>
                            )}
                            <div
                              className="w-full bg-gradient-to-t from-yellow-600/60 to-yellow-400 rounded-t"
                              style={{ height: `${Math.max(4, (item.probability / 10) * 40)}px` }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-black/40 rounded-lg p-3">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Power Chip Chance</div>
                      <div className="text-2xl font-bold text-purple-400">8.1%</div>
                    </div>
                  </div>
                </div>
                
                <button
                  disabled={dailyMeks.length === 0}
                  className={`w-full py-3 px-6 font-bold text-lg rounded-lg transition-all ${
                    dailyMeks.length > 0
                      ? "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black"
                      : "bg-gray-800 text-gray-600 cursor-not-allowed"
                  }`}
                  title={dailyMeks.length === 0 ? "You must slot Meks first" : ""}
                >
                  {dailyMeks.length === 0 ? "SLOT MEKS TO EMBARK" : "EMBARK"}
                </button>
              </div>
            </div>
          </div>
          
          {/* Regular Contracts - Full Width */}
          <div className="space-y-4">
            {contracts.map((contract) => {
              const biasScore = animatingBias[contract.id] || calculateBiasScore(contract.id);
              const essenceProbs = calculateProbabilities(biasScore);
              const essenceBars = renderBiasGraph(essenceProbs, essenceTypes.map(e => e.color));
              const goldDist = calculateGoldDistribution(contract, biasScore);
              const meks = selectedMeks[contract.id] || [];
              
              return (
                <div
                  key={contract.id}
                  className="bg-black/40 backdrop-blur-md rounded-xl border border-yellow-500/20 hover:border-yellow-500/40 transition-all"
                >
                  <div className="p-6">
                    <div className="grid grid-cols-4 gap-6">
                      {/* Mission Info Section */}
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">{contract.missionType.icon}</span>
                            <span className="text-sm text-gray-500 uppercase tracking-wider">{contract.missionType.name} Mission</span>
                          </div>
                          <h3 className="font-bold text-xl text-yellow-400">{contract.location.name}</h3>
                          <p className="text-sm text-gray-400 mt-1">{contract.location.desc}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-black/60 rounded-lg p-2">
                            <div className="text-[10px] text-gray-500 uppercase">Duration</div>
                            <div className="text-lg font-bold text-white">{contract.duration.displayLabel}</div>
                          </div>
                          <div className="bg-black/60 rounded-lg p-2">
                            <div className="text-[10px] text-gray-500 uppercase">Entry Fee</div>
                            <div className="text-lg font-bold text-red-400">{(contract.duration.goldFee / 1000).toFixed(0)}K</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Mek Slots Section */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Squad Assignment</span>
                          <div className="text-lg font-bold text-yellow-400">
                            Bias: <span className="text-2xl">{biasScore}</span>
                            {meks.length > 0 && (
                              <span className="text-sm text-green-400 ml-2">({(1 + meks.length * 0.1).toFixed(1)}x)</span>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                          {Array.from({ length: Math.min(10, contract.duration.slots) }).map((_, slotIndex) => {
                            const mek = meks[slotIndex];
                            return (
                              <button
                                key={slotIndex}
                                onClick={() => setShowMekSelector({ contractId: contract.id, slotIndex })}
                                className="aspect-square bg-gray-800/50 border-2 border-gray-700 rounded-lg hover:border-yellow-500/50 transition-all flex items-center justify-center group relative"
                              >
                                {mek ? (
                                  <div className="text-center p-1">
                                    <div className="text-[10px] text-yellow-400 truncate">{mek.name}</div>
                                    {mek.stats?.salvage && contract.missionType.id === "salvage" && (
                                      <div className="text-[8px] text-green-400">+{mek.stats.salvage}</div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-600 text-3xl group-hover:text-yellow-500/50">+</span>
                                )}
                                {slotIndex >= contract.duration.slots && (
                                  <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                                    <span className="text-gray-700 text-sm">🔒</span>
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                        {meks.some(m => m?.stats?.salvage) && contract.missionType.id === "salvage" && (
                          <div className="text-sm text-green-400">
                            Total Salvage Bonus: +{meks.reduce((acc, m) => acc + (m?.stats?.salvage || 0), 0)}
                          </div>
                        )}
                      </div>
                      
                      {/* Combined Rewards Section - Full Width Mirrored Graphs */}
                      <div className="col-span-2">
                        {selectedRendition === 1 && (
                          /* Rendition 1: Classic Mirror */
                          <div className="space-y-0">
                            {/* Gold Distribution - Top */}
                            <div className="bg-gradient-to-b from-black/60 to-black/20 rounded-t-xl p-4 border-t border-l border-r border-yellow-500/30">
                              <div className="text-sm text-gray-400 mb-2">Gold Reward Distribution</div>
                              <div className="flex items-end gap-1 h-20">
                                {goldDist.map((item, index) => {
                                  const height = Math.max(8, (item.probability / 15) * 80);
                                  return (
                                    <div key={index} className="flex-1 flex flex-col items-center justify-end">
                                      {(index === 0 || index === 4 || index === 9) && (
                                        <div className="text-[10px] text-yellow-400/70 mb-1">
                                          {item.probability.toFixed(0)}%
                                        </div>
                                      )}
                                      <div
                                        className="w-full bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-t-sm transition-all duration-500"
                                        style={{ height: `${height}px` }}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="flex justify-between text-[10px] text-gray-500 mt-2">
                                <span className="text-yellow-400">{(goldDist[0].value / 1000).toFixed(0)}K</span>
                                <span>Higher bias increases chance for better rewards →</span>
                                <span className="text-yellow-400">{(goldDist[9].value / 1000).toFixed(0)}K</span>
                              </div>
                            </div>
                            
                            {/* Divider Line */}
                            <div className="h-[1px] bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>
                            
                            {/* Essence Distribution - Bottom (Mirrored) */}
                            <div className="bg-gradient-to-t from-black/60 to-black/20 rounded-b-xl p-4 border-b border-l border-r border-purple-500/30">
                              <div className="flex items-start gap-2 h-20">
                                {essenceBars.map((bar, index) => (
                                  <div key={index} className="flex-1 flex flex-col items-center justify-start">
                                    <div
                                      className="w-full rounded-b-sm transition-all duration-500"
                                      style={{
                                        height: `${bar.height}px`,
                                        background: `linear-gradient(to bottom, ${bar.color}CC, ${bar.color}66)`,
                                        boxShadow: `0 0 15px ${bar.color}40`
                                      }}
                                    />
                                    <div className="text-[10px] mt-1" style={{ color: bar.color }}>
                                      {bar.percentage.toFixed(0)}%
                                    </div>
                                    <div className="text-[9px] mt-1 opacity-70" style={{ color: bar.color }}>
                                      {essenceTypes[index].name}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="text-sm text-gray-400 mt-2">
                                Essence Rarity Distribution ({contract.duration.essenceReward}x multiplier)
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {selectedRendition === 2 && (
                          /* Rendition 2: Gradient Blend */
                          <div className="relative">
                            <div className="bg-gradient-to-b from-black/80 via-black/40 to-black/80 rounded-xl p-4 border border-yellow-500/20">
                              {/* Gold Distribution - Top Half */}
                              <div className="pb-2">
                                <div className="text-sm text-yellow-400 mb-2">Gold Rewards ↑</div>
                                <div className="flex items-end gap-0.5 h-24">
                                  {goldDist.map((item, index) => {
                                    const height = Math.max(8, (item.probability / 15) * 90);
                                    return (
                                      <div key={index} className="flex-1 flex flex-col items-center justify-end">
                                        <div
                                          className="w-full rounded-t transition-all duration-500"
                                          style={{ 
                                            height: `${height}px`,
                                            background: `linear-gradient(to top, rgba(250, 182, 23, 0.8), rgba(250, 182, 23, 0.3))`
                                          }}
                                        />
                                        {index % 3 === 0 && (
                                          <div className="text-[8px] text-yellow-400/60 mt-1">
                                            {(item.value / 1000).toFixed(0)}K
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                              
                              {/* Center Gradient Transition */}
                              <div className="h-8 relative my-2">
                                <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/10 via-transparent to-purple-500/10"></div>
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs text-gray-500">
                                  Bias Score: <span className="text-yellow-400 font-bold">{biasScore}</span>
                                </div>
                              </div>
                              
                              {/* Essence Distribution - Bottom Half (Mirrored) */}
                              <div className="pt-2">
                                <div className="flex items-start gap-0.5 h-24">
                                  {essenceBars.map((bar, index) => (
                                    <div key={index} className="flex-1 flex flex-col items-center justify-start">
                                      {index === 2 && (
                                        <div className="text-[8px] mb-1" style={{ color: bar.color }}>
                                          {essenceTypes[index].name}
                                        </div>
                                      )}
                                      <div
                                        className="w-full rounded-b transition-all duration-500"
                                        style={{
                                          height: `${bar.height * 1.5}px`,
                                          background: `linear-gradient(to bottom, ${bar.color}99, ${bar.color}33)`
                                        }}
                                      />
                                    </div>
                                  ))}
                                </div>
                                <div className="text-sm text-purple-400 mt-2">Essence Rarity ↓</div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {selectedRendition === 3 && (
                          /* Rendition 3: Split View */
                          <div className="grid grid-cols-2 gap-1">
                            {/* Left Side - Gold */}
                            <div className="bg-black/60 rounded-l-xl p-4 border-l border-t border-b border-yellow-500/40">
                              <div className="mb-3">
                                <div className="text-sm font-bold text-yellow-400">GOLD REWARDS</div>
                                <div className="text-xs text-gray-500">Probability Distribution</div>
                              </div>
                              <div className="relative h-32">
                                {/* Top Graph */}
                                <div className="absolute top-0 left-0 right-0 h-[48%]">
                                  <div className="flex items-end gap-0.5 h-full">
                                    {goldDist.map((item, index) => {
                                      const height = Math.max(4, (item.probability / 20) * 60);
                                      return (
                                        <div key={index} className="flex-1 flex flex-col items-center justify-end">
                                          <div
                                            className="w-full bg-yellow-400 opacity-80 rounded-t-sm"
                                            style={{ height: `${height}px` }}
                                          />
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                                {/* Mirror Line */}
                                <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-yellow-500 to-transparent"></div>
                                {/* Bottom Graph (Reflected) */}
                                <div className="absolute bottom-0 left-0 right-0 h-[48%]">
                                  <div className="flex items-start gap-0.5 h-full opacity-30">
                                    {goldDist.map((item, index) => {
                                      const height = Math.max(4, (item.probability / 20) * 60);
                                      return (
                                        <div key={index} className="flex-1 flex flex-col items-center justify-start">
                                          <div
                                            className="w-full bg-yellow-400 rounded-b-sm"
                                            style={{ height: `${height}px` }}
                                          />
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                              <div className="flex justify-between text-[9px] text-gray-500 mt-2">
                                <span>{(goldDist[0].value / 1000).toFixed(0)}K</span>
                                <span>{(goldDist[9].value / 1000).toFixed(0)}K</span>
                              </div>
                            </div>
                            
                            {/* Right Side - Essence */}
                            <div className="bg-black/60 rounded-r-xl p-4 border-r border-t border-b border-purple-500/40">
                              <div className="mb-3">
                                <div className="text-sm font-bold text-purple-400">ESSENCE RARITY</div>
                                <div className="text-xs text-gray-500">Drop Chances ({contract.duration.essenceReward}x)</div>
                              </div>
                              <div className="relative h-32">
                                {/* Top Graph */}
                                <div className="absolute top-0 left-0 right-0 h-[48%]">
                                  <div className="flex items-end gap-1 h-full">
                                    {essenceBars.map((bar, index) => (
                                      <div key={index} className="flex-1 flex flex-col items-center justify-end">
                                        <div
                                          className="w-full rounded-t-sm"
                                          style={{
                                            height: `${bar.height}px`,
                                            backgroundColor: bar.color,
                                            opacity: 0.8
                                          }}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                {/* Mirror Line */}
                                <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
                                {/* Bottom Graph (Reflected) */}
                                <div className="absolute bottom-0 left-0 right-0 h-[48%]">
                                  <div className="flex items-start gap-1 h-full opacity-30">
                                    {essenceBars.map((bar, index) => (
                                      <div key={index} className="flex-1 flex flex-col items-center justify-start">
                                        <div
                                          className="w-full rounded-b-sm"
                                          style={{
                                            height: `${bar.height}px`,
                                            backgroundColor: bar.color
                                          }}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <div className="flex justify-between text-[9px] mt-2">
                                {essenceTypes.map((type, i) => (
                                  <span key={i} style={{ color: type.color }}>{type.icon}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Embark Button */}
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => handleStartMission(contract.id)}
                        disabled={meks.length === 0}
                        className={`px-8 py-3 font-bold text-lg rounded-lg transition-all ${
                          meks.length > 0
                            ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white shadow-lg"
                            : "bg-gray-800 text-gray-600 cursor-not-allowed"
                        }`}
                        title={meks.length === 0 ? "You must slot Meks first" : ""}
                      >
                        {meks.length === 0 ? "SLOT MEKS TO EMBARK" : "EMBARK"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Mek Selector Modal */}
      {showMekSelector && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowMekSelector(null)}>
          <div className="bg-gray-900 rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">Select Mek</h2>
            
            {/* Search */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Meks..."
              className="w-full px-4 py-2 bg-black/60 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none mb-4"
              autoFocus
            />
            
            {/* Mek Grid */}
            <div className="grid grid-cols-4 gap-4">
              {userMeks
                .filter(mek => mek.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((mek) => {
                  const statBonus = mek.stats?.salvage || 0;
                  const isOnMission = mek.onMission;
                  
                  return (
                    <button
                      key={mek.id}
                      onClick={() => !isOnMission && handleMekSelect(mek)}
                      disabled={isOnMission}
                      className={`p-4 rounded-lg transition-all border-2 relative ${
                        isOnMission 
                          ? 'bg-gray-900 border-gray-800 cursor-not-allowed opacity-50' 
                          : statBonus > 0 
                            ? 'bg-gray-800 hover:bg-gray-700 border-green-500/50' 
                            : 'bg-gray-800 hover:bg-gray-700 border-gray-700'
                      }`}
                    >
                      {isOnMission && (
                        <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-red-400 text-sm font-bold">ON MISSION</div>
                            <div className="text-xs text-gray-400">
                              {mek.missionEndTime && formatTimeRemaining(mek.missionEndTime)}
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="aspect-square bg-gray-700 rounded-lg mb-2 flex items-center justify-center">
                        <span className="text-4xl opacity-60">🤖</span>
                      </div>
                      <div className="text-sm font-bold text-white">{mek.name}</div>
                      {statBonus > 0 && !isOnMission && (
                        <div className="text-xs text-green-400 mt-1">+{statBonus} Salvage</div>
                      )}
                      {mek.hasAcid && showMekSelector.contractId === "daily" && (
                        <div className="text-xs text-purple-400 mt-1">⚗️ Acid Trait (2x Bonus)</div>
                      )}
                    </button>
                  );
                })}
            </div>
            
            <button
              onClick={() => setShowMekSelector(null)}
              className="mt-4 w-full py-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Cancel Warning Modal */}
      {showCancelWarning && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowCancelWarning(null)}>
          <div className="bg-gray-900 rounded-xl p-6 max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-red-400 mb-4">Cancel Contract?</h3>
            <p className="text-gray-400 mb-6">
              Warning: You will not be refunded the gold spent to start this contract. 
              Your Meks will return immediately but you will lose all potential rewards.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => handleCancelContract(showCancelWarning)}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-all"
              >
                Cancel Contract
              </button>
              <button
                onClick={() => setShowCancelWarning(null)}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all"
              >
                Keep Contract
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}