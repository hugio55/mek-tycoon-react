"use client";

import { useState } from "react";
import Image from "next/image";

// 7 essence variations
const essenceTypes = [
  { id: "paul", name: "Paul", image: "/variation-images/paul.png", color: "#4169E1" },
  { id: "bullish", name: "Bullish", image: "/variation-images/bullish.png", color: "#FFD700" },
  { id: "security", name: "Security", image: "/variation-images/security.png", color: "#DC143C" },
  { id: "tiles", name: "Tiles", image: "/variation-images/tiles.png", color: "#4682B4" },
  { id: "flashbulb", name: "Flash", image: "/variation-images/flashbulb.png", color: "#FFFF00" },
  { id: "accordion", name: "Music", image: "/variation-images/accordion.png", color: "#9370DB" },
  { id: "turret", name: "Turret", image: "/variation-images/turret.png", color: "#FF8C00" },
];

export default function ContractsLayoutOption8() {
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
        {/* Main Card - Hybrid of Option 2 & 3 */}
        <div className={`relative ${isGlobal ? 'shadow-[0_0_80px_rgba(250,182,23,0.5)]' : 'shadow-2xl'}`}>
          
          {/* Global Mission Floating Badge - MASSIVE */}
          {isGlobal && (
            <div className="absolute -top-44 left-1/2 transform -translate-x-1/2 z-50">
              <div className="relative">
                {/* Animated Glow Rings */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 via-purple-500 to-yellow-400 blur-3xl opacity-60 animate-pulse"></div>
                <div className="absolute inset-4 rounded-full bg-gradient-to-r from-purple-400 via-yellow-500 to-purple-400 blur-2xl opacity-40 animate-pulse animation-delay-500"></div>
                
                {/* Main Badge */}
                <div className="relative w-96 h-96 rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-purple-600 p-[4px]">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-900 via-black to-gray-900 p-8">
                    <Image
                      src={`/variation-images/${dailyVariation.toLowerCase()}.png`}
                      alt={dailyVariation}
                      width={320}
                      height={320}
                      className="w-full h-full object-contain rounded-full"
                    />
                  </div>
                </div>
                
                {/* Title Banners */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                  <div className="relative">
                    <div className="bg-gradient-to-r from-purple-700 via-yellow-500 to-purple-700 px-12 py-4 rounded-full shadow-2xl">
                      <div className="text-black font-black text-3xl tracking-wider">DAILY GLOBAL</div>
                    </div>
                    <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                      <div className="text-sm text-yellow-400 bg-black px-4 py-2 rounded-full border-2 border-yellow-500/50">
                        {dailyVariation.toUpperCase()} SURGE EVENT
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Main Content Card */}
          <div className={`relative bg-gradient-to-b ${isGlobal ? 'from-yellow-900/15 via-black/95 to-purple-900/15' : 'from-gray-900/90 to-black/95'} backdrop-blur-2xl rounded-[3rem] border-3 ${isGlobal ? 'border-yellow-500/60' : 'border-gray-700/60'} overflow-hidden`}>
            
            {/* Mission Header Bar */}
            <div className={`${isGlobal ? 'mt-56' : 'mt-0'} bg-gradient-to-r ${isGlobal ? 'from-purple-900/30 via-black/50 to-yellow-900/30' : 'from-gray-800/50 to-black/50'} border-b-2 border-gray-700/50 px-10 py-8`}>
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-500 mb-3">
                    {isGlobal ? `${dailyVariation.toUpperCase()} GLOBAL EVENT` : 'SALVAGE OPERATION ALPHA'}
                  </h2>
                  <p className="text-gray-400 text-2xl">
                    {isGlobal ? `All ${dailyVariation} units receive 2x effectiveness and exclusive rewards` : 'Abandoned station contains valuable technology'}
                  </p>
                  
                  {/* Quick Info Pills */}
                  <div className="flex gap-4 mt-6">
                    <div className="bg-black/60 rounded-full px-8 py-4 border border-gray-700">
                      <span className="text-gray-500 text-sm mr-3">MISSION DURATION:</span>
                      <span className="text-yellow-400 font-bold text-3xl">{isGlobal ? '24H' : '2H'}</span>
                    </div>
                    <div className="bg-black/60 rounded-full px-8 py-4 border border-gray-700">
                      <span className="text-gray-500 text-sm mr-3">ENTRY FEE:</span>
                      <span className="text-red-400 font-bold text-3xl">{isGlobal ? '50K' : '2K'} GOLD</span>
                    </div>
                  </div>
                </div>
                
                {/* Mission Icon for Regular */}
                {!isGlobal && (
                  <div className="w-40 h-40 rounded-3xl bg-gradient-to-br from-gray-700 to-gray-900 p-2 shadow-2xl">
                    <div className="w-full h-full rounded-2xl bg-black flex items-center justify-center">
                      <span className="text-7xl">⚙️</span>
                    </div>
                  </div>
                )}
                
                {/* Bias Score */}
                <div className="ml-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/30 to-orange-400/30 blur-3xl"></div>
                    <div className="relative bg-black/70 rounded-3xl p-10 border-3 border-yellow-500/50">
                      <div className="text-9xl font-black text-center text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-yellow-400 to-orange-500">
                        {biasScore}
                      </div>
                      <div className="text-lg text-gray-400 text-center uppercase tracking-wider mt-4">Rarity Bias</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Main Content Area */}
            <div className="p-10">
              {/* Squad Deployment Section - BIGGER */}
              <div className="bg-black/40 rounded-3xl p-10 border-2 border-gray-700/50 mb-10">
                <h3 className="text-2xl font-bold text-yellow-400 mb-8 flex items-center gap-3">
                  <span className="text-4xl">⚔️</span> SQUAD DEPLOYMENT
                </h3>
                
                <div className="grid grid-cols-8 gap-4 mb-6">
                  {Array.from({ length: isGlobal ? 12 : 5 }).map((_, i) => {
                    const mek = meks[i];
                    return (
                      <div key={i} className="relative group cursor-pointer">
                        {/* Epic Socket Design with Multiple Layers */}
                        <div className="aspect-square relative">
                          {/* Outer Glow */}
                          <div className="absolute -inset-2 bg-gradient-to-br from-yellow-500/30 to-orange-500/30 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all"></div>
                          
                          {/* Socket Frame */}
                          <div className="relative w-full h-full rounded-2xl overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black"></div>
                            <div className="absolute inset-[3px] bg-black rounded-2xl"></div>
                            <div className="absolute inset-[6px] bg-gradient-to-br from-gray-900 to-black rounded-xl border-3 border-yellow-500/20 group-hover:border-yellow-400/60 transition-all">
                              {mek ? (
                                <div className="w-full h-full flex items-center justify-center">
                                  <div className="text-base text-yellow-400 text-center font-bold p-2">{mek.name}</div>
                                </div>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <div className="relative">
                                    <div className="absolute inset-0 w-20 h-20 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all"></div>
                                    <span className="relative text-6xl text-gray-700 group-hover:text-yellow-500/60 transition-all">+</span>
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
                  <div className="bg-green-900/30 rounded-2xl p-5 border-2 border-green-500/30">
                    <div className="flex justify-between items-center">
                      <span className="text-green-400 text-xl">Squad Effectiveness Multiplier:</span>
                      <span className="text-4xl font-bold text-green-400">{(1 + meks.length * 0.1).toFixed(1)}x</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* FULL WIDTH Rewards Sections */}
              <div className="space-y-10">
                {/* Gold Rewards - FULL WIDTH */}
                <div className="bg-black/40 rounded-3xl p-10 border-2 border-gray-700/50">
                  <h3 className="text-2xl font-bold text-yellow-400 mb-8 flex items-center gap-3">
                    <span className="text-4xl">💰</span> GOLD DISTRIBUTION
                  </h3>
                  <div className="flex items-end gap-2 h-48">
                    {goldDist.map((item, i) => (
                      <div key={i} className="flex-1 relative group">
                        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="text-base text-yellow-400 whitespace-nowrap bg-black/80 px-2 py-1 rounded">
                            {(item.value/1000).toFixed(0)}k
                          </div>
                        </div>
                        <div className="text-sm text-gray-500 text-center mb-3">{item.probability.toFixed(0)}%</div>
                        <div
                          className="w-full bg-gradient-to-t from-yellow-700 via-yellow-500 to-yellow-400 rounded-t hover:brightness-110 transition-all"
                          style={{ height: `${Math.max(8, (item.probability / 100) * 180)}px` }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="text-center text-lg text-yellow-400 mt-6">
                    ← Low Rewards | Higher Bias Increases Chances | High Rewards →
                  </div>
                </div>
                
                {/* Essence Rewards - FULL WIDTH with 7 types */}
                <div className="bg-black/40 rounded-3xl p-10 border-2 border-gray-700/50">
                  <h3 className="text-2xl font-bold text-yellow-400 mb-8 flex items-center gap-3">
                    <span className="text-4xl">✨</span> ESSENCE REWARDS ({isGlobal ? 25 : 4}x DROP RATE)
                  </h3>
                  <div className="flex items-end gap-5 h-48">
                    {essenceProbs.map((prob, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center">
                        <div className="text-lg text-gray-400 mb-3">{prob.toFixed(0)}%</div>
                        <div
                          className="w-full rounded-t transition-all hover:brightness-125"
                          style={{
                            height: `${Math.max(12, (prob / 100) * 160)}px`,
                            backgroundColor: essenceTypes[i].color,
                            boxShadow: `0 0 40px ${essenceTypes[i].color}60, inset 0 2px 0 ${essenceTypes[i].color}CC`
                          }}
                        />
                        <div className="mt-4 w-16 h-16">
                          <Image
                            src={essenceTypes[i].image}
                            alt={essenceTypes[i].name}
                            width={64}
                            height={64}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="text-base text-gray-400 mt-3">{essenceTypes[i].name}</div>
                      </div>
                    ))}
                  </div>
                  
                  {isGlobal && (
                    <div className="mt-8 bg-gradient-to-r from-purple-900/60 to-purple-800/60 rounded-3xl p-8 border-2 border-purple-500/50">
                      <div className="flex justify-between items-center">
                        <span className="text-purple-300 text-2xl">
                          {dailyVariation} Chip Drop Chance:
                        </span>
                        <span className="text-6xl font-black text-purple-400">8.1%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Embark Button - MASSIVE */}
              <div className="mt-12 relative">
                <button
                  disabled={meks.length === 0}
                  className={`relative w-full py-10 font-black text-4xl tracking-wider rounded-3xl transition-all transform hover:scale-[1.01] ${
                    meks.length > 0
                      ? isGlobal
                        ? 'bg-gradient-to-r from-purple-600 via-yellow-500 to-purple-600 text-black shadow-[0_20px_60px_rgba(250,182,23,0.6)]'
                        : 'bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-[0_10px_40px_rgba(34,197,94,0.5)]'
                      : 'bg-gray-800/60 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  <span className="relative z-10">
                    {meks.length === 0 ? "DEPLOY UNITS TO EMBARK" : "EMBARK ON MISSION"}
                  </span>
                  {meks.length > 0 && (
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity"></div>
                  )}
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
      <div className="max-w-[1600px] mx-auto">
        <h1 className="text-4xl font-bold text-yellow-400 mb-8 text-center">CONTRACTS - Layout Option 8</h1>
        <p className="text-center text-gray-400 mb-24">Hybrid design - Everything bigger, full-width graphs, 7 essences</p>
        
        <div className="space-y-32">
          {renderContract(true)}
          {renderContract(false)}
        </div>
      </div>
    </div>
  );
}