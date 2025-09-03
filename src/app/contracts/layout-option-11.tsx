"use client";

import { useState } from "react";
import Image from "next/image";

// 7 essence variations
const essenceTypes = [
  { id: "angler", name: "Angler", image: "/variation-images/angler.png", color: "#00CED1" },
  { id: "baby", name: "Baby", image: "/variation-images/baby.png", color: "#FFB6C1" },
  { id: "ballerina", name: "Ballet", image: "/variation-images/ballerina.png", color: "#FF69B4" },
  { id: "blush", name: "Blush", image: "/variation-images/blush.png", color: "#FF1493" },
  { id: "bone", name: "Bone", image: "/variation-images/bone.png", color: "#F5F5DC" },
  { id: "chrome", name: "Chrome", image: "/variation-images/chrome.png", color: "#C0C0C0" },
  { id: "24k", name: "24K Gold", image: "/variation-images/24k.png", color: "#FFD700" },
];

export default function ContractsLayoutOption11() {
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
    
    for (let i = 0; i < 12; i++) {
      const value = min + ((max - min) / 11) * i;
      const position = i / 11;
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
      isGlobal ? 50000 : 1000,
      isGlobal ? 500000 : 5000,
      biasScore
    );
    const essenceProbs = calculateEssenceProbabilities(biasScore);
    
    return (
      <div className="relative">
        {/* Variation 3: Stacked layout with mission info on top */}
        <div className={`relative ${isGlobal ? 'bg-gradient-to-b from-yellow-900/15 via-black/85 to-purple-900/15' : 'bg-gradient-to-b from-gray-900/60 to-black/80'} backdrop-blur-lg rounded-2xl border-2 ${isGlobal ? 'border-yellow-500/40' : 'border-gray-700/40'} overflow-visible`}>
          
          {/* Global Badge - Integrated into header */}
          {isGlobal && (
            <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 z-40">
              <div className="w-40 h-40 rounded-full bg-gradient-to-br from-yellow-400 to-purple-600 p-1">
                <div className="w-full h-full rounded-full bg-black p-2">
                  <Image
                    src={`/variation-images/${dailyVariation.toLowerCase()}.png`}
                    alt={dailyVariation}
                    width={140}
                    height={140}
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Header Bar */}
          <div className={`${isGlobal ? 'pt-24 pb-6' : 'py-6'} px-8 bg-black/30 border-b border-gray-700/50`}>
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                  {isGlobal ? `GLOBAL ${dailyVariation.toUpperCase()} EVENT` : 'DERELICT STATION ALPHA'}
                </h2>
                <p className="text-gray-400 mt-1">
                  {isGlobal ? `${dailyVariation} Meks receive 2x effectiveness boost` : 'High-value salvage opportunity'}
                </p>
              </div>
              
              {/* Quick Stats */}
              <div className="flex gap-3">
                <div className="text-center bg-black/50 rounded-lg px-4 py-2 border border-gray-700">
                  <div className="text-[10px] text-gray-500">DURATION</div>
                  <div className="text-lg font-bold text-yellow-400">{isGlobal ? '24H' : '2H'}</div>
                </div>
                <div className="text-center bg-black/50 rounded-lg px-4 py-2 border border-gray-700">
                  <div className="text-[10px] text-gray-500">FEE</div>
                  <div className="text-lg font-bold text-red-400">{isGlobal ? '50K' : '2K'}</div>
                </div>
                <div className="text-center bg-gradient-to-br from-yellow-900/40 to-orange-900/40 rounded-lg px-5 py-2 border border-yellow-500/40">
                  <div className="text-[10px] text-gray-400">BIAS</div>
                  <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-orange-500">
                    {biasScore}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {/* Squad Assignment - Horizontal strip */}
            <div className="bg-black/30 rounded-xl p-4 border border-gray-700/40 mb-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm text-gray-400 uppercase">Deploy Squad</h3>
                {meks.length > 0 && (
                  <span className="text-green-400 font-bold">Bonus: {(1 + meks.length * 0.1).toFixed(1)}x</span>
                )}
              </div>
              <div className="flex gap-2 mt-3">
                {Array.from({ length: isGlobal ? 10 : 5 }).map((_, i) => {
                  const mek = meks[i];
                  return (
                    <div key={i} className="flex-1 relative group cursor-pointer">
                      <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-1">
                        <div className="w-full h-full bg-black rounded-md border-2 border-yellow-500/20 group-hover:border-yellow-400/50 transition-all flex items-center justify-center">
                          {mek ? (
                            <div className="text-[9px] text-yellow-400 text-center p-1">{mek.name}</div>
                          ) : (
                            <>
                              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                              <div className="text-2xl text-gray-600 group-hover:text-yellow-500/50">+</div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* FULL WIDTH Rewards - From Option 9 */}
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
              </div>
            </div>
            
            {/* Special Global Reward */}
            {isGlobal && (
              <div className="mt-4 bg-gradient-to-r from-purple-900/40 to-purple-800/40 rounded-xl p-4 border border-purple-500/30">
                <div className="flex justify-between items-center">
                  <span className="text-purple-300">{dailyVariation} Chip Drop Chance:</span>
                  <span className="text-2xl font-bold text-purple-400">8.1%</span>
                </div>
              </div>
            )}
            
            {/* Embark Button */}
            <button
              disabled={meks.length === 0}
              className={`w-full mt-5 py-4 font-bold text-xl rounded-xl transition-all transform hover:scale-[1.01] ${
                meks.length > 0
                  ? isGlobal
                    ? 'bg-gradient-to-r from-yellow-500 via-orange-500 to-purple-500 text-black shadow-[0_6px_20px_rgba(250,182,23,0.3)]'
                    : 'bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-lg'
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
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-yellow-400 mb-8 text-center">CONTRACTS - Layout Option 11</h1>
        <p className="text-center text-gray-400 mb-14">Variation 3: Stacked layout with integrated header</p>
        
        <div className="space-y-12">
          {renderContract(null, true)}
          {renderContract({ id: 'c1' }, false)}
        </div>
      </div>
    </div>
  );
}