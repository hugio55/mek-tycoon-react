"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import Link from "next/link";

export default function HubPage() {
  const [liveGold, setLiveGold] = useState(2847.00);
  const [totalGold, setTotalGold] = useState(15420);
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  
  // Get or create user
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  
  useEffect(() => {
    const initUser = async () => {
      const user = await getOrCreateUser({ 
        walletAddress: "demo_wallet_123" 
      });
      if (user) {
        setUserId(user._id as Id<"users">);
        setTotalGold(user.gold);
      }
    };
    initUser();
  }, [getOrCreateUser]);
  
  // Get user profile with real-time updates
  const userProfile = useQuery(
    api.users.getUserProfile,
    userId ? { walletAddress: "demo_wallet_123" } : "skip"
  );
  
  // Simulate live gold counter
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveGold(prev => prev + 0.01);
    }, 100);
    return () => clearInterval(interval);
  }, []);
  
  const collectAllGold = () => {
    const goldToCollect = Math.floor(liveGold);
    setTotalGold(prev => prev + goldToCollect);
    setLiveGold(0);
  };
  
  if (!userProfile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-yellow-400 text-2xl animate-pulse">
          Loading Hub...
        </div>
      </div>
    );
  }
  
  return (
    <div className="text-white overflow-hidden">
      {/* Animated Background Stars */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Twinkling Stars */}
        {[...Array(6)].map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute animate-pulse"
            style={{
              left: `${20 + i * 15}%`,
              top: `${10 + i * 10}%`,
              animationDelay: `${i * 0.5}s`,
              fontSize: '12px',
            }}
          >
            {i % 2 === 0 ? '✦' : '✧'}
          </div>
        ))}
        
        {/* Fine Stars */}
        {[...Array(20)].map((_, i) => (
          <div
            key={`fine-${i}`}
            className="absolute text-gray-600 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              fontSize: '8px',
            }}
          >
            ·
          </div>
        ))}
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 py-6">
        {/* Hub Title Section */}
        <div className="relative mb-6 p-6 rounded-xl bg-gradient-to-br from-gray-900/95 via-gray-800/90 to-gray-900/95 border-2 border-transparent overflow-hidden">
          {/* Animated Border Gradient */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-500 via-yellow-400 to-green-400 opacity-50 blur-sm animate-pulse" />
          <div className="absolute inset-[2px] rounded-xl bg-black" />
          
          <div className="relative flex items-center justify-between">
            {/* Total Gold Display */}
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400 drop-shadow-[0_0_10px_rgba(250,182,23,0.5)]">
                {totalGold.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">Total Gold</div>
            </div>
            
            {/* Hub Title */}
            <div className="text-center">
              <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-500 drop-shadow-[0_0_20px_rgba(250,182,23,0.5)]">
                HUB
              </h1>
              <p className="text-sm text-gray-400 uppercase tracking-widest">Your Tycoon at a Glance</p>
            </div>
            
            {/* Live Earnings */}
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 drop-shadow-[0_0_10px_rgba(0,255,136,0.5)]">
                {liveGold.toFixed(2)}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">Earnings to Collect</div>
            </div>
          </div>
        </div>
        
        {/* Unified Stats */}
        <div className="mb-6 p-4 rounded-lg bg-gradient-to-br from-gray-800/95 to-gray-900/95 border-2 border-yellow-500/30">
          {/* Economy Status */}
          <div className="mb-4">
            <h3 className="text-xs text-yellow-400 uppercase tracking-wider mb-2 font-semibold">
              Economy Status
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-gray-900/50 rounded border-l-4 border-yellow-500 hover:bg-gray-800/70 transition-all cursor-pointer">
                <div className="text-lg font-bold text-yellow-400">50/hr</div>
                <div className="text-xs text-gray-400">Gold Rate</div>
              </div>
              <div className="p-3 bg-gray-900/50 rounded border-l-4 border-yellow-500 hover:bg-gray-800/70 transition-all">
                <div className="text-lg font-bold text-yellow-400">
                  {Object.values(userProfile.totalEssence).reduce((a, b) => a + b, 0).toFixed(1)}
                </div>
                <div className="text-xs text-gray-400">Total Essence</div>
              </div>
              <div className="p-3 bg-gray-900/50 rounded border-l-4 border-yellow-500 hover:bg-gray-800/70 transition-all cursor-pointer">
                <div className="text-lg font-bold text-yellow-400">0.100/day</div>
                <div className="text-xs text-gray-400">Essence Rate</div>
              </div>
            </div>
          </div>
          
          {/* Activity & Progress */}
          <div className="pt-4 border-t border-gray-700/50">
            <h3 className="text-xs text-yellow-400 uppercase tracking-wider mb-2 font-semibold">
              Activity & Progress
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-gray-900/50 rounded border-l-4 border-yellow-500 hover:bg-gray-800/70 transition-all">
                <div className="text-lg font-bold text-yellow-400">12</div>
                <div className="text-xs text-gray-400">AH Listings</div>
              </div>
              <div className="p-3 bg-gray-900/50 rounded border-l-4 border-yellow-500 hover:bg-gray-800/70 transition-all">
                <div className="text-lg font-bold text-yellow-400">0</div>
                <div className="text-xs text-gray-400">Mek XP</div>
              </div>
              <div className="p-3 bg-gray-900/50 rounded border-l-4 border-yellow-500 hover:bg-gray-800/70 transition-all">
                <div className="text-lg font-bold text-yellow-400">0</div>
                <div className="text-xs text-gray-400">Talent Tree XP</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Active Employees Card */}
        <div className="mb-6 p-5 rounded-lg bg-gray-800/50 border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <span>🏭</span>
              <span>Active Employees</span>
            </h3>
            <button
              onClick={collectAllGold}
              className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-bold rounded hover:from-yellow-400 hover:to-yellow-300 transition-all"
            >
              Collect All
            </button>
          </div>
          
          {/* Mek Employee */}
          <div className="mb-3 p-4 bg-gray-900/50 rounded-lg border-l-4 border-yellow-500 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-2xl">
                🤖
              </div>
              <div>
                <div className="font-semibold">Mek #1234 - Level 5</div>
                <div className="text-sm text-gray-400">
                  <span className="text-yellow-400 font-semibold">Rate: 15.5/hr</span> | 
                  Gold: 968/968 (72h cap)
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <div className="bg-gradient-to-r from-yellow-500 to-yellow-400 h-2 rounded-full" style={{width: '100%'}} />
                </div>
              </div>
            </div>
            <button className="px-4 py-2 bg-yellow-500 text-black font-semibold rounded hover:bg-yellow-400 transition-colors">
              Collect
            </button>
          </div>
          
          {/* Empty Slot */}
          <div className="mb-3 p-4 bg-gradient-to-r from-yellow-500/10 to-gray-900/10 rounded-lg border-l-4 border-yellow-500 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 border-2 border-yellow-500 border-dashed rounded-full flex items-center justify-center text-2xl text-yellow-500 hover:bg-yellow-500/20 cursor-pointer transition-colors">
                +
              </div>
              <div>
                <div className="font-semibold text-yellow-400">Empty Slot Available</div>
                <div className="text-sm text-gray-400">Assign a Mek to start earning gold and essence</div>
              </div>
            </div>
            <button className="px-4 py-2 bg-yellow-500 text-black font-semibold rounded hover:bg-yellow-400 transition-colors animate-pulse">
              Assign Mek
            </button>
          </div>
          
          <div className="text-center mt-4">
            <button className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded transition-colors">
              <span className="mr-2">+</span> Add Slot
            </button>
          </div>
        </div>
        
        {/* Recent Activity Card */}
        <div className="mb-6 p-5 rounded-lg bg-gray-800/50 border border-gray-700">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span>📊</span>
            <span>Recent Activity</span>
          </h3>
          <div className="space-y-2 text-sm text-gray-300">
            <div>• Collected 247 gold from Mek #1234</div>
            <div>• Listed Disco Head (C-Rank) on Auction House for 1,200g</div>
            <div>• Purchased 2x Pearls Essence for 500g</div>
            <div>• Hired Mentor #2468 for 24 hours</div>
          </div>
          <div className="text-center mt-4">
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors">
              See More History
            </button>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/crafting" className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-yellow-500 transition-all text-center">
            <div className="text-2xl mb-2">🔨</div>
            <div className="font-semibold">Crafting</div>
          </Link>
          <Link href="/marketplace" className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-yellow-500 transition-all text-center">
            <div className="text-2xl mb-2">🏪</div>
            <div className="font-semibold">Marketplace</div>
          </Link>
          <Link href="/inventory" className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-yellow-500 transition-all text-center">
            <div className="text-2xl mb-2">🎒</div>
            <div className="font-semibold">Inventory</div>
          </Link>
          <Link href="/meks" className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-yellow-500 transition-all text-center">
            <div className="text-2xl mb-2">🤖</div>
            <div className="font-semibold">My Meks</div>
          </Link>
        </div>
      </div>
    </div>
  );
}