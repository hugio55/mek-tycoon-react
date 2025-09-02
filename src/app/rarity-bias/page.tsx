"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface Rank {
  name: string;
  color: string;
  min: number;
  max: number;
}

export default function RarityBiasPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [rarityBias, setRarityBias] = useState(150);
  const [displayBias, setDisplayBias] = useState(150); // For smooth slider display
  const [probabilities, setProbabilities] = useState<number[]>([]);
  
  // Generate stars for background
  const stars = useMemo(() => [...Array(30)].map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() * 2 + 0.5,
    opacity: Math.random() * 0.8 + 0.2,
  })), []);
  
  const fineStars = useMemo(() => [...Array(50)].map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
  })), []);
  
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  
  const ranks: Rank[] = [
    { name: 'D', color: '#999999', min: 0, max: 100 },
    { name: 'C', color: '#87CEEB', min: 100, max: 200 },
    { name: 'B', color: '#90EE90', min: 200, max: 300 },
    { name: 'A', color: '#FFF700', min: 300, max: 400 },
    { name: 'S', color: '#FFB6C1', min: 400, max: 500 },
    { name: 'SS', color: '#DA70D6', min: 500, max: 600 },
    { name: 'SSS', color: '#9370DB', min: 600, max: 700 },
    { name: 'X', color: '#FF8C00', min: 700, max: 800 },
    { name: 'XX', color: '#DC143C', min: 800, max: 900 },
    { name: 'XXX', color: '#8B0000', min: 900, max: 1000 }
  ];
  
  useEffect(() => {
    const initUser = async () => {
      const user = await getOrCreateUser({ 
        walletAddress: "demo_wallet_123" 
      });
      if (user) {
        setUserId(user._id as Id<"users">);
        setRarityBias(user.rarityBias || 150);
        setDisplayBias(user.rarityBias || 150);
      }
    };
    initUser();
  }, [getOrCreateUser]);
  
  const userProfile = useQuery(
    api.users.getUserProfile,
    userId ? { walletAddress: "demo_wallet_123" } : "skip"
  );
  
  useEffect(() => {
    if (userProfile?.rarityBias) {
      setRarityBias(userProfile.rarityBias);
      setDisplayBias(userProfile.rarityBias);
    }
  }, [userProfile]);
  
  function calculateBellCurvePosition(rarity: number): number {
    if (rarity <= 0) return 50;
    
    const maxPosition = 650;
    const minPosition = 50;
    const maxRarity = 1000;
    
    const sqrtProgress = Math.sqrt(rarity / maxRarity);
    const bellPosition = minPosition + (maxPosition - minPosition) * sqrtProgress;
    
    return bellPosition;
  }
  
  // Memoized calculation for better performance
  const calculateProbabilities = useCallback((rarity: number): number[] => {
    const sigma = 120;
    const bellCenter = calculateBellCurvePosition(rarity);
    const probs: number[] = new Array(ranks.length);
    
    // Calculate all probabilities in one pass
    let total = 0;
    for (let i = 0; i < ranks.length; i++) {
      const rankCenter = (ranks[i].min + ranks[i].max) / 2;
      const distance = rankCenter - bellCenter;
      const prob = Math.exp(-0.5 * Math.pow(distance / sigma, 2));
      probs[i] = prob;
      total += prob;
    }
    
    // Normalize to percentages
    const invTotal = 100 / total;
    for (let i = 0; i < probs.length; i++) {
      probs[i] = probs[i] * invTotal;
    }
    
    return probs;
  }, []); // Remove ranks dependency since it's a constant
  
  // Immediate calculation for smooth dragging
  const handleSliderChange = useCallback((value: number) => {
    setDisplayBias(value); // Update display immediately
    setRarityBias(value); // Update rarity bias immediately
    setProbabilities(calculateProbabilities(value)); // Calculate immediately for smooth response
  }, [calculateProbabilities]);
  
  useEffect(() => {
    setProbabilities(calculateProbabilities(rarityBias));
  }, [rarityBias, calculateProbabilities]);
  
  function getCurrentFocus(): string {
    const bellPosition = calculateBellCurvePosition(rarityBias);
    
    for (let rank of ranks) {
      const center = (rank.min + rank.max) / 2;
      if (Math.abs(bellPosition - center) < 60) {
        return rank.name + ' Rank';
      }
    }
    return 'Between ranks';
  }
  
  // Fixed chart height for consistent display
  const chartHeight = 300;
  const maxBarHeight = 290; // Use almost all available height
  
  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Yellow gradient orbs */}
        <div 
          className="absolute left-0 top-0 w-full h-full"
          style={{
            background: `
              radial-gradient(ellipse at 10% 20%, rgba(250, 182, 23, 0.12) 0%, transparent 50%),
              radial-gradient(ellipse at 90% 80%, rgba(250, 182, 23, 0.12) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, rgba(250, 182, 23, 0.05) 0%, transparent 70%)
            `
          }}
        />
        
        {/* Fine stars */}
        {fineStars.map((star) => (
          <div
            key={`fine-${star.id}`}
            className="absolute rounded-full bg-white"
            style={{
              left: star.left,
              top: star.top,
              width: '1px',
              height: '1px',
              opacity: 0.6,
            }}
          />
        ))}
        
        {/* Stars */}
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              left: star.left,
              top: star.top,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
            }}
          />
        ))}
      </div>
      
      <div className="relative z-10 p-5">
        <div className="max-w-6xl mx-auto">
          <div className="page-header mb-8">
            <h1 className="text-5xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 tracking-wider uppercase text-center mb-2 drop-shadow-lg">
              Rarity Bias System
            </h1>
            <p className="text-gray-300 text-center font-inter">
              Influence the probability of crafting rare items
            </p>
          </div>
        
        <div className="bg-black/40 backdrop-blur-md rounded-lg p-8 mb-6 border border-yellow-500/20 shadow-2xl">
          <div className="bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-sm rounded-lg p-6 border border-yellow-500/10">
            <div className="text-center mb-6">
              <div className="text-gray-400 text-sm uppercase tracking-wider mb-2">Current Bias</div>
              <div 
                className="text-yellow-400 mb-3"
                style={{ 
                  fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
                  fontSize: '72px',
                  fontWeight: 200,
                  letterSpacing: '1px',
                  lineHeight: '1',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {displayBias}
              </div>
              <div className="text-gray-300 text-lg font-inter">
                Your Current Focus: <span className="text-yellow-400 font-semibold">{getCurrentFocus()}</span>
              </div>
            </div>
            
            <div className="flex items-end justify-center mb-8 px-4" style={{ height: `${chartHeight}px`, overflow: 'visible' }}>
              {probabilities.map((prob, i) => {
                // Scale bars so the highest one always reaches the top
                // But maintain relative proportions between bars
                const maxProb = Math.max(...probabilities, 0.1); // Get the highest probability
                const scaledHeight = (prob / maxProb) * maxBarHeight; // Scale relative to max
                const height = Math.max(2, scaledHeight); // Minimum 2px for visibility
                const rank = ranks[i];
                
                return (
                  <div
                    key={rank.name}
                    className="flex-1 mx-1 relative group hover:brightness-125"
                    style={{
                      height: `${height}px`,
                      background: `linear-gradient(to top, ${rank.color}88, ${rank.color})`,
                      borderRadius: '4px 4px 0 0',
                      boxShadow: `0 0 8px ${rank.color}55`,
                      transition: 'height 75ms ease-out, filter 200ms ease'
                    }}
                  >
                    <div 
                      className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs whitespace-nowrap opacity-80"
                      style={{ color: rank.color }}
                    >
                      {prob.toFixed(1)}%
                    </div>
                    <div 
                      className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 font-semibold text-sm"
                      style={{ color: rank.color }}
                    >
                      {rank.name}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="text-center text-gray-400 mt-10">
              This shows the probability of crafting at each rarity level
            </div>
            
            {/* Slider Control */}
            <div className="mt-8 px-4">
              <label className="block text-yellow-400 text-sm font-bold mb-2">
                Adjust Rarity Bias: {displayBias}
              </label>
              <input
                type="range"
                min="0"
                max="1000"
                value={displayBias}
                onChange={(e) => handleSliderChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #999999 0%, #87CEEB 10%, #90EE90 20%, #FFF700 30%, #FFB6C1 40%, #DA70D6 50%, #9370DB 60%, #FF8C00 70%, #DC143C 80%, #8B0000 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0</span>
                <span>100</span>
                <span>200</span>
                <span>300</span>
                <span>400</span>
                <span>500</span>
                <span>600</span>
                <span>700</span>
                <span>800</span>
                <span>900</span>
                <span>1000</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-black/40 backdrop-blur-md rounded-lg p-6 mb-6 border border-yellow-500/20 shadow-xl">
          <h2 className="text-2xl font-orbitron font-bold text-yellow-400 mb-4">
            What is Rarity Bias?
          </h2>
          <div className="space-y-4 text-gray-300">
            <p>
              Rarity Bias determines the general rarity levels of items when you craft them. 
              The higher your Bias, the more the probability curve shifts toward higher rarities 
              (S, SS, SSS, X, XX, XXX ranks) during crafting.
            </p>
            
            <div>
              <h3 className="text-xl text-yellow-400 mb-2">How to Increase Bias:</h3>
              <div className="space-y-2 ml-4">
                <div className="flex items-start">
                  <span className="text-yellow-400 mr-2">•</span>
                  <div>
                    <strong className="text-yellow-300">Equipment:</strong> 
                    <span className="text-gray-400"> Equip gear with Bias bonuses on your Meks</span>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-yellow-400 mr-2">•</span>
                  <div>
                    <strong className="text-yellow-300">Upgrades:</strong>
                    <span className="text-gray-400"> Invest in permanent Bias improvements through the upgrade system</span>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-yellow-400 mr-2">•</span>
                  <div>
                    <strong className="text-yellow-300">Buffs:</strong>
                    <span className="text-gray-400"> Activate temporary Bias buffs from consumables or skills</span>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-yellow-400 mr-2">•</span>
                  <div>
                    <strong className="text-yellow-300">Achievements:</strong>
                    <span className="text-gray-400"> Complete milestones for permanent Bias bonuses</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-4 mt-6">
              <p className="text-yellow-300">
                <strong>Pro Tip:</strong> Higher Bias means better chances of crafting rare and valuable items! 
                Focus on building your Bias early to maximize your crafting efficiency.
              </p>
            </div>
          </div>
        </div>
        
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-black/40 backdrop-blur-md rounded-lg p-4 text-center border border-yellow-500/20">
              <div className="text-gray-400 text-sm mb-1 font-inter">Current Bias</div>
              <div className="text-2xl font-orbitron font-bold text-yellow-400">{displayBias}</div>
            </div>
            <div className="bg-black/40 backdrop-blur-md rounded-lg p-4 text-center border border-yellow-500/20">
              <div className="text-gray-400 text-sm mb-1 font-inter">Active Buffs</div>
              <div className="text-2xl font-orbitron font-bold text-green-400">+0%</div>
            </div>
            <div className="bg-black/40 backdrop-blur-md rounded-lg p-4 text-center border border-yellow-500/20">
              <div className="text-gray-400 text-sm mb-1 font-inter">Equipment Bonus</div>
              <div className="text-2xl font-orbitron font-bold text-blue-400">+0</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}