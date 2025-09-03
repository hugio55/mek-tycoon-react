"use client";

import { useState } from "react";
import Image from "next/image";

// 7 essence variations
const essenceTypes = [
  { id: "ice", name: "Ice", image: "/variation-images/ice.png", color: "#87CEEB" },
  { id: "acid", name: "Acid", image: "/variation-images/acid.png", color: "#32CD32" },
  { id: "bark", name: "Bark", image: "/variation-images/bark.png", color: "#8B4513" },
  { id: "bling", name: "Bling", image: "/variation-images/bling.png", color: "#FFD700" },
  { id: "blood", name: "Blood", image: "/variation-images/blood.png", color: "#8B0000" },
  { id: "arcade", name: "Arcade", image: "/variation-images/arcade.png", color: "#FF00FF" },
  { id: "aztec", name: "Aztec", image: "/variation-images/aztec.png", color: "#DAA520" },
];

export default function ContractsLayoutOption10() {
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
      const width = 0.35;
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
    const biasScore = calculateBiasScore(isGlobal ? "daily" : contract?.id || "contract1");
    const meks = isGlobal ? dailyMeks : (selectedMeks[contract?.id] || []);
    const goldDist = calculateGoldDistribution(
      isGlobal ? 50000 : 500,
      isGlobal ? 500000 : 3000,
      biasScore
    );
    const essenceProbs = calculateEssenceProbabilities(biasScore);
    
    return (
      <div className="relative">
        {/* Variation 2: Side-by-side layout with left panel for mission info */}
        <div className={`relative ${isGlobal ? 'bg-gradient-to-r from-yellow-900/20 via-black/80 to-purple-900/20' : 'bg-black/70'} backdrop-blur-md rounded-xl border-2 ${isGlobal ? 'border-yellow-500/50 shadow-[0_0_30px_rgba(250,182,23,0.25)]' : 'border-gray-700/50'}`}>
          
          {/* Global Badge - Compact floating design */}
          {isGlobal && (
            <div className="absolute -top-24 left-1/2 transform -translate-x-1/2 z-40">
              <div className="relative">
                <div className="w-48 h-48 rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-purple-600 p-1 animate-pulse">
                  <div className="w-full h-full rounded-full bg-black p-2">
                    <Image
                      src={`/variation-images/${dailyVariation.toLowerCase()}.png`}
                      alt={dailyVariation}
                      width={170}
                      height={170}
                      className="w-full h-full object-contain rounded-full"
                    />
                  </div>
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-yellow-500 px-5 py-1.5 rounded-full">
                  <div className="text-black font-bold text-base">DAILY GLOBAL</div>
                </div>
              </div>
            </div>
          )}
          
          <div className={`${isGlobal ? 'pt-32' : ''} p-7`}>
            <div className="grid grid-cols-3 gap-6">
              {/* Left Column - Mission Info */}
              <div className="space-y-4">
                {/* Mission Header */}
                <div>
                  <h2 className="text-2xl font-bold text-yellow-400 mb-2">
                    {isGlobal ? `${dailyVariation.toUpperCase()} EVENT` : 'Salvage Run'}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {isGlobal ? `${dailyVariation} units: 2x power` : 'Abandoned station salvage'}
                  </p>
                </div>
                
                {/* Mission Stats */}
                <div className="bg-black/50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">DURATION</span>
                    <span className="text-xl font-bold text-yellow-400">{isGlobal ? '24H' : '1H'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">ENTRY FEE</span>
                    <span className="text-xl font-bold text-red-400">{isGlobal ? '50K' : '1.5K'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">SLOTS</span>
                    <span className="text-xl font-bold text-blue-400">{isGlobal ? '10' : '3'}</span>
                  </div>
                </div>
                
                {/* Bias Score */}
                <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 rounded-lg p-4 border border-yellow-500/30 text-center">
                  <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-orange-500">
                    {biasScore}
                  </div>
                  <div className="text-xs text-gray-400 uppercase mt-1">Rarity Bias</div>
                </div>
                
                {/* Squad Slots - Vertical */}
                <div className="space-y-2">
                  <h3 className="text-sm text-gray-400 uppercase">Squad</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: isGlobal ? 6 : 3 }).map((_, i) => {
                      const mek = meks[i];
                      return (
                        <div key={i} className="relative group cursor-pointer">
                          <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-1">
                            <div className="w-full h-full bg-black rounded-md border-2 border-yellow-500/20 group-hover:border-yellow-400/50 transition-all flex items-center justify-center">
                              {mek ? (
                                <div className="text-[10px] text-yellow-400 text-center">{mek.name}</div>
                              ) : (
                                <div className="text-2xl text-gray-600 group-hover:text-yellow-500/50">+</div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* Right Column - Rewards (2 cols wide) */}
              <div className="col-span-2 space-y-5">
                {/* Gold Distribution */}
                <div className="bg-black/40 rounded-xl p-5 border border-gray-700/50">
                  <h3 className="text-sm font-bold text-yellow-400 uppercase mb-3">Gold Distribution</h3>
                  <div className="h-24 flex items-end gap-1">
                    {goldDist.map((item, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end">
                        {(i === 0 || i === 7 || i === 14) && (
                          <div className="text-[9px] text-gray-500 mb-1">{item.probability.toFixed(0)}%</div>
                        )}
                        <div
                          className="w-full bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-t"
                          style={{ height: `${(item.probability / 100) * 80}px` }}
                        />
                        {(i === 0 || i === 14) && (
                          <div className="text-[9px] text-gray-600 mt-1">{(item.value/1000).toFixed(0)}k</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Essence Rewards */}
                <div className="bg-black/40 rounded-xl p-5 border border-gray-700/50">
                  <h3 className="text-sm font-bold text-yellow-400 uppercase mb-3">
                    Essence ({isGlobal ? 25 : 2}x)
                  </h3>
                  <div className="flex items-end gap-2 h-24">
                    {essenceProbs.map((prob, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center">
                        <div className="text-[10px] text-gray-400">{prob.toFixed(0)}%</div>
                        <div
                          className="w-full rounded"
                          style={{
                            height: `${(prob / 100) * 70}px`,
                            backgroundColor: essenceTypes[i].color,
                            boxShadow: `0 0 15px ${essenceTypes[i].color}50`
                          }}
                        />
                        <Image
                          src={essenceTypes[i].image}
                          alt={essenceTypes[i].name}
                          width={28}
                          height={28}
                          className="mt-2"
                        />
                        <div className="text-[10px] text-gray-400 mt-1">{essenceTypes[i].name}</div>
                      </div>
                    ))}
                  </div>
                  
                  {isGlobal && (
                    <div className="mt-3 bg-purple-900/40 rounded-lg p-3 border border-purple-500/30 flex justify-between items-center">
                      <span className="text-purple-300 text-sm">{dailyVariation} Chip Drop:</span>
                      <span className="text-xl font-bold text-purple-400">8.1%</span>
                    </div>
                  )}
                </div>
                
                {/* Embark Button */}
                <button
                  disabled={meks.length === 0}
                  className={`w-full py-4 font-bold text-lg rounded-xl transition-all ${
                    meks.length > 0
                      ? isGlobal
                        ? 'bg-gradient-to-r from-yellow-500 via-orange-500 to-purple-500 text-black shadow-lg'
                        : 'bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-lg'
                      : 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  {meks.length === 0 ? "SELECT MEKS" : "EMBARK"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-yellow-400 mb-8 text-center">CONTRACTS - Layout Option 10</h1>
        <p className="text-center text-gray-400 mb-14">Variation 2: Side-by-side layout with compact left panel</p>
        
        <div className="space-y-14">
          {renderContract(null, true)}
          {renderContract({ id: 'c1' }, false)}
        </div>
      </div>
    </div>
  );
}