"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import EssenceBar from "@/components/EssenceBar";

const essenceTypes = [
  { name: "Stone", current: 8.75, max: 10, rate: 8.75 },
  { name: "Disco", current: 7.43, max: 10, rate: 7.43 },
  { name: "Paul", current: 6.82, max: 10, rate: 6.82 },
  { name: "Cartoon", current: 5.91, max: 10, rate: 5.91 },
  { name: "Candy", current: 5.34, max: 10, rate: 5.34 },
  { name: "Tiles", current: 4.67, max: 10, rate: 4.67 },
  { name: "Moss", current: 4.12, max: 10, rate: 4.12 },
  { name: "Bullish", current: 3.78, max: 10, rate: 3.78 },
  { name: "Journalist", current: 3.25, max: 10, rate: 3.25 },
  { name: "Laser", current: 2.89, max: 10, rate: 2.89 },
  { name: "Flashbulb", current: 2.41, max: 10, rate: 2.41 },
  { name: "Accordion", current: 2.03, max: 10, rate: 2.03 },
  { name: "Turret", current: 1.87, max: 10, rate: 1.87 },
  { name: "Drill", current: 1.72, max: 10, rate: 1.72 },
  { name: "Security", current: 1.65, max: 10, rate: 1.65 },
];

export default function EssencePage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [atAGlance, setAtAGlance] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<"all" | "heads" | "bodies" | "traits">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [essenceAmounts, setEssenceAmounts] = useState<{[key: string]: number}>({});
  
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
  
  // Initialize essence amounts
  useEffect(() => {
    const initial: {[key: string]: number} = {};
    essenceTypes.forEach(essence => {
      initial[essence.name] = essence.current;
    });
    setEssenceAmounts(initial);
  }, []);
  
  // Simulate essence accumulation
  useEffect(() => {
    const interval = setInterval(() => {
      setEssenceAmounts(prev => {
        const newAmounts = { ...prev };
        essenceTypes.forEach(essence => {
          const current = newAmounts[essence.name] || essence.current;
          newAmounts[essence.name] = Math.min(10, current + (essence.rate * 0.001 / 3600));
        });
        return newAmounts;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);
  
  // Filter essences
  let displayedEssences = showAll ? essenceTypes : essenceTypes.slice(0, 8);
  if (searchQuery) {
    displayedEssences = displayedEssences.filter(e => 
      e.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  
  const globalRate = 0.115;
  const totalCollected = essenceTypes.filter(e => (essenceAmounts[e.name] || 0) > 0).length;
  
  return (
    <div className="text-white py-8">
      <h1 className="text-3xl font-bold text-yellow-400 mb-2 text-center">
        ESSENCE COLLECTION
      </h1>
      <p className="text-gray-500 mb-6 text-center text-sm">Track and manage your essence resources</p>
      
      {/* Global Essence Rate */}
      <div className="flex justify-center mb-6">
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg px-6 py-4 text-center">
          <div className="text-2xl font-bold text-green-400">{globalRate}/day</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Global Essence Rate</div>
          <button className="text-xs text-gray-400 hover:text-yellow-400 mt-1">Click for breakdown</button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6 max-w-2xl mx-auto">
        <div className="bg-gray-900/30 border border-gray-800 p-3 text-center">
          <div className="text-xl font-bold">{essenceTypes.length}</div>
          <div className="text-xs text-gray-500">Essence Types</div>
        </div>
        <div className="bg-gray-900/30 border border-gray-800 p-3 text-center">
          <div className="text-xl font-bold text-green-400">{totalCollected}</div>
          <div className="text-xs text-gray-500">Types Collected</div>
        </div>
        <div className="bg-gray-900/30 border border-gray-800 p-3 text-center">
          <div className="text-xl font-bold text-yellow-400">
            {displayedEssences.reduce((sum, e) => sum + e.rate, 0).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">Speed</div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1 text-xs uppercase ${
              selectedCategory === "all" ? "bg-yellow-400 text-black" : "bg-gray-800 text-gray-400"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedCategory("heads")}
            className={`px-3 py-1 text-xs uppercase ${
              selectedCategory === "heads" ? "bg-yellow-400 text-black" : "bg-gray-800 text-gray-400"
            }`}
          >
            Heads
          </button>
          <button
            onClick={() => setSelectedCategory("bodies")}
            className={`px-3 py-1 text-xs uppercase ${
              selectedCategory === "bodies" ? "bg-yellow-400 text-black" : "bg-gray-800 text-gray-400"
            }`}
          >
            Bodies
          </button>
          <button
            onClick={() => setSelectedCategory("traits")}
            className={`px-3 py-1 text-xs uppercase ${
              selectedCategory === "traits" ? "bg-yellow-400 text-black" : "bg-gray-800 text-gray-400"
            }`}
          >
            Traits
          </button>
        </div>
        
        <label className="flex items-center gap-2">
          <input 
            type="checkbox"
            checked={atAGlance}
            onChange={(e) => setAtAGlance(e.target.checked)}
            className="accent-yellow-400"
          />
          <span className="text-xs text-gray-400">At a Glance</span>
        </label>
      </div>
      
      {/* Search */}
      <div className="max-w-md mx-auto mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search essence types..."
          className="w-full px-3 py-1 bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-yellow-400"
        />
      </div>
      
      {/* Essence Display */}
      <div className={atAGlance ? "max-w-5xl mx-auto" : "max-w-3xl mx-auto space-y-3"}>
        {atAGlance ? (
          // At a Glance - Vertical Bar Visualization
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
            <div className="flex items-end justify-center gap-1" style={{ height: '200px' }}>
              {essenceTypes.map(essence => {
                const amount = essenceAmounts[essence.name] || 0;
                const percentage = (amount / 10) * 100;
                const barWidth = Math.max(8, Math.min(40, 8 + (amount * 3.2))); // Width varies from 8px to 40px based on amount
                const color = essence.name === 'Stone' ? '#8B8B8B' :
                             essence.name === 'Disco' ? '#B452CD' :
                             essence.name === 'Paul' ? '#4169E1' :
                             essence.name === 'Cartoon' ? '#FF69B4' :
                             essence.name === 'Candy' ? '#FF6B6B' :
                             essence.name === 'Tiles' ? '#CD853F' :
                             essence.name === 'Moss' ? '#90EE90' :
                             essence.name === 'Bullish' ? '#FFB347' :
                             essence.name === 'Journalist' ? '#D3D3D3' :
                             essence.name === 'Laser' ? '#00CED1' :
                             essence.name === 'Flashbulb' ? '#F0E68C' :
                             essence.name === 'Accordion' ? '#DDA0DD' :
                             essence.name === 'Turret' ? '#4682B4' :
                             essence.name === 'Drill' ? '#8B4513' :
                             essence.name === 'Security' ? '#DC143C' :
                             '#666666';
                
                return (
                  <div
                    key={essence.name}
                    className="relative group transition-all hover:z-10"
                    style={{ width: `${barWidth}px` }}
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-gray-900 border border-gray-700 rounded px-2 py-1 whitespace-nowrap z-20">
                      <div className="text-xs font-bold" style={{ color }}>
                        {essence.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {amount.toFixed(2)} / {essence.max}
                      </div>
                      <div className="text-xs text-gray-500">
                        {essence.rate.toFixed(2)}/day
                      </div>
                    </div>
                    
                    {/* Vertical bar */}
                    <div
                      className="transition-all cursor-pointer hover:opacity-80"
                      style={{
                        height: `${percentage}%`,
                        backgroundColor: color,
                        boxShadow: `0 0 10px ${color}40`,
                        minHeight: '4px'
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          // Full View with EssenceBar
          <>
            {displayedEssences.map(essence => (
              <div key={essence.name} className="bg-gray-900/30 border border-gray-800 p-3 rounded">
                <EssenceBar
                  essenceType={essence.name}
                  currentAmount={essenceAmounts[essence.name] || 0}
                  maxAmount={10}
                  speedBuff={essence.rate > 5 ? 1.5 : 1}
                />
              </div>
            ))}
          </>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-center gap-4 mt-6">
        <button 
          onClick={() => setShowAll(!showAll)}
          className="px-4 py-2 bg-gray-800 text-gray-300 text-sm hover:bg-gray-700 transition-all"
        >
          {showAll ? "Show Less" : "See More"}
        </button>
        <button className="px-4 py-2 bg-gray-800 text-gray-300 text-sm hover:bg-gray-700 transition-all">
          Sell Essence
        </button>
      </div>
    </div>
  );
}