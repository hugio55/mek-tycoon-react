"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

const essenceTypes = [
  { name: "Stone", current: 4.2, max: 10 },
  { name: "Disco", current: 3.4, max: 10 },
  { name: "Paul", current: 1.4, max: 10 },
  { name: "Cartoon", current: 3.4, max: 10 },
  { name: "Candy", current: 2.3, max: 10 },
  { name: "Tiles", current: 1.8, max: 10 },
  { name: "Moss", current: 1.1, max: 10 },
  { name: "Bullish", current: 0.9, max: 10 },
  { name: "Journalist", current: 0.5, max: 10 },
  { name: "Laser", current: 0.3, max: 10 },
  { name: "Flashbulb", current: 0.2, max: 10 },
  { name: "Accordion", current: 0.1, max: 10 },
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
      <h1 className="text-4xl font-bold text-yellow-400 mb-8">
        🧪 Mek Essence
      </h1>
      
      {/* Global Essence Rate */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 border-2 border-yellow-500/30 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-yellow-400">0.100/day</div>
          <div className="text-sm text-gray-400 uppercase tracking-wider mt-2">Global Essence Rate</div>
        </div>
      </div>
      
      {/* Essence List */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 mb-8">
        <div className="space-y-4">
          {displayedEssences.map((essence, index) => {
            const userEssenceValue = userProfile?.totalEssence[essence.name.toLowerCase() as keyof typeof userProfile.totalEssence] || essence.current;
            const percentage = (userEssenceValue / essence.max) * 100;
            
            return (
              <div key={essence.name} className="bg-gray-800/30 rounded-lg p-3 flex items-center gap-4">
                {/* Thumbnail Image Placeholder */}
                <div 
                  className="w-10 h-10 rounded-full bg-gray-700 border-2 border-yellow-500/30 flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundImage: `linear-gradient(135deg, rgba(250, 182, 23, 0.1), rgba(250, 182, 23, 0.2))`,
                  }}
                >
                  {/* This is where the thumbnail image would go */}
                  <span className="text-xs text-yellow-400 font-bold">
                    {essence.name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                
                {/* Bar and Info */}
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-yellow-400 font-semibold text-sm">{essence.name}</span>
                    <span className="text-yellow-400 text-xs">{essence.max}</span>
                  </div>
                  
                  {/* Thinner Progress Bar */}
                  <div className="relative h-4 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-500 to-yellow-400 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-semibold text-xs drop-shadow-lg">
                        {userEssenceValue.toFixed(1)}
                      </span>
                    </div>
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
          className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-bold rounded-lg hover:from-yellow-400 hover:to-yellow-300 transition-all"
        >
          {showAll ? "Show Less" : "See More"}
        </button>
        <button className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-all">
          Sell Essence
        </button>
      </div>
    </div>
  );
}