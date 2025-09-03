"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";

// Selected essence variations
const essenceTypes = [
  { id: "stone", name: "Stone", image: "/variation-images/stone.png", color: "#8B8B8B" },
  { id: "candy", name: "Candy", image: "/variation-images/candy.png", color: "#FF69B4" },
  { id: "moss", name: "Moss", image: "/variation-images/moss.png", color: "#90EE90" },
  { id: "neon", name: "Neon", image: "/variation-images/neon.png", color: "#FF00FF" },
  { id: "gold", name: "Gold", image: "/variation-images/24k.png", color: "#FFD700" },
];

// Contract configurations
const contractDurations = [
  { id: "5min", displayLabel: "5 MIN", slots: 1, goldFee: 250, essenceReward: 1, goldReward: { min: 100, max: 500 } },
  { id: "1hour", displayLabel: "1 HR", slots: 2, goldFee: 1500, essenceReward: 2, goldReward: { min: 500, max: 3000 } },
  { id: "5hour", displayLabel: "5 HRS", slots: 3, goldFee: 7500, essenceReward: 4, goldReward: { min: 2500, max: 15000 } },
];

const missionTypes = [
  { id: "salvage", name: "Salvage", icon: "⚙️" },
  { id: "combat", name: "Combat", icon: "⚔️" },
  { id: "exploration", name: "Exploration", icon: "🔍" },
];

const missionLocations = [
  { name: "Ghost Ship Nebula", desc: "Mysterious vessel in uncharted space" },
  { name: "Pirate Stronghold", desc: "Heavily defended lucrative target" },
  { name: "Ancient Ruins", desc: "Pre-collapse artifacts await" },
];

export default function ContractsLayoutOption2() {
  const [selectedMeks, setSelectedMeks] = useState<Record<string, any[]>>({});
  const [dailyMeks, setDailyMeks] = useState<any[]>([]);
  const dailyVariation = "Acid";
  
  const calculateBiasScore = (contractId: string) => {
    const meks = contractId === "daily" ? dailyMeks : (selectedMeks[contractId] || []);
    return 150 + (meks.length * 50);
  };
  
  const calculateGoldDistribution = (min: number, max: number, biasScore: number) => {
    const distribution = [];
    const normalizedBias = Math.min(Math.max(biasScore - 150, 0) / 850, 1);
    
    for (let i = 0; i < 10; i++) {
      const value = min + ((max - min) / 9) * i;
      const position = i / 9;
      const center = normalizedBias;
      const width = 0.3;
      const probability = Math.exp(-Math.pow((position - center) / width, 2)) * 100;
      distribution.push({ value, probability: Math.max(5, Math.min(100, probability)) });
    }
    return distribution;
  };
  
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
      <div className={`relative ${isGlobal ? 'bg-gradient-to-br from-yellow-900/20 via-black/60 to-orange-900/20' : 'bg-black/60'} backdrop-blur-md rounded-2xl border-2 ${isGlobal ? 'border-yellow-500' : 'border-gray-700'} overflow-visible`}>
        {/* Floating Badge for Global */}
        {isGlobal && (
          <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 z-30">
            <div className="relative animate-pulse">
              <div className="w-40 h-40 rounded-full p-2 bg-gradient-to-br from-purple-600 via-yellow-500 to-purple-600 shadow-2xl">
                <div className="w-full h-full rounded-full bg-black p-2">
                  <Image
                    src={`/variation-images/${dailyVariation.toLowerCase()}.png`}
                    alt={dailyVariation}
                    width={140}
                    height={140}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-yellow-500 text-black px-4 py-1 rounded-full font-bold text-sm">
                DAILY GLOBAL
              </div>
            </div>
          </div>
        )}
        
        {/* Mission Image for Regular */}
        {!isGlobal && (
          <div className="absolute -left-4 top-8 w-20 h-20 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 p-1 shadow-xl">
            <div className="w-full h-full rounded-xl bg-black/80 flex items-center justify-center">
              <span className="text-3xl">{contract.missionType.icon}</span>
            </div>
          </div>
        )}
        
        <div className={`p-8 ${isGlobal ? 'pt-24' : 'pl-24'}`}>
          <div className="flex justify-between items-start mb-6">
            {/* Left: Mission Info */}
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-yellow-400 mb-2">
                {isGlobal ? `${dailyVariation.toUpperCase()} SURGE EVENT` : contract.location.name}
              </h2>
              <p className="text-gray-400 mb-4">
                {isGlobal ? `All ${dailyVariation} Meks gain 2x power • Exclusive chip rewards` : contract.location.desc}
              </p>
              
              {/* Quick Stats Bar */}
              <div className="flex gap-4 mb-4">
                <div className="bg-black/60 rounded-lg px-4 py-2 border border-gray-700">
                  <span className="text-xs text-gray-500 mr-2">DURATION:</span>
                  <span className="text-yellow-400 font-bold">{isGlobal ? '24 HRS' : contract.duration.displayLabel}</span>
                </div>
                <div className="bg-black/60 rounded-lg px-4 py-2 border border-gray-700">
                  <span className="text-xs text-gray-500 mr-2">FEE:</span>
                  <span className="text-red-400 font-bold">{isGlobal ? '50K' : `${(contract.duration.goldFee/1000).toFixed(0)}K`}</span>
                </div>
                <div className="bg-black/60 rounded-lg px-4 py-2 border border-gray-700">
                  <span className="text-xs text-gray-500 mr-2">TYPE:</span>
                  <span className="text-blue-400 font-bold">{isGlobal ? 'SPECIAL' : contract.missionType.name.toUpperCase()}</span>
                </div>
              </div>
            </div>
            
            {/* Right: Bias Score */}
            <div className="text-center bg-black/60 rounded-xl p-4 border border-yellow-500/50">
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-orange-500">
                {biasScore}
              </div>
              <div className="text-xs text-gray-500 uppercase mt-1">Rarity Bias</div>
            </div>
          </div>
          
          {/* Main Content Area */}
          <div className="grid grid-cols-3 gap-6">
            {/* Mek Slots */}
            <div>
              <h3 className="text-sm text-gray-400 uppercase mb-3">Deploy Squad</h3>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: isGlobal ? 6 : contract.duration.slots }).map((_, i) => {
                  const mek = meks[i];
                  return (
                    <div key={i} className="relative group">
                      <div className="aspect-square rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 p-1">
                        <div className="w-full h-full rounded-xl bg-black/80 border-2 border-dashed border-yellow-500/20 group-hover:border-yellow-500/60 transition-all flex items-center justify-center">
                          {mek ? (
                            <div className="text-[10px] text-yellow-400 text-center p-1">{mek.name}</div>
                          ) : (
                            <div className="text-2xl text-gray-600 group-hover:text-yellow-500/60">+</div>
                          )}
                        </div>
                      </div>
                      {!mek && (
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-yellow-400/0 to-yellow-400/20 opacity-0 group-hover:opacity-100 blur-sm transition-all pointer-events-none" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Gold Rewards */}
            <div>
              <h3 className="text-sm text-gray-400 uppercase mb-3">Gold Distribution</h3>
              <div className="bg-black/40 rounded-xl p-4 border border-gray-700">
                <div className="flex items-end gap-1 h-20">
                  {goldDist.slice(0, 10).map((item, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end">
                      {(i === 0 || i === 9) && (
                        <div className="text-[8px] text-gray-500 mb-1">{item.probability.toFixed(0)}%</div>
                      )}
                      <div
                        className="w-full bg-gradient-to-t from-yellow-700 to-yellow-400 rounded-t"
                        style={{ height: `${(item.probability / 100) * 80}px` }}
                      />
                      {(i === 0 || i === 9) && (
                        <div className="text-[8px] text-gray-600 mt-1">{(item.value/1000).toFixed(0)}k</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Essence Rewards */}
            <div>
              <h3 className="text-sm text-gray-400 uppercase mb-3">Essence Drops ({isGlobal ? 25 : contract.duration.essenceReward}x)</h3>
              <div className="bg-black/40 rounded-xl p-4 border border-gray-700">
                <div className="flex items-end gap-2 h-20">
                  {essenceProbs.map((prob, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end">
                      <div className="text-[9px] text-gray-400">{prob.toFixed(0)}%</div>
                      <div
                        className="w-full rounded"
                        style={{
                          height: `${(prob / 100) * 60}px`,
                          backgroundColor: essenceTypes[i].color,
                        }}
                      />
                      <Image
                        src={essenceTypes[i].image}
                        alt={essenceTypes[i].name}
                        width={24}
                        height={24}
                        className="mt-1"
                      />
                      <div className="text-[8px] text-gray-500 mt-0.5">{essenceTypes[i].name}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              {isGlobal && (
                <div className="mt-3 bg-purple-900/30 rounded-lg p-2 border border-purple-500/30">
                  <div className="text-xs text-purple-400">{dailyVariation} Chip Drop: <span className="font-bold text-lg">8.1%</span></div>
                </div>
              )}
            </div>
          </div>
          
          {/* Embark Button */}
          <button
            disabled={meks.length === 0}
            className={`w-full mt-6 py-4 font-bold text-lg rounded-xl transition-all ${
              meks.length > 0
                ? isGlobal
                  ? 'bg-gradient-to-r from-purple-600 via-yellow-500 to-purple-600 hover:brightness-110 text-black'
                  : 'bg-gradient-to-r from-green-600 to-green-500 hover:brightness-110 text-white'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            }`}
          >
            {meks.length === 0 ? "SELECT MEKS TO EMBARK" : "EMBARK ON MISSION"}
          </button>
        </div>
      </div>
    );
  };
  
  const contracts = contractDurations.map((duration, i) => ({
    id: `contract_${i}`,
    location: missionLocations[i],
    missionType: missionTypes[i],
    duration
  }));
  
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-yellow-400 mb-8 text-center">CONTRACTS - Layout Option 2</h1>
        <p className="text-center text-gray-400 mb-12">Horizontal flow with compact stat bars</p>
        
        <div className="space-y-12">
          {renderContract(null, true)}
          {contracts.map(contract => (
            <div key={contract.id}>{renderContract(contract, false)}</div>
          ))}
        </div>
      </div>
    </div>
  );
}