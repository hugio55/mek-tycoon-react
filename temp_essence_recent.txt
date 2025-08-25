"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

const essenceTypes = [
  { name: "Stone", current: 4.2, max: 10, color: "#8B8B8B" },
  { name: "Disco", current: 3.4, max: 10, color: "#B452CD" },
  { name: "Paul", current: 1.4, max: 10, color: "#4169E1" },
  { name: "Cartoon", current: 3.4, max: 10, color: "#FF69B4" },
  { name: "Candy", current: 2.3, max: 10, color: "#FF6B6B" },
  { name: "Tiles", current: 1.8, max: 10, color: "#CD853F" },
  { name: "Moss", current: 1.1, max: 10, color: "#90EE90" },
  { name: "Bullish", current: 0.9, max: 10, color: "#FFB347" },
  { name: "Journalist", current: 0.5, max: 10, color: "#D3D3D3" },
  { name: "Laser", current: 0.3, max: 10, color: "#00CED1" },
  { name: "Flashbulb", current: 0.2, max: 10, color: "#F0E68C" },
  { name: "Accordion", current: 0.1, max: 10, color: "#DDA0DD" },
];

export default function EssencePage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [showAll, setShowAll] = useState(false);
  
  // Get or create user
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  
  useEffect(() => {
    const initUser = async () => {
      const user = await getOrCreateUser({ 
        walletAddress: "demo_wallet_123" 
      });
      if (user) {
        setUserId(user._id as Id<"users">);
      }
    };
    initUser();
  }, [getOrCreateUser]);
  
  // Get user profile
  const userProfile = useQuery(
    api.users.getUserProfile,
    userId ? { walletAddress: "demo_wallet_123" } : "skip"
  );
  
  const displayedEssences = showAll ? essenceTypes : essenceTypes.slice(0, 8);
  
  return (
    <div className="text-white py-8">
      <h1 className="text-3xl font-light text-gray-200 mb-2">
        Essence Collection
      </h1>
      <p className="text-gray-500 mb-8">Track and manage your essence resources</p>
      
      {/* Global Essence Rate */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-lg p-6 text-center">
          <div className="text-2xl font-light text-gray-300">0.100/day</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mt-2">Global Essence Rate</div>
        </div>
      </div>
      
      {/* Essence List */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg overflow-hidden mb-8">
        <div>
          {displayedEssences.map((essence, index) => {
            const userEssenceValue = userProfile?.totalEssence[essence.name.toLowerCase() as keyof typeof userProfile.totalEssence] || essence.current;
            const percentage = (userEssenceValue / essence.max) * 100;
            
            return (
              <div 
                key={essence.name} 
                className="p-3 flex items-center gap-4 hover:bg-gray-800/40 transition-all"
              >
                {/* Thumbnail Image Placeholder - 20% bigger (from 40px to 48px) */}
                <div 
                  className="w-12 h-12 rounded-full bg-gray-900 border flex items-center justify-center flex-shrink-0"
                  style={{
                    borderColor: `${essence.color}40`,
                    backgroundColor: `${essence.color}10`,
                  }}
                >
                  {/* This is where the thumbnail image would go */}
                  <span className="text-sm font-bold" style={{ color: essence.color }}>
                    {essence.name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                
                {/* Bar and Info */}
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-300 font-medium text-sm">{essence.name}</span>
                    <span className="text-gray-500 text-xs">/ {essence.max}</span>
                  </div>
                  
                  {/* Thinner Progress Bar */}
                  <div className="relative h-3 bg-gray-900/50 rounded-full">
                    <div 
                      className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${percentage}%`,
                        background: `linear-gradient(90deg, ${essence.color}60, ${essence.color}90)`,
                        boxShadow: `0 0 8px ${essence.color}30`
                      }}
                    />
                    {/* Number at the tip of the progress bar */}
                    <span 
                      className="absolute top-1/2 -translate-y-1/2 text-xs font-bold px-1"
                      style={{ 
                        left: `${Math.min(percentage, 94)}%`,
                        color: percentage > 50 ? '#fff' : essence.color,
                        textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                      }}
                    >
                      {userEssenceValue.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <button 
          onClick={() => setShowAll(!showAll)}
          className="px-6 py-2 bg-gray-800 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 hover:border-gray-500 transition-all"
        >
          {showAll ? "Show Less" : "See More"}
        </button>
        <button className="px-6 py-2 bg-gray-800 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 hover:border-gray-500 transition-all">
          Sell Essence
        </button>
      </div>
    </div>
  );
}