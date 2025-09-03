"use client";

import { useState } from "react";
import Image from "next/image";

// 7 essence variations for rewards
const essenceTypes = [
  { id: "stone", name: "Stone", image: "/variation-images/stone.png", color: "#8B8B8B" },
  { id: "disco", name: "Disco", image: "/variation-images/disco.png", color: "#FF1493" },
  { id: "candy", name: "Candy", image: "/variation-images/candy.png", color: "#FF69B4" },
  { id: "moss", name: "Moss", image: "/variation-images/moss.png", color: "#90EE90" },
  { id: "gold", name: "Gold", image: "/variation-images/24k.png", color: "#FFD700" },
  { id: "laser", name: "Laser", image: "/variation-images/laser.png", color: "#00CED1" },
  { id: "toxic", name: "Toxic", image: "/variation-images/toxic.png", color: "#00FF00" },
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

export default function ContractsLayoutOption6() {
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
    
    for (let i = 0; i < 15; i++) {
      const value = min + ((max - min) / 14) * i;
      const position = i / 14;
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
      <div className={`relative ${isGlobal ? 'bg-gradient-to-br from-yellow-900/20 via-black/60 to-orange-900/20' : 'bg-black/60'} backdrop-blur-md rounded-3xl border-2 ${isGlobal ? 'border-yellow-500/70 shadow-[0_0_40px_rgba(250,182,23,0.3)]' : 'border-gray-700'} overflow-visible`}>
        
        {/* Floating Badge for Global - MUCH BIGGER */}
        {isGlobal && (
          <div className="absolute -top-36 left-1/2 transform -translate-x-1/2 z-30">
            <div className="relative animate-pulse">
              <div className="w-72 h-72 rounded-full p-3 bg-gradient-to-br from-purple-600 via-yellow-500 to-purple-600 shadow-2xl">
                <div className="w-full h-full rounded-full bg-black p-3">
                  <Image
                    src={`/variation-images/${dailyVariation.toLowerCase()}.png`}
                    alt={dailyVariation}
                    width={250}
                    height={250}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-yellow-500 text-black px-6 py-2 rounded-full font-bold text-xl">
                DAILY GLOBAL EVENT
              </div>
            </div>
          </div>
        )}
        
        {/* Mission Image for Regular - BIGGER */}
        {!isGlobal && (
          <div className="absolute -left-6 top-10 w-32 h-32 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 p-2 shadow-2xl">
            <div className="w-full h-full rounded-xl bg-black/80 flex items-center justify-center">
              <span className="text-5xl">{contract.missionType.icon}</span>
            </div>
          </div>
        )}
        
        <div className={`p-10 ${isGlobal ? 'pt-44' : 'pl-32'}`}>
          {/* Header Section with BIGGER FONTS */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex-1">
              <h2 className="text-4xl font-bold text-yellow-400 mb-3">
                {isGlobal ? `${dailyVariation.toUpperCase()} SURGE EVENT` : contract.location.name}
              </h2>
              <p className="text-gray-400 text-lg">
                {isGlobal ? `All ${dailyVariation} Meks gain 2x power • Exclusive chip rewards` : contract.location.desc}
              </p>
              
              {/* Quick Stats Bar - BIGGER */}
              <div className="flex gap-4 mt-5">
                <div className="bg-black/60 rounded-xl px-6 py-3 border border-gray-700">
                  <span className="text-sm text-gray-500 mr-2">MISSION DURATION:</span>
                  <span className="text-yellow-400 font-bold text-2xl">{isGlobal ? '24 HRS' : contract.duration.displayLabel}</span>
                </div>
                <div className="bg-black/60 rounded-xl px-6 py-3 border border-gray-700">
                  <span className="text-sm text-gray-500 mr-2">ENTRY FEE:</span>
                  <span className="text-red-400 font-bold text-2xl">{isGlobal ? '50K' : `${(contract.duration.goldFee/1000).toFixed(0)}K`}</span>
                </div>
                <div className="bg-black/60 rounded-xl px-6 py-3 border border-gray-700">
                  <span className="text-sm text-gray-500 mr-2">TYPE:</span>
                  <span className="text-blue-400 font-bold text-2xl">{isGlobal ? 'SPECIAL' : contract.missionType.name.toUpperCase()}</span>
                </div>
              </div>
            </div>
            
            {/* Bias Score - BIGGER */}
            <div className="text-center bg-black/60 rounded-2xl p-6 border-2 border-yellow-500/50">
              <div className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-orange-500">
                {biasScore}
              </div>
              <div className="text-sm text-gray-500 uppercase mt-2">Rarity Bias</div>
            </div>
          </div>
          
          {/* Mek Slots Section - BIGGER */}
          <div className="mb-8">
            <h3 className="text-lg text-gray-400 uppercase mb-4">Deploy Squad</h3>
            <div className="grid grid-cols-8 gap-3">
              {Array.from({ length: isGlobal ? 8 : contract.duration.slots }).map((_, i) => {
                const mek = meks[i];
                return (
                  <div key={i} className="relative group">
                    <div className="aspect-square rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 p-1.5">
                      <div className="w-full h-full rounded-xl bg-black/80 border-2 border-dashed border-yellow-500/20 group-hover:border-yellow-500/60 transition-all flex items-center justify-center">
                        {mek ? (
                          <div className="text-sm text-yellow-400 text-center p-2">{mek.name}</div>
                        ) : (
                          <div className="text-4xl text-gray-600 group-hover:text-yellow-500/60">+</div>
                        )}
                      </div>
                    </div>
                    {!mek && (
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-yellow-400/0 to-yellow-400/20 opacity-0 group-hover:opacity-100 blur-md transition-all pointer-events-none" />
                    )}
                  </div>
                );
              })}
              {Array.from({ length: Math.max(0, 8 - (isGlobal ? 8 : contract.duration.slots)) }).map((_, i) => (
                <div key={`locked-${i}`} className="aspect-square rounded-2xl bg-gray-900/50 border-2 border-gray-800 opacity-30">
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-2xl text-gray-700">🔒</span>
                  </div>
                </div>
              ))}
            </div>
            {meks.length > 0 && (
              <div className="mt-4 text-center text-green-400 font-bold text-xl">
                Squad Multiplier: {(1 + meks.length * 0.1).toFixed(1)}x
              </div>
            )}
          </div>
          
          {/* FULL WIDTH Rewards Section */}
          <div className="space-y-6">
            {/* Gold Rewards - FULL WIDTH */}
            <div>
              <h3 className="text-lg text-gray-400 uppercase mb-4">Gold Distribution</h3>
              <div className="bg-black/40 rounded-2xl p-6 border border-gray-700">
                <div className="flex items-end gap-2 h-32">
                  {goldDist.map((item, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end">
                      {(i === 0 || i === 7 || i === 14) && (
                        <div className="text-sm text-gray-500 mb-2">{item.probability.toFixed(0)}%</div>
                      )}
                      <div
                        className="w-full bg-gradient-to-t from-yellow-700 to-yellow-400 rounded-t hover:brightness-110 transition-all"
                        style={{ height: `${(item.probability / 100) * 120}px` }}
                      />
                      {(i === 0 || i === 14) && (
                        <div className="text-sm text-gray-600 mt-2">{(item.value/1000).toFixed(0)}k</div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-center text-sm text-yellow-400 mt-3">
                  Higher bias shifts probability toward better rewards →
                </div>
              </div>
            </div>
            
            {/* Essence Rewards - FULL WIDTH with 7 types */}
            <div>
              <h3 className="text-lg text-gray-400 uppercase mb-4">Essence Drops ({isGlobal ? 25 : contract.duration.essenceReward}x)</h3>
              <div className="bg-black/40 rounded-2xl p-6 border border-gray-700">
                <div className="flex items-end gap-3 h-32">
                  {essenceProbs.map((prob, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end">
                      <div className="text-sm text-gray-400 mb-2">{prob.toFixed(0)}%</div>
                      <div
                        className="w-full rounded transition-all hover:brightness-125"
                        style={{
                          height: `${(prob / 100) * 100}px`,
                          backgroundColor: essenceTypes[i].color,
                          boxShadow: `0 0 20px ${essenceTypes[i].color}60`
                        }}
                      />
                      <Image
                        src={essenceTypes[i].image}
                        alt={essenceTypes[i].name}
                        width={40}
                        height={40}
                        className="mt-3"
                      />
                      <div className="text-sm text-gray-400 mt-2">{essenceTypes[i].name}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              {isGlobal && (
                <div className="mt-4 bg-purple-900/30 rounded-xl p-4 border border-purple-500/30">
                  <div className="text-lg text-purple-400">{dailyVariation} Chip Drop Chance: <span className="font-bold text-3xl">8.1%</span></div>
                </div>
              )}
            </div>
          </div>
          
          {/* Embark Button - BIGGER */}
          <button
            disabled={meks.length === 0}
            className={`w-full mt-8 py-6 font-bold text-2xl rounded-2xl transition-all ${
              meks.length > 0
                ? isGlobal
                  ? 'bg-gradient-to-r from-purple-600 via-yellow-500 to-purple-600 hover:brightness-110 text-black shadow-2xl'
                  : 'bg-gradient-to-r from-green-600 to-green-500 hover:brightness-110 text-white shadow-xl'
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
        <h1 className="text-4xl font-bold text-yellow-400 mb-8 text-center">CONTRACTS - Layout Option 6</h1>
        <p className="text-center text-gray-400 mb-12">Based on Option 2 - Full-width graphs, bigger fonts, 7 essence types</p>
        
        <div className="space-y-16">
          {renderContract(null, true)}
          {contracts.map(contract => (
            <div key={contract.id}>{renderContract(contract, false)}</div>
          ))}
        </div>
      </div>
    </div>
  );
}