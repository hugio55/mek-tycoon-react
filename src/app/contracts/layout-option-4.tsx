"use client";

import { useState } from "react";
import Image from "next/image";

const essenceTypes = [
  { id: "bullish", name: "Bullish", image: "/variation-images/bullish.png", color: "#FFD700" },
  { id: "security", name: "Security", image: "/variation-images/security.png", color: "#DC143C" },
  { id: "tiles", name: "Tiles", image: "/variation-images/tiles.png", color: "#4682B4" },
  { id: "flashbulb", name: "Flash", image: "/variation-images/flashbulb.png", color: "#FFFF00" },
  { id: "accordion", name: "Music", image: "/variation-images/accordion.png", color: "#9370DB" },
];

export default function ContractsLayoutOption4() {
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
      isGlobal ? 50000 : 1000,
      isGlobal ? 500000 : 5000,
      biasScore
    );
    const essenceProbs = calculateEssenceProbabilities(biasScore);
    
    return (
      <div className="relative">
        {/* Main Card */}
        <div className={`relative ${isGlobal ? 'bg-gradient-to-b from-purple-900/20 via-black/90 to-yellow-900/20' : 'bg-black/80'} backdrop-blur-xl rounded-[2rem] overflow-hidden`}>
          
          {/* Decorative Border */}
          <div className={`absolute inset-0 rounded-[2rem] bg-gradient-to-br ${isGlobal ? 'from-yellow-500/20 via-purple-500/20 to-yellow-500/20' : 'from-gray-700/20 to-gray-800/20'} p-[2px]`}>
            <div className="w-full h-full bg-black rounded-[2rem]"></div>
          </div>
          
          {/* Global Mission Hero Badge */}
          {isGlobal && (
            <div className="absolute -top-28 left-1/2 transform -translate-x-1/2 z-50">
              <div className="relative">
                <div className="w-56 h-56">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-purple-500 to-yellow-400 rounded-full animate-spin-slow opacity-50 blur-xl"></div>
                  <div className="relative w-full h-full rounded-full bg-gradient-to-br from-yellow-500 to-purple-600 p-2">
                    <div className="w-full h-full rounded-full bg-black p-4">
                      <Image
                        src={`/variation-images/${dailyVariation.toLowerCase()}.png`}
                        alt={dailyVariation}
                        width={200}
                        height={200}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 via-yellow-500 to-purple-600 px-8 py-3 rounded-full shadow-2xl">
                  <div className="text-black font-black text-xl tracking-wider">DAILY GLOBAL</div>
                </div>
              </div>
            </div>
          )}
          
          {/* Regular Mission Badge */}
          {!isGlobal && (
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl p-2 shadow-2xl">
                <div className="bg-black rounded-xl px-6 py-3">
                  <div className="text-yellow-400 font-bold text-lg">SALVAGE MISSION</div>
                </div>
              </div>
            </div>
          )}
          
          <div className={`relative z-10 p-10 ${isGlobal ? 'pt-36' : 'pt-16'}`}>
            {/* Mission Title & Info Bar */}
            <div className="text-center mb-8">
              <h2 className="text-4xl font-black mb-3">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-500">
                  {isGlobal ? `${dailyVariation.toUpperCase()} SURGE` : 'DERELICT STATION'}
                </span>
              </h2>
              <p className="text-gray-400 text-lg mb-6">
                {isGlobal ? `All ${dailyVariation} units gain 2x effectiveness` : 'High-value salvage opportunity detected'}
              </p>
              
              {/* Info Pills */}
              <div className="flex justify-center gap-3 mb-6">
                <div className="bg-black/60 rounded-full px-6 py-3 border border-gray-700">
                  <span className="text-gray-500 text-sm mr-2">DURATION:</span>
                  <span className="text-yellow-400 font-bold text-lg">{isGlobal ? '24 HRS' : '1 HR'}</span>
                </div>
                <div className="bg-black/60 rounded-full px-6 py-3 border border-gray-700">
                  <span className="text-gray-500 text-sm mr-2">FEE:</span>
                  <span className="text-red-400 font-bold text-lg">{isGlobal ? '50,000' : '1,500'} G</span>
                </div>
                <div className="bg-gradient-to-r from-yellow-900/50 to-orange-900/50 rounded-full px-6 py-3 border border-yellow-500/50">
                  <span className="text-gray-400 text-sm mr-2">BIAS:</span>
                  <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-500">
                    {biasScore}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Main Content Area */}
            <div className="bg-black/40 rounded-2xl p-8 border border-gray-800">
              <div className="grid grid-cols-3 gap-8">
                {/* Mek Deployment */}
                <div>
                  <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-4">Deploy Units</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: isGlobal ? 6 : 4 }).map((_, i) => {
                      const mek = meks[i];
                      return (
                        <div key={i} className="relative group">
                          <div className="aspect-square rounded-xl overflow-hidden">
                            {/* Glow Background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            
                            {/* Socket Frame */}
                            <div className="relative w-full h-full bg-gradient-to-br from-gray-800 via-gray-900 to-black p-[2px]">
                              <div className="w-full h-full bg-black rounded-xl border-2 border-dashed border-yellow-500/30 group-hover:border-yellow-500/60 transition-all flex items-center justify-center">
                                {mek ? (
                                  <div className="text-xs text-yellow-400 text-center p-2">{mek.name}</div>
                                ) : (
                                  <>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500/10 to-orange-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    </div>
                                    <span className="text-4xl text-gray-700 group-hover:text-yellow-500/60 transition-colors z-10">+</span>
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
                    <div className="mt-4 text-center">
                      <div className="text-green-400 font-bold">Multiplier: {(1 + meks.length * 0.1).toFixed(1)}x</div>
                    </div>
                  )}
                </div>
                
                {/* Gold Rewards */}
                <div>
                  <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-4">Gold Distribution</h3>
                  <div className="bg-gradient-to-br from-gray-900/50 to-black/50 rounded-xl p-4 border border-gray-800">
                    <div className="flex items-end gap-[2px] h-28">
                      {goldDist.map((item, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center justify-end">
                          {(i === 0 || i === 4 || i === 9) && (
                            <div className="text-[9px] text-gray-500 mb-1">{item.probability.toFixed(0)}%</div>
                          )}
                          <div
                            className="w-full bg-gradient-to-t from-yellow-700 via-yellow-500 to-yellow-400 rounded-sm transition-all hover:brightness-110"
                            style={{ height: `${Math.max(8, (item.probability / 100) * 100)}px` }}
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
                  <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-4">
                    Essence ({isGlobal ? 25 : 2}x Rate)
                  </h3>
                  <div className="bg-gradient-to-br from-gray-900/50 to-black/50 rounded-xl p-4 border border-gray-800">
                    <div className="flex items-end gap-2 h-28">
                      {essenceProbs.map((prob, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center">
                          <div className="text-[10px] text-gray-400 mb-1">{prob.toFixed(0)}%</div>
                          <div
                            className="w-full rounded-sm transition-all hover:brightness-125"
                            style={{
                              height: `${Math.max(10, (prob / 100) * 80)}px`,
                              backgroundColor: essenceTypes[i].color,
                              boxShadow: `0 4px 20px ${essenceTypes[i].color}40, inset 0 1px 0 ${essenceTypes[i].color}80`
                            }}
                          />
                          <div className="mt-2 w-6 h-6">
                            <Image
                              src={essenceTypes[i].image}
                              alt={essenceTypes[i].name}
                              width={24}
                              height={24}
                              className="w-full h-full"
                            />
                          </div>
                          <div className="text-[8px] text-gray-500 mt-1">{essenceTypes[i].name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {isGlobal && (
                    <div className="mt-3 bg-gradient-to-r from-purple-900/40 to-purple-800/40 rounded-lg p-3 border border-purple-500/30">
                      <div className="text-sm text-purple-300">
                        {dailyVariation} Chip Drop: <span className="text-xl font-bold text-purple-400">8.1%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Action Button */}
            <div className="mt-8 relative">
              <button
                disabled={meks.length === 0}
                className={`relative w-full py-5 font-black text-xl tracking-wider rounded-2xl transition-all transform hover:scale-[1.01] ${
                  meks.length > 0
                    ? isGlobal
                      ? 'bg-gradient-to-r from-purple-600 via-yellow-500 to-purple-600 text-black shadow-2xl'
                      : 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-xl'
                    : 'bg-gray-800/60 text-gray-600 cursor-not-allowed'
                }`}
              >
                <span className="relative z-10">
                  {meks.length === 0 ? "SELECT UNITS TO EMBARK" : "EMBARK ON MISSION"}
                </span>
                {meks.length > 0 && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity"></div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-yellow-400 mb-8 text-center">CONTRACTS - Layout Option 4</h1>
        <p className="text-center text-gray-400 mb-16">Centered design with info pills and 3-column rewards</p>
        
        <div className="space-y-20">
          {renderContract(true)}
          {renderContract(false)}
        </div>
      </div>
    </div>
  );
}