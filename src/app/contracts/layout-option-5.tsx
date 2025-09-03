"use client";

import { useState } from "react";
import Image from "next/image";

const essenceTypes = [
  { id: "angler", name: "Angler", image: "/variation-images/angler.png", color: "#00CED1" },
  { id: "arctic", name: "Arctic", image: "/variation-images/arctic.png", color: "#E0FFFF" },
  { id: "baby", name: "Baby", image: "/variation-images/baby.png", color: "#FFB6C1" },
  { id: "ballerina", name: "Ballet", image: "/variation-images/ballerina.png", color: "#FF69B4" },
  { id: "bag", name: "Bag", image: "/variation-images/bag.png", color: "#8B4513" },
];

export default function ContractsLayoutOption5() {
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
  
  const renderContract = (isGlobal: boolean = false) => {
    const biasScore = calculateBiasScore(isGlobal ? "daily" : "contract1");
    const meks = isGlobal ? dailyMeks : (selectedMeks["contract1"] || []);
    const goldDist = calculateGoldDistribution(
      isGlobal ? 50000 : 2000,
      isGlobal ? 500000 : 10000,
      biasScore
    );
    const essenceProbs = calculateEssenceProbabilities(biasScore);
    
    return (
      <div className="relative">
        {/* WoW Garrison Style Layout */}
        <div className={`relative ${isGlobal ? 'shadow-[0_0_50px_rgba(250,182,23,0.3)]' : 'shadow-2xl'}`}>
          
          {/* Global Mission Floating Badge */}
          {isGlobal && (
            <div className="absolute -top-32 left-1/2 transform -translate-x-1/2 z-50">
              <div className="relative">
                {/* Animated Glow Ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 via-purple-500 to-yellow-400 blur-2xl opacity-60 animate-pulse"></div>
                
                {/* Main Badge */}
                <div className="relative w-64 h-64 rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-purple-600 p-[3px]">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
                    <Image
                      src={`/variation-images/${dailyVariation.toLowerCase()}.png`}
                      alt={dailyVariation}
                      width={220}
                      height={220}
                      className="w-full h-full object-contain rounded-full"
                    />
                  </div>
                </div>
                
                {/* Title Banner */}
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                  <div className="relative">
                    <div className="bg-gradient-to-r from-purple-700 via-yellow-500 to-purple-700 px-10 py-3 rounded-full shadow-2xl">
                      <div className="text-black font-black text-2xl tracking-wider">DAILY GLOBAL</div>
                    </div>
                    <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                      <div className="text-xs text-yellow-400 bg-black px-3 py-1 rounded-full border border-yellow-500/50">
                        {dailyVariation.toUpperCase()} EVENT
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Main Content Card */}
          <div className={`relative bg-gradient-to-b ${isGlobal ? 'from-yellow-900/10 via-black/95 to-purple-900/10' : 'from-gray-900/90 to-black/95'} backdrop-blur-2xl rounded-3xl border-2 ${isGlobal ? 'border-yellow-500/50' : 'border-gray-700/50'} overflow-hidden`}>
            
            {/* Mission Header Bar */}
            <div className={`${isGlobal ? 'mt-40' : 'mt-0'} bg-gradient-to-r ${isGlobal ? 'from-purple-900/50 via-black/50 to-yellow-900/50' : 'from-gray-800/50 to-black/50'} border-b border-gray-700/50 px-8 py-6`}>
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-500">
                    {isGlobal ? `${dailyVariation.toUpperCase()} GLOBAL EVENT` : 'SALVAGE OPERATION'}
                  </h2>
                  <p className="text-gray-400 mt-1">
                    {isGlobal ? `${dailyVariation} units receive 2x effectiveness and exclusive rewards` : 'Abandoned station contains valuable technology'}
                  </p>
                </div>
                
                {/* Mission Icon */}
                {!isGlobal && (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 p-1 shadow-xl">
                    <div className="w-full h-full rounded-xl bg-black flex items-center justify-center">
                      <span className="text-4xl">⚙️</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Mission Details Section */}
            <div className="p-8">
              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-black/50 rounded-xl p-4 border border-gray-700/50 text-center">
                  <div className="text-xs text-gray-500 uppercase mb-1">Mission Duration</div>
                  <div className="text-3xl font-bold text-yellow-400">{isGlobal ? '24H' : '2H'}</div>
                </div>
                <div className="bg-black/50 rounded-xl p-4 border border-gray-700/50 text-center">
                  <div className="text-xs text-gray-500 uppercase mb-1">Entry Fee</div>
                  <div className="text-3xl font-bold text-red-400">{isGlobal ? '50K' : '2K'}</div>
                </div>
                <div className="bg-black/50 rounded-xl p-4 border border-gray-700/50 text-center">
                  <div className="text-xs text-gray-500 uppercase mb-1">Squad Size</div>
                  <div className="text-3xl font-bold text-blue-400">{isGlobal ? '10' : '3'}</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 rounded-xl p-4 border border-yellow-500/50 text-center">
                  <div className="text-xs text-gray-400 uppercase mb-1">Rarity Bias</div>
                  <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-orange-500">
                    {biasScore}
                  </div>
                </div>
              </div>
              
              {/* Squad & Rewards Section */}
              <div className="grid grid-cols-2 gap-8">
                {/* Left: Squad Assignment */}
                <div className="bg-black/30 rounded-2xl p-6 border border-gray-800/50">
                  <h3 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
                    <span className="text-2xl">⚔️</span> SQUAD DEPLOYMENT
                  </h3>
                  
                  <div className="grid grid-cols-5 gap-3 mb-4">
                    {Array.from({ length: isGlobal ? 10 : 3 }).map((_, i) => {
                      const mek = meks[i];
                      return (
                        <div key={i} className="relative group cursor-pointer">
                          {/* Epic Socket Design */}
                          <div className="aspect-square relative">
                            {/* Outer Glow */}
                            <div className="absolute -inset-1 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-all"></div>
                            
                            {/* Socket Frame */}
                            <div className="relative w-full h-full rounded-xl overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black"></div>
                              <div className="absolute inset-[2px] bg-black rounded-xl"></div>
                              <div className="absolute inset-[4px] bg-gradient-to-br from-gray-900 to-black rounded-lg border-2 border-yellow-500/20 group-hover:border-yellow-400/50 transition-all">
                                {mek ? (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <div className="text-[9px] text-yellow-400 text-center">{mek.name}</div>
                                  </div>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <div className="relative">
                                      <div className="absolute inset-0 w-12 h-12 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all"></div>
                                      <span className="relative text-3xl text-gray-700 group-hover:text-yellow-500/60 transition-all">+</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {meks.length > 0 && (
                    <div className="bg-green-900/30 rounded-lg p-3 border border-green-500/30">
                      <div className="flex justify-between items-center">
                        <span className="text-green-400 text-sm">Squad Effectiveness:</span>
                        <span className="text-2xl font-bold text-green-400">{(1 + meks.length * 0.1).toFixed(1)}x</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Right: Rewards */}
                <div className="bg-black/30 rounded-2xl p-6 border border-gray-800/50">
                  <h3 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
                    <span className="text-2xl">💰</span> MISSION REWARDS
                  </h3>
                  
                  {/* Gold Graph */}
                  <div className="mb-4">
                    <div className="text-xs text-gray-500 uppercase mb-2">Gold Distribution</div>
                    <div className="bg-black/50 rounded-lg p-3 border border-gray-700/50">
                      <div className="flex items-end gap-[2px] h-16">
                        {goldDist.map((item, i) => (
                          <div key={i} className="flex-1 relative group">
                            <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="text-[8px] text-yellow-400 whitespace-nowrap bg-black px-1 rounded">
                                {(item.value/1000).toFixed(0)}k
                              </div>
                            </div>
                            <div className="text-[7px] text-gray-500 text-center mb-1">{item.probability.toFixed(0)}%</div>
                            <div
                              className="w-full bg-gradient-to-t from-yellow-700 to-yellow-400 rounded-t hover:brightness-110 transition-all"
                              style={{ height: `${Math.max(4, (item.probability / 100) * 60)}px` }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Essence Graph */}
                  <div>
                    <div className="text-xs text-gray-500 uppercase mb-2">Essence Rewards ({isGlobal ? 25 : 4}x)</div>
                    <div className="bg-black/50 rounded-lg p-3 border border-gray-700/50">
                      <div className="flex items-end gap-2 h-20">
                        {essenceProbs.map((prob, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center">
                            <div className="text-[9px] text-gray-400">{prob.toFixed(0)}%</div>
                            <div
                              className="w-full rounded"
                              style={{
                                height: `${Math.max(8, (prob / 100) * 50)}px`,
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
                            <div className="text-[8px] text-gray-400 mt-1">{essenceTypes[i].name}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {isGlobal && (
                    <div className="mt-4 bg-gradient-to-r from-purple-900/50 to-purple-800/50 rounded-xl p-4 border border-purple-500/40">
                      <div className="flex justify-between items-center">
                        <span className="text-purple-300">{dailyVariation} Chip Drop Chance:</span>
                        <span className="text-3xl font-bold text-purple-400">8.1%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Embark Button */}
              <button
                disabled={meks.length === 0}
                className={`w-full mt-8 relative overflow-hidden group ${
                  meks.length > 0
                    ? isGlobal
                      ? 'bg-gradient-to-r from-purple-600 via-yellow-500 to-purple-600'
                      : 'bg-gradient-to-r from-green-600 to-emerald-500'
                    : 'bg-gray-800/60'
                } py-6 rounded-2xl font-black text-2xl tracking-wider transition-all transform hover:scale-[1.02] ${
                  meks.length > 0 ? 'shadow-2xl' : ''
                }`}
              >
                {/* Button Shine Effect */}
                {meks.length > 0 && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                )}
                <span className={`relative z-10 ${meks.length > 0 ? (isGlobal ? 'text-black' : 'text-white') : 'text-gray-600'}`}>
                  {meks.length === 0 ? "DEPLOY SQUAD TO EMBARK" : "EMBARK ON MISSION"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-yellow-400 mb-8 text-center">CONTRACTS - Layout Option 5</h1>
        <p className="text-center text-gray-400 mb-20">WoW Garrison-inspired with detailed stats and epic sockets</p>
        
        <div className="space-y-24">
          {renderContract(true)}
          {renderContract(false)}
        </div>
      </div>
    </div>
  );
}