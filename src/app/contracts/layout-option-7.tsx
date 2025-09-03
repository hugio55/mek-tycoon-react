"use client";

import { useState } from "react";
import Image from "next/image";

// 7 essence variations
const essenceTypes = [
  { id: "ice", name: "Ice", image: "/variation-images/ice.png", color: "#87CEEB" },
  { id: "fire", name: "Fire", image: "/variation-images/fire.png", color: "#FF4500" },
  { id: "toxic", name: "Toxic", image: "/variation-images/toxic.png", color: "#00FF00" },
  { id: "chrome", name: "Chrome", image: "/variation-images/chrome.png", color: "#C0C0C0" },
  { id: "plasma", name: "Plasma", image: "/variation-images/plasma.png", color: "#FF00FF" },
  { id: "neon", name: "Neon", image: "/variation-images/neon.png", color: "#FF00FF" },
  { id: "golden", name: "Golden", image: "/variation-images/golden_guns.png", color: "#FFD700" },
];

const contractDurations = [
  { id: "5min", displayLabel: "5 MIN", slots: 1, goldFee: 250, essenceReward: 1, goldReward: { min: 100, max: 500 } },
  { id: "1hour", displayLabel: "1 HR", slots: 2, goldFee: 1500, essenceReward: 2, goldReward: { min: 500, max: 3000 } },
];

export default function ContractsLayoutOption7() {
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
    
    for (let i = 0; i < 20; i++) {
      const value = min + ((max - min) / 19) * i;
      const position = i / 19;
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
      <div className="relative">
        {/* Card Background - Based on Option 3 style */}
        <div className={`relative bg-gradient-to-br ${isGlobal ? 'from-yellow-900/30 via-black/80 to-purple-900/30' : 'from-gray-900/50 to-black/80'} backdrop-blur-lg rounded-[2.5rem] border-2 ${isGlobal ? 'border-yellow-500/60 shadow-[0_0_60px_rgba(250,182,23,0.4)]' : 'border-gray-700/60'} overflow-hidden`}>
          
          {/* Global Badge - HUGE */}
          {isGlobal && (
            <div className="absolute -top-40 left-1/2 transform -translate-x-1/2 z-40">
              <div className="relative">
                <div className="w-80 h-80 rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-purple-600 p-2 animate-pulse">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-900 to-black p-4">
                    <Image
                      src={`/variation-images/${dailyVariation.toLowerCase()}.png`}
                      alt={dailyVariation}
                      width={280}
                      height={280}
                      className="w-full h-full object-contain rounded-full"
                    />
                  </div>
                </div>
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-purple-600 to-yellow-500 px-8 py-3 rounded-full">
                    <div className="text-black font-bold text-2xl">DAILY GLOBAL EVENT</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Mission Thumbnail Badge - BIGGER */}
          {!isGlobal && (
            <div className="absolute top-8 left-8 w-36 h-36">
              <div className="relative w-full h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-800 rounded-3xl shadow-2xl"></div>
                <div className="absolute inset-2 bg-black rounded-2xl flex items-center justify-center">
                  <span className="text-6xl">⚙️</span>
                </div>
              </div>
            </div>
          )}
          
          <div className={`${isGlobal ? 'pt-48' : 'pt-10'} p-10`}>
            {/* Header Section - BIGGER FONTS */}
            <div className={`${!isGlobal ? 'ml-40' : ''} mb-10`}>
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-5xl font-bold mb-3">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                      {isGlobal ? `GLOBAL ${dailyVariation.toUpperCase()} EVENT` : 'Temporal Anomaly Zone'}
                    </span>
                  </h2>
                  <p className="text-gray-400 text-xl">
                    {isGlobal ? `${dailyVariation} Meks receive 2x power boost` : 'Time-distorted region with unique rewards'}
                  </p>
                </div>
                
                {/* Bias Display - HUGE */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 blur-3xl"></div>
                  <div className="relative bg-black/60 rounded-3xl p-8 border-2 border-yellow-500/40">
                    <div className="text-8xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-yellow-400 to-orange-500">
                      {biasScore}
                    </div>
                    <div className="text-base text-gray-400 text-center uppercase tracking-wider mt-3">Rarity Bias</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mission Details Row - BIGGER */}
            <div className="bg-black/40 rounded-3xl p-8 border border-gray-700/50 mb-8">
              <div className="grid grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-2">MISSION DURATION</div>
                  <div className="text-4xl font-bold text-yellow-400">{isGlobal ? '24H' : '5M'}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-2">ENTRY FEE</div>
                  <div className="text-4xl font-bold text-red-400">{isGlobal ? '50K' : '250'}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-2">TYPE</div>
                  <div className="text-4xl font-bold text-blue-400">{isGlobal ? '⚗️' : '⚙️'}</div>
                </div>
              </div>
            </div>
            
            {/* Squad Deployment - BIGGER SLOTS */}
            <div className="bg-black/40 rounded-3xl p-8 border border-gray-700/50 mb-8">
              <h3 className="text-xl font-bold text-yellow-400 uppercase tracking-wider mb-6">Squad Deployment</h3>
              <div className="grid grid-cols-6 gap-4">
                {Array.from({ length: isGlobal ? 10 : 4 }).map((_, i) => {
                  const mek = meks[i];
                  return (
                    <div key={i} className="relative group cursor-pointer">
                      {/* Epic Socket Design */}
                      <div className="aspect-square relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/30 via-orange-500/20 to-yellow-600/30 rounded-2xl blur-md group-hover:blur-lg transition-all"></div>
                        <div className="relative w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-2xl p-1.5">
                          <div className="w-full h-full bg-black rounded-xl border-3 border-yellow-500/20 group-hover:border-yellow-400/60 transition-all flex items-center justify-center">
                            {mek ? (
                              <div className="text-sm text-yellow-400 text-center p-2">{mek.name}</div>
                            ) : (
                              <>
                                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 rounded-xl"></div>
                                <div className="text-5xl text-yellow-500/30 group-hover:text-yellow-400/60 transition-all z-10">+</div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {meks.length > 0 && (
                <div className="mt-6 text-center text-green-400 font-bold text-2xl">
                  Squad Bonus: {(1 + meks.length * 0.1).toFixed(1)}x
                </div>
              )}
            </div>
            
            {/* FULL WIDTH Rewards */}
            <div className="space-y-8">
              {/* Gold Distribution - FULL WIDTH */}
              <div className="bg-black/40 rounded-3xl p-8 border border-gray-700/50">
                <h3 className="text-xl font-bold text-yellow-400 uppercase tracking-wider mb-6">Gold Rewards Distribution</h3>
                <div className="h-40 flex items-end gap-1">
                  {goldDist.map((item, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end relative group">
                      <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="text-sm text-yellow-400 whitespace-nowrap">
                          {(item.value/1000).toFixed(0)}k
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mb-2">{item.probability.toFixed(0)}%</div>
                      <div
                        className="w-full bg-gradient-to-t from-yellow-600 via-yellow-500 to-yellow-400 rounded-t hover:brightness-110 transition-all"
                        style={{ height: `${(item.probability / 100) * 140}px` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Essence Distribution - FULL WIDTH with 7 types */}
              <div className="bg-black/40 rounded-3xl p-8 border border-gray-700/50">
                <h3 className="text-xl font-bold text-yellow-400 uppercase tracking-wider mb-6">
                  Essence Rewards ({isGlobal ? 25 : 1}x Drop Rate)
                </h3>
                <div className="flex items-end gap-4 h-40">
                  {essenceProbs.map((prob, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div className="text-sm text-gray-400 mb-2">{prob.toFixed(0)}%</div>
                      <div
                        className="w-full rounded-t transition-all hover:brightness-125"
                        style={{
                          height: `${(prob / 100) * 120}px`,
                          backgroundColor: essenceTypes[i].color,
                          boxShadow: `0 0 30px ${essenceTypes[i].color}60`
                        }}
                      />
                      <div className="mt-3 w-12 h-12">
                        <Image
                          src={essenceTypes[i].image}
                          alt={essenceTypes[i].name}
                          width={48}
                          height={48}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="text-sm text-gray-400 mt-2">{essenceTypes[i].name}</div>
                    </div>
                  ))}
                </div>
                
                {/* Special Drop for Global */}
                {isGlobal && (
                  <div className="mt-6 bg-gradient-to-r from-purple-900/50 to-purple-800/50 rounded-2xl p-5 border border-purple-500/40">
                    <div className="flex justify-between items-center">
                      <span className="text-purple-300 text-xl">{dailyVariation} Chip Drop Chance:</span>
                      <span className="text-4xl font-bold text-purple-400">8.1%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Embark Button - BIGGER */}
            <button
              disabled={meks.length === 0}
              className={`w-full mt-10 py-7 font-bold text-3xl rounded-3xl transition-all transform hover:scale-[1.02] ${
                meks.length > 0
                  ? isGlobal
                    ? 'bg-gradient-to-r from-yellow-500 via-orange-500 to-purple-500 text-black shadow-[0_10px_40px_rgba(250,182,23,0.5)]'
                    : 'bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-2xl'
                  : 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
              }`}
            >
              {meks.length === 0 ? "ASSIGN SQUAD TO EMBARK" : "LAUNCH MISSION"}
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-yellow-400 mb-8 text-center">CONTRACTS - Layout Option 7</h1>
        <p className="text-center text-gray-400 mb-20">Based on Option 3 - Full-width graphs, bigger everything, 7 essences</p>
        
        <div className="space-y-20">
          {renderContract(null, true)}
          {renderContract({ id: 'c1', duration: { displayLabel: '1 HR', slots: 2, goldFee: 1500, essenceReward: 2, goldReward: { min: 500, max: 3000 } } }, false)}
        </div>
      </div>
    </div>
  );
}