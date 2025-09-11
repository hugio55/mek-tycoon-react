"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import RarityChart from "@/components/RarityChart";

export default function RarityBiasPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [rarityBias, setRarityBias] = useState(150);
  const [displayBias, setDisplayBias] = useState(150); // For smooth slider display
  
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
  
  // Immediate calculation for smooth dragging
  const handleSliderChange = useCallback((value: number) => {
    setDisplayBias(value); // Update display immediately
    setRarityBias(value); // Update rarity bias immediately
  }, []);
  
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
          <RarityChart 
            rarityBias={rarityBias}
            displayBias={displayBias}
            onSliderChange={handleSliderChange}
            showSlider={true}
          />
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