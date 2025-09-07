"use client";

import { useState, useEffect } from "react";
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
  const [probabilities, setProbabilities] = useState<number[]>([]);
  
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
  
  function calculateProbabilities(rarity: number): number[] {
    const probs: number[] = [];
    const sigma = 120;
    const bellCenter = calculateBellCurvePosition(rarity);
    
    ranks.forEach(rank => {
      const rankCenter = (rank.min + rank.max) / 2;
      const distance = rankCenter - bellCenter;
      
      let prob = Math.exp(-0.5 * Math.pow(distance / sigma, 2));
      probs.push(prob);
    });
    
    const total = probs.reduce((sum, p) => sum + p, 0);
    return probs.map(p => (p / total) * 100);
  }
  
  useEffect(() => {
    setProbabilities(calculateProbabilities(rarityBias));
  }, [rarityBias]);
  
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
  
  const maxProb = Math.max(...probabilities);
  const maxHeight = 234;
  
  return (
    <div className="min-h-screen p-5 relative z-10">
      <div className="max-w-6xl mx-auto">
        <div className="page-header mb-8">
          <h1 className="text-4xl font-bold text-yellow-400 tracking-wider uppercase text-center mb-2">
            Rarity Bias System
          </h1>
          <p className="text-gray-400 text-center">
            Influence the probability of crafting rare items
          </p>
        </div>
        
        <div className="glass-panel p-8 mb-6">
          <div className="bg-black/50 rounded-lg p-6 border border-gray-800">
            <div className="text-center mb-6">
              <div className="text-5xl font-bold text-yellow-400 mb-2">
                Bias: <span className="text-yellow-300">{rarityBias}</span>
              </div>
              <div className="text-gray-300 text-lg">
                Your Current Focus: <span className="text-yellow-400">{getCurrentFocus()}</span>
              </div>
            </div>
            
            <div className="flex items-end justify-center h-64 mb-8 px-4">
              {probabilities.map((prob, i) => {
                const height = Math.max(5, (prob / maxProb) * maxHeight);
                const rank = ranks[i];
                
                return (
                  <div
                    key={rank.name}
                    className="flex-1 mx-1 relative group transition-all duration-200 hover:brightness-125"
                    style={{
                      height: `${height}px`,
                      background: `linear-gradient(to top, ${rank.color}88, ${rank.color})`,
                      borderRadius: '4px 4px 0 0',
                      boxShadow: `0 0 8px ${rank.color}55`
                    }}
                  >
                    <div 
                      className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs bg-black/70 px-1 rounded whitespace-nowrap"
                      style={{ color: rank.color }}
                    >
                      {prob.toFixed(1)}%
                    </div>
                    <div 
                      className="absolute -bottom-7 left-1/2 transform -translate-x-1/2 font-bold text-sm"
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
          </div>
        </div>
        
        <div className="glass-panel p-6 mb-6">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">
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
          <div className="glass-panel p-4 text-center">
            <div className="text-gray-400 text-sm mb-1">Current Bias</div>
            <div className="text-2xl font-bold text-yellow-400">{rarityBias}</div>
          </div>
          <div className="glass-panel p-4 text-center">
            <div className="text-gray-400 text-sm mb-1">Active Buffs</div>
            <div className="text-2xl font-bold text-green-400">+0%</div>
          </div>
          <div className="glass-panel p-4 text-center">
            <div className="text-gray-400 text-sm mb-1">Equipment Bonus</div>
            <div className="text-2xl font-bold text-blue-400">+0</div>
          </div>
        </div>
      </div>
    </div>
  );
}