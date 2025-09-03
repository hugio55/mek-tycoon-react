"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import Image from "next/image";

// Contract duration configurations
const contractDurations = [
  { id: "5min", label: "5 Minutes", displayLabel: "5 MIN", duration: 5 * 60 * 1000, slots: 1, goldFee: 250, essenceReward: 1, goldReward: { min: 100, max: 500 } },
  { id: "1hour", label: "1 Hour", displayLabel: "1 HR", duration: 60 * 60 * 1000, slots: 2, goldFee: 1500, essenceReward: 2, goldReward: { min: 500, max: 3000 } },
  { id: "5hour", label: "5 Hours", displayLabel: "5 HRS", duration: 5 * 60 * 60 * 1000, slots: 3, goldFee: 7500, essenceReward: 4, goldReward: { min: 2500, max: 15000 } },
  { id: "10hour", label: "10 Hours", displayLabel: "10 HRS", duration: 10 * 60 * 60 * 1000, slots: 4, goldFee: 15000, essenceReward: 7, goldReward: { min: 5000, max: 35000 } },
  { id: "1day", label: "1 Day", displayLabel: "1 DAY", duration: 24 * 60 * 60 * 1000, slots: 5, goldFee: 40000, essenceReward: 12, goldReward: { min: 15000, max: 100000 } },
  { id: "3day", label: "3 Days", displayLabel: "3 DAYS", duration: 3 * 24 * 60 * 60 * 1000, slots: 7, goldFee: 150000, essenceReward: 25, goldReward: { min: 75000, max: 500000 } },
  { id: "5day", label: "5 Days", displayLabel: "5 DAYS", duration: 5 * 24 * 60 * 60 * 1000, slots: 10, goldFee: 300000, essenceReward: 40, goldReward: { min: 200000, max: 1500000 } },
];

// Mission types
const missionTypes = [
  { id: "salvage", name: "Salvage", icon: "⚙️", color: "#4169E1" },
  { id: "rescue", name: "Rescue", icon: "🚑", color: "#FF69B4" },
  { id: "exploration", name: "Exploration", icon: "🔍", color: "#90EE90" },
  { id: "combat", name: "Combat", icon: "⚔️", color: "#FF4500" },
];

// Mission locations
const missionLocations = [
  { name: "Abandoned Station Alpha-7", desc: "Derelict space station with valuable salvage" },
  { name: "Distress Beacon - Sector 9", desc: "Unknown origin, high risk/reward" },
  { name: "Derelict Cargo Freighter", desc: "Massive hauler with intact cargo bays" },
  { name: "Mining Colony Delta-3", desc: "Former mining operation, mineral rich" },
];

// Selected essence variations for rewards
const essenceTypes = [
  { id: "stone", name: "Stone", image: "/variation-images/stone.png", color: "#8B8B8B" },
  { id: "disco", name: "Disco", image: "/variation-images/disco.png", color: "#FF1493" },
  { id: "paul", name: "Paul", image: "/variation-images/paul.png", color: "#4169E1" },
  { id: "moss", name: "Moss", image: "/variation-images/moss.png", color: "#90EE90" },
  { id: "laser", name: "Laser", image: "/variation-images/laser.png", color: "#00CED1" },
];

export default function ContractsLayoutOption1() {
  const [selectedMeks, setSelectedMeks] = useState<Record<string, any[]>>({});
  const [dailyMeks, setDailyMeks] = useState<any[]>([]);
  const dailyVariation = "Acid";
  
  // Calculate bias score
  const calculateBiasScore = (contractId: string) => {
    const meks = contractId === "daily" ? dailyMeks : (selectedMeks[contractId] || []);
    return 150 + (meks.length * 50);
  };
  
  // Fixed gold distribution
  const calculateGoldDistribution = (min: number, max: number, biasScore: number) => {
    const distribution = [];
    const normalizedBias = Math.min(Math.max(biasScore - 150, 0) / 850, 1);
    
    for (let i = 0; i < 10; i++) {
      const value = min + ((max - min) / 9) * i;
      const position = i / 9;
      
      // Bell curve centered based on bias
      const center = normalizedBias;
      const width = 0.3;
      const probability = Math.exp(-Math.pow((position - center) / width, 2)) * 100;
      
      distribution.push({ 
        value, 
        probability: Math.max(5, Math.min(100, probability))
      });
    }
    
    return distribution;
  };
  
  // Calculate essence probabilities
  const calculateEssenceProbabilities = (biasScore: number) => {
    const normalizedBias = Math.min(Math.max(biasScore - 150, 0) / 850, 1);
    return essenceTypes.map((_, index) => {
      const position = index / (essenceTypes.length - 1);
      const center = normalizedBias;
      const width = 0.4;
      const probability = Math.exp(-Math.pow((position - center) / width, 2)) * 100;
      return Math.max(5, Math.min(100, probability));
    });
  };
  
  // Render a single contract (used for both global and regular)
  const renderContract = (contract: any, isGlobal: boolean = false) => {
    const biasScore = calculateBiasScore(isGlobal ? "daily" : contract.id);
    const meks = isGlobal ? dailyMeks : (selectedMeks[contract.id] || []);
    const goldDist = calculateGoldDistribution(
      isGlobal ? 50000 : contract.duration.goldReward.min,
      isGlobal ? 500000 : contract.duration.goldReward.max,
      biasScore
    );
    const essenceProbs = calculateEssenceProbabilities(biasScore);
    
    return (
      <div className={`bg-black/60 backdrop-blur-md rounded-xl ${isGlobal ? 'border-4 border-yellow-500/80 shadow-2xl' : 'border-2 border-yellow-500/30'} relative overflow-visible`}>
        {/* Global Mission Badge */}
        {isGlobal && (
          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 z-20">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 p-1 shadow-2xl">
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                  <Image
                    src={`/variation-images/${dailyVariation.toLowerCase()}.png`}
                    alt={dailyVariation}
                    width={100}
                    height={100}
                    className="rounded-full"
                  />
                </div>
              </div>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                DAILY GLOBAL
              </div>
            </div>
          </div>
        )}
        
        {/* Mission Thumbnail for regular missions */}
        {!isGlobal && (
          <div className="absolute -top-8 left-8">
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 p-0.5 shadow-xl">
              <div className="w-full h-full rounded-lg bg-black flex items-center justify-center">
                <Image
                  src="/random-images/space-station.png"
                  alt="Mission"
                  width={56}
                  height={56}
                  className="rounded-lg opacity-80"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>
          </div>
        )}
        
        <div className={`p-8 ${isGlobal ? 'pt-20' : 'pt-12'}`}>
          {/* Header Section */}
          <div className="mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold text-yellow-400 mb-1">
                  {isGlobal ? `DAILY GLOBAL: ${dailyVariation.toUpperCase()}` : contract.location.name}
                </h3>
                <p className="text-gray-400 text-sm">
                  {isGlobal ? `${dailyVariation} Meks get 2x bias boost • Can loot ${dailyVariation} Power Chip` : contract.location.desc}
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                  {biasScore}
                </div>
                <div className="text-xs text-gray-500 uppercase">Rarity Bias</div>
              </div>
            </div>
          </div>
          
          {/* Mission Details Grid */}
          <div className="grid grid-cols-4 gap-6 mb-6">
            {/* Mission Info */}
            <div className="space-y-4">
              <div className="bg-black/40 rounded-lg p-4 border border-gray-700">
                <div className="text-xs text-gray-500 uppercase mb-1">Mission Type</div>
                <div className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="text-2xl">{isGlobal ? '⚗️' : contract.missionType.icon}</span>
                  <span>{isGlobal ? 'Special' : contract.missionType.name}</span>
                </div>
              </div>
              <div className="bg-black/40 rounded-lg p-4 border border-gray-700">
                <div className="text-xs text-gray-500 uppercase mb-1">Mission Duration</div>
                <div className="text-2xl font-bold text-yellow-400">
                  {isGlobal ? '24 HOURS' : contract.duration.displayLabel}
                </div>
              </div>
              <div className="bg-black/40 rounded-lg p-4 border border-gray-700">
                <div className="text-xs text-gray-500 uppercase mb-1">Entry Fee</div>
                <div className="text-xl font-bold text-red-400">
                  {isGlobal ? '50,000' : (contract.duration.goldFee / 1000).toFixed(0)}K GOLD
                </div>
              </div>
            </div>
            
            {/* Mek Assignment Slots */}
            <div className="col-span-2">
              <div className="text-sm text-gray-400 uppercase mb-3">Squad Assignment</div>
              <div className="grid grid-cols-5 gap-3">
                {Array.from({ length: isGlobal ? 5 : contract.duration.slots }).map((_, i) => {
                  const mek = meks[i];
                  return (
                    <div
                      key={i}
                      className="relative aspect-square group cursor-pointer"
                    >
                      {/* Epic socket frame */}
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-yellow-600/20 via-yellow-500/10 to-orange-600/20 p-0.5">
                        <div className="w-full h-full rounded-lg bg-black/80 flex items-center justify-center">
                          {mek ? (
                            <div className="text-center p-2">
                              <div className="text-xs text-yellow-400">{mek.name}</div>
                            </div>
                          ) : (
                            <div className="w-full h-full rounded-lg border-2 border-dashed border-yellow-500/30 flex items-center justify-center group-hover:border-yellow-400/60 transition-all">
                              <div className="text-3xl text-yellow-500/30 group-hover:text-yellow-400/60 transition-all">+</div>
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Glow effect for empty slots */}
                      {!mek && (
                        <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-yellow-400/20 to-orange-400/20 blur-xl"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {meks.length > 0 && (
                <div className="mt-3 text-sm text-green-400">
                  Squad Multiplier: {(1 + meks.length * 0.1).toFixed(1)}x
                </div>
              )}
            </div>
            
            {/* Rewards Section */}
            <div className="space-y-4">
              {/* Gold Rewards */}
              <div className="bg-black/40 rounded-lg p-3 border border-gray-700">
                <div className="text-xs text-gray-500 uppercase mb-2">Gold Rewards</div>
                <div className="flex items-end gap-1 h-12">
                  {goldDist.map((item, i) => (
                    <div key={i} className="flex-1 relative group">
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="text-[8px] text-yellow-400 whitespace-nowrap">
                          {(item.value / 1000).toFixed(0)}k ({item.probability.toFixed(0)}%)
                        </div>
                      </div>
                      <div
                        className="w-full bg-gradient-to-t from-yellow-600/80 to-yellow-400 rounded-t transition-all duration-300 hover:brightness-110"
                        style={{ height: `${(item.probability / 100) * 48}px` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Essence Rewards */}
              <div className="bg-black/40 rounded-lg p-3 border border-gray-700">
                <div className="text-xs text-gray-500 uppercase mb-2">
                  Essence Rewards ({isGlobal ? 25 : contract.duration.essenceReward}x)
                </div>
                <div className="flex items-end gap-2 h-16">
                  {essenceProbs.map((prob, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div className="text-[8px] text-gray-400 mb-1">{prob.toFixed(0)}%</div>
                      <div
                        className="w-full rounded-t transition-all duration-300"
                        style={{
                          height: `${(prob / 100) * 48}px`,
                          backgroundColor: essenceTypes[i].color,
                          boxShadow: `0 0 10px ${essenceTypes[i].color}40`
                        }}
                      />
                      <Image
                        src={essenceTypes[i].image}
                        alt={essenceTypes[i].name}
                        width={20}
                        height={20}
                        className="mt-1"
                      />
                      <div className="text-[8px] text-gray-400">{essenceTypes[i].name}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Special Reward for Global */}
              {isGlobal && (
                <div className="bg-purple-900/30 rounded-lg p-3 border border-purple-500/30">
                  <div className="text-xs text-purple-400 uppercase mb-1">{dailyVariation} Chip Drop Chance</div>
                  <div className="text-2xl font-bold text-purple-400">8.1%</div>
                </div>
              )}
            </div>
          </div>
          
          {/* Embark Button */}
          <button
            disabled={meks.length === 0}
            className={`w-full py-4 font-bold text-lg rounded-lg transition-all ${
              meks.length > 0
                ? isGlobal 
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black shadow-lg'
                  : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white shadow-lg'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            }`}
            title={meks.length === 0 ? "You must slot Meks first" : ""}
          >
            {meks.length === 0 ? "SLOT MEKS TO EMBARK" : "EMBARK ON MISSION"}
          </button>
        </div>
      </div>
    );
  };
  
  const contracts = contractDurations.slice(0, 3).map((duration, i) => ({
    id: `contract_${i}`,
    location: missionLocations[i],
    missionType: missionTypes[i % missionTypes.length],
    duration
  }));
  
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-yellow-400 mb-8 text-center">CONTRACTS - Layout Option 1</h1>
        <p className="text-center text-gray-400 mb-12">Garrison-inspired with detailed mission info panels</p>
        
        {/* Daily Global Mission */}
        <div className="mb-12">
          {renderContract(null, true)}
        </div>
        
        {/* Regular Contracts */}
        <div className="space-y-8">
          {contracts.map(contract => (
            <div key={contract.id}>
              {renderContract(contract, false)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}