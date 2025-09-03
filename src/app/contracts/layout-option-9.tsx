"use client";

import { useState } from "react";
import Image from "next/image";

// 7 essence variations
const essenceTypes = [
  { id: "stone", name: "Stone", image: "/variation-images/stone.png", color: "#8B8B8B" },
  { id: "fire", name: "Fire", image: "/variation-images/fire.png", color: "#FF4500" },
  { id: "toxic", name: "Toxic", image: "/variation-images/toxic.png", color: "#00FF00" },
  { id: "chrome", name: "Chrome", image: "/variation-images/chrome.png", color: "#C0C0C0" },
  { id: "disco", name: "Disco", image: "/variation-images/disco.png", color: "#FF1493" },
  { id: "candy", name: "Candy", image: "/variation-images/candy.png", color: "#FFB6C1" },
  { id: "golden", name: "Golden", image: "/variation-images/golden_guns.png", color: "#FFD700" },
];

const contractDurations = [
  { id: "5min", displayLabel: "5 MIN", slots: 1, goldFee: 250, essenceReward: 1, goldReward: { min: 100, max: 500 } },
  { id: "1hour", displayLabel: "1 HR", slots: 2, goldFee: 1500, essenceReward: 2, goldReward: { min: 500, max: 3000 } },
];

export default function ContractsLayoutOption9() {
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
        {/* Card Background - 30% smaller than Option 7 */}
        <div className={`relative bg-gradient-to-br ${isGlobal ? 'from-yellow-900/30 via-black/80 to-purple-900/30' : 'from-gray-900/50 to-black/80'} backdrop-blur-lg rounded-2xl border-2 ${isGlobal ? 'border-yellow-500/60 shadow-[0_0_40px_rgba(250,182,23,0.3)]' : 'border-gray-700/60'} overflow-hidden`}>
          
          {/* Global Badge - Reduced from 80rem to 56rem (30% smaller) */}
          {isGlobal && (
            <div className="absolute -top-28 left-1/2 transform -translate-x-1/2 z-40">
              <div className="relative">
                <div className="w-56 h-56 rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-purple-600 p-1.5 animate-pulse">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-900 to-black p-3">
                    <Image
                      src={`/variation-images/${dailyVariation.toLowerCase()}.png`}
                      alt={dailyVariation}
                      width={200}
                      height={200}
                      className="w-full h-full object-contain rounded-full"
                    />
                  </div>
                </div>
                <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-purple-600 to-yellow-500 px-6 py-2 rounded-full">
                    <div className="text-black font-bold text-lg">DAILY GLOBAL EVENT</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Mission Thumbnail Badge - Reduced size */}
          {!isGlobal && (
            <div className="absolute top-6 left-6 w-24 h-24">
              <div className="relative w-full h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-800 rounded-2xl shadow-xl"></div>
                <div className="absolute inset-1.5 bg-black rounded-xl flex items-center justify-center">
                  <span className="text-4xl">⚙️</span>
                </div>
              </div>
            </div>
          )}
          
          <div className={`${isGlobal ? 'pt-36' : 'pt-8'} p-8`}>
            {/* Header Section - Reduced font sizes */}
            <div className={`${!isGlobal ? 'ml-28' : ''} mb-8`}>
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-bold mb-2">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                      {isGlobal ? `GLOBAL ${dailyVariation.toUpperCase()} EVENT` : 'Temporal Anomaly Zone'}
                    </span>
                  </h2>
                  <p className="text-gray-400 text-base">
                    {isGlobal ? `${dailyVariation} Meks receive 2x power boost` : 'Time-distorted region with unique rewards'}
                  </p>
                </div>
                
                {/* Bias Display - Reduced from 8xl to 5xl */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 blur-2xl"></div>
                  <div className="relative bg-black/60 rounded-2xl p-6 border-2 border-yellow-500/40">
                    <div className="text-5xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-yellow-400 to-orange-500">
                      {biasScore}
                    </div>
                    <div className="text-sm text-gray-400 text-center uppercase tracking-wider mt-2">Rarity Bias</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mission Details Row - Smaller padding and fonts */}
            <div className="bg-black/40 rounded-2xl p-6 border border-gray-700/50 mb-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">MISSION DURATION</div>
                  <div className="text-2xl font-bold text-yellow-400">{isGlobal ? '24H' : '5M'}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">ENTRY FEE</div>
                  <div className="text-2xl font-bold text-red-400">{isGlobal ? '50K' : '250'}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">TYPE</div>
                  <div className="text-2xl font-bold text-blue-400">{isGlobal ? '⚗️' : '⚙️'}</div>
                </div>
              </div>
            </div>
            
            {/* Squad Deployment - Smaller slots */}
            <div className="bg-black/40 rounded-2xl p-6 border border-gray-700/50 mb-6">
              <h3 className="text-base font-bold text-yellow-400 uppercase tracking-wider mb-4">Squad Deployment</h3>
              <div className="grid grid-cols-8 gap-2">
                {Array.from({ length: isGlobal ? 10 : 4 }).map((_, i) => {
                  const mek = meks[i];
                  return (
                    <div key={i} className="relative group cursor-pointer">
                      {/* Epic Socket Design - Smaller */}
                      <div className="aspect-square relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/30 via-orange-500/20 to-yellow-600/30 rounded-lg blur-sm group-hover:blur-md transition-all"></div>
                        <div className="relative w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-lg p-1">
                          <div className="w-full h-full bg-black rounded-md border-2 border-yellow-500/20 group-hover:border-yellow-400/60 transition-all flex items-center justify-center">
                            {mek ? (
                              <div className="text-xs text-yellow-400 text-center p-1">{mek.name}</div>
                            ) : (
                              <>
                                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 rounded-md"></div>
                                <div className="text-3xl text-yellow-500/30 group-hover:text-yellow-400/60 transition-all z-10">+</div>
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
                <div className="mt-4 text-center text-green-400 font-bold text-lg">
                  Squad Bonus: {(1 + meks.length * 0.1).toFixed(1)}x
                </div>
              )}
            </div>
            
            {/* FULL WIDTH Rewards - Smaller heights */}
            <div className="space-y-6">
              {/* Gold Distribution - FULL WIDTH */}
              <div className="bg-black/40 rounded-2xl p-6 border border-gray-700/50">
                <h3 className="text-base font-bold text-yellow-400 uppercase tracking-wider mb-4">Gold Rewards Distribution</h3>
                <div className="h-28 flex items-end gap-1">
                  {goldDist.map((item, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end relative group">
                      <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="text-xs text-yellow-400 whitespace-nowrap">
                          {(item.value/1000).toFixed(0)}k
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-500 mb-1">{item.probability.toFixed(0)}%</div>
                      <div
                        className="w-full bg-gradient-to-t from-yellow-600 via-yellow-500 to-yellow-400 rounded-t hover:brightness-110 transition-all"
                        style={{ height: `${(item.probability / 100) * 100}px` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Essence Distribution - FULL WIDTH with 7 types */}
              <div className="bg-black/40 rounded-2xl p-6 border border-gray-700/50">
                <h3 className="text-base font-bold text-yellow-400 uppercase tracking-wider mb-4">
                  Essence Rewards ({isGlobal ? 25 : 1}x Drop Rate)
                </h3>
                <div className="flex items-end gap-3 h-28">
                  {essenceProbs.map((prob, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div className="text-xs text-gray-400 mb-1">{prob.toFixed(0)}%</div>
                      <div
                        className="w-full rounded-t transition-all hover:brightness-125"
                        style={{
                          height: `${(prob / 100) * 80}px`,
                          backgroundColor: essenceTypes[i].color,
                          boxShadow: `0 0 20px ${essenceTypes[i].color}60`
                        }}
                      />
                      <div className="mt-2 w-8 h-8">
                        <Image
                          src={essenceTypes[i].image}
                          alt={essenceTypes[i].name}
                          width={32}
                          height={32}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{essenceTypes[i].name}</div>
                    </div>
                  ))}
                </div>
                
                {/* Special Drop for Global */}
                {isGlobal && (
                  <div className="mt-4 bg-gradient-to-r from-purple-900/50 to-purple-800/50 rounded-xl p-4 border border-purple-500/40">
                    <div className="flex justify-between items-center">
                      <span className="text-purple-300 text-base">{dailyVariation} Chip Drop Chance:</span>
                      <span className="text-2xl font-bold text-purple-400">8.1%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Embark Button - Smaller */}
            <button
              disabled={meks.length === 0}
              className={`w-full mt-8 py-5 font-bold text-xl rounded-2xl transition-all transform hover:scale-[1.02] ${
                meks.length > 0
                  ? isGlobal
                    ? 'bg-gradient-to-r from-yellow-500 via-orange-500 to-purple-500 text-black shadow-[0_8px_30px_rgba(250,182,23,0.4)]'
                    : 'bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-xl'
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
        <h1 className="text-4xl font-bold text-yellow-400 mb-8 text-center">CONTRACTS - Layout Option 9</h1>
        <p className="text-center text-gray-400 mb-16">Option 7 with 30% reduced scaling - Cleaner, less bulky</p>
        
        <div className="space-y-16">
          {renderContract(null, true)}
          {renderContract({ id: 'c1', duration: { displayLabel: '1 HR', slots: 2, goldFee: 1500, essenceReward: 2, goldReward: { min: 500, max: 3000 } } }, false)}
        </div>
      </div>
    </div>
  );
}