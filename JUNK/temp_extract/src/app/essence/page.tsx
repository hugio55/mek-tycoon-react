"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import BackgroundEffects from "@/components/BackgroundEffects";

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

const getEssenceColor = (type: string) => {
  const colors: Record<string, string> = {
    stone: "#8B8B8B",
    disco: "#B452CD",
    paul: "#4169E1",
    cartoon: "#FF69B4",
    candy: "#FF6B6B",
    tiles: "#CD853F",
    moss: "#90EE90",
    bullish: "#FFB347",
    journalist: "#D3D3D3",
    laser: "#00CED1",
    flashbulb: "#F0E68C",
    accordion: "#DDA0DD",
    turret: "#2F4F4F",
    drill: "#CD853F",
    security: "#000080",
    bumblebee: "#FFD700",
  };
  return colors[type.toLowerCase()] || "#666666";
};

export default function EssencePage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [selectedEssence, setSelectedEssence] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<"all" | "heads" | "bodies" | "traits">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [essenceAmounts, setEssenceAmounts] = useState<{[key: string]: number}>({});
  const [hoveredEssence, setHoveredEssence] = useState<string | null>(null);
  
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
    <div className="min-h-screen bg-black relative">
      <BackgroundEffects />
      
      <div className="relative z-10 text-white py-8">
      {/* Header in glass-morphism frame */}
      <div className="max-w-6xl mx-auto px-4 mb-6">
        <div className="bg-gray-900/20 backdrop-blur-md border border-gray-800/50 rounded-xl p-6">
          <h1 className="text-3xl font-bold text-yellow-400 mb-2 text-center font-orbitron">
            ESSENCE COLLECTION
          </h1>
          <p className="text-gray-400 mb-4 text-center text-sm">Track and manage your essence resources</p>
          
          {/* At a Glance - Always visible horizontal bar */}
          <div className="mt-4">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 text-center">At a Glance</div>
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-3">
              <div className="flex flex-wrap items-center justify-center gap-2">
                {essenceTypes.map(essence => {
                  const amount = essenceAmounts[essence.name] || 0;
                  const color = getEssenceColor(essence.name);
                  const isHovered = hoveredEssence === essence.name;
                  const isSelected = selectedEssence === essence.name;
                  
                  return (
                    <div
                      key={essence.name}
                      className="relative group"
                      onMouseEnter={() => setHoveredEssence(essence.name)}
                      onMouseLeave={() => setHoveredEssence(null)}
                      onClick={() => setSelectedEssence(selectedEssence === essence.name ? null : essence.name)}
                    >
                      {/* Tooltip on hover */}
                      {isHovered && (
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                          <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg p-2 whitespace-nowrap">
                            {/* Thumbnail */}
                            <div className="flex items-center gap-2 mb-1">
                              <div 
                                className="w-8 h-8 rounded flex items-center justify-center text-lg"
                                style={{ backgroundColor: color + '30' }}
                              >
                                {essence.icon}
                              </div>
                              <div>
                                <div className="text-xs font-bold" style={{ color }}>
                                  {essence.name}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {amount.toFixed(2)} / {essence.maxBuffed ? essence.max * 1.5 : essence.max}
                                </div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              {essence.rate.toFixed(2)}/day
                              {essence.speedBuffed && <span className="text-green-400 ml-1">+25%</span>}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">Click to isolate</div>
                          </div>
                        </div>
                      )}
                      
                      {/* Essence block */}
                      <div
                        className="transition-all cursor-pointer hover:scale-110 flex items-center justify-center relative"
                        style={{
                          width: '40px',
                          height: '40px',
                          backgroundColor: color,
                          boxShadow: isSelected 
                            ? `0 0 20px ${color}, 0 0 40px ${color}80` 
                            : `0 0 10px ${color}40`,
                          opacity: 0.7 + (amount / 10) * 0.3,
                          border: isSelected ? '2px solid rgba(250, 182, 23, 1)' : 'none',
                        }}
                      >
                        <span className="text-white text-xs font-bold drop-shadow-lg">
                          {amount.toFixed(0)}
                        </span>
                        {/* Buff indicators */}
                        {(essence.speedBuffed || essence.maxBuffed) && (
                          <div className="absolute -top-1 -right-1 flex gap-0.5">
                            {essence.speedBuffed && (
                              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            )}
                            {essence.maxBuffed && (
                              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {selectedEssence && (
                <div className="text-center mt-2">
                  <button 
                    onClick={() => setSelectedEssence(null)}
                    className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
                  >
                    Show All Essences
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Global Essence Rate in glass frame */}
      <div className="flex justify-center mb-6 px-4">
        <div className="bg-gray-900/20 backdrop-blur-md border border-gray-800/50 rounded-lg px-6 py-4 text-center">
          <div className="text-2xl font-bold text-green-400">{globalRate}/day</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Global Essence Rate</div>
          <button className="text-xs text-gray-400 hover:text-yellow-400 mt-1 transition-colors">Click for breakdown</button>
        </div>
      </div>
      
      {/* Filters in glass frame */}
      <div className="max-w-3xl mx-auto px-4 mb-4">
        <div className="bg-gray-900/20 backdrop-blur-md border border-gray-800/50 rounded-lg p-3">
          <div className="flex items-center justify-center gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1 text-xs uppercase rounded transition-all ${
                  selectedCategory === "all" 
                    ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/30" 
                    : "bg-gray-800/50 text-gray-400 hover:bg-gray-700/50"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedCategory("heads")}
                className={`px-3 py-1 text-xs uppercase rounded transition-all ${
                  selectedCategory === "heads" 
                    ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/30" 
                    : "bg-gray-800/50 text-gray-400 hover:bg-gray-700/50"
                }`}
              >
                Heads
              </button>
              <button
                onClick={() => setSelectedCategory("bodies")}
                className={`px-3 py-1 text-xs uppercase rounded transition-all ${
                  selectedCategory === "bodies" 
                    ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/30" 
                    : "bg-gray-800/50 text-gray-400 hover:bg-gray-700/50"
                }`}
              >
                Bodies
              </button>
              <button
                onClick={() => setSelectedCategory("traits")}
                className={`px-3 py-1 text-xs uppercase rounded transition-all ${
                  selectedCategory === "traits" 
                    ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/30" 
                    : "bg-gray-800/50 text-gray-400 hover:bg-gray-700/50"
                }`}
              >
                Traits
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Search in glass frame */}
      <div className="max-w-md mx-auto mb-6 px-4">
        <div className="bg-gray-900/20 backdrop-blur-md border border-gray-800/50 rounded-lg p-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search essence types..."
            className="w-full px-3 py-2 bg-transparent text-white placeholder-gray-500 text-sm focus:outline-none"
          />
        </div>
      </div>
      
      {/* Essence Display */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-gray-900/20 backdrop-blur-md border border-gray-800/50 rounded-xl p-6">
          <div className="space-y-3">
            {displayedEssences.map(essence => {
              const amount = essenceAmounts[essence.name] || 0;
              const actualMax = essence.maxBuffed ? essence.max * 1.5 : essence.max;
              const percentage = (amount / actualMax) * 100;
              const color = getEssenceColor(essence.name);
              const actualRate = essence.speedBuffed ? essence.rate * 1.25 : essence.rate;
              
              return (
                <div key={essence.name} className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 p-4 rounded-lg transition-all hover:bg-gray-900/40">
                  <div className="flex items-center gap-4">
                    {/* Essence Icon/Image */}
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 relative"
                      style={{ 
                        backgroundColor: color + '20',
                        border: `1px solid ${color}40`
                      }}
                    >
                      {essence.icon}
                      {/* Buff indicators on icon */}
                      {(essence.speedBuffed || essence.maxBuffed) && (
                        <div className="absolute -top-1 -right-1 flex flex-col gap-0.5">
                          {essence.speedBuffed && (
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" 
                                 title="Speed Buffed" />
                          )}
                          {essence.maxBuffed && (
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" 
                                 title="Max Capacity Buffed" />
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Progress Section */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{essence.name}</span>
                          {essence.speedBuffed && (
                            <span className="text-xs text-green-400 bg-green-400/20 px-1.5 py-0.5 rounded">
                              Speed +25%
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          {actualRate.toFixed(2)}/day
                        </span>
                      </div>
                      
                      {/* Progress bar with divider lines */}
                      <div className="relative h-8 bg-gray-900/50 rounded overflow-hidden border border-gray-700/30">
                        {/* Divider lines adjusted for buffed max */}
                        <div className="absolute inset-0 flex">
                          {Array.from({ length: Math.ceil(actualMax) }, (_, i) => (
                            <div
                              key={i}
                              className="border-r border-gray-700/20"
                              style={{ 
                                width: `${100 / actualMax}%`,
                                borderRightWidth: i === Math.ceil(actualMax) - 1 ? 0 : 1 
                              }}
                            />
                          ))}
                        </div>
                        
                        {/* Filled portion */}
                        <div
                          className="absolute inset-y-0 left-0 transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                            background: `linear-gradient(90deg, ${color}, ${color}dd)`,
                            boxShadow: `inset 0 0 20px ${color}60, 0 0 10px ${color}40`
                          }}
                        />
                        
                        {/* Amount at the tip of the bar */}
                        <div
                          className="absolute top-1/2 -translate-y-1/2 text-white font-bold text-sm px-1 transition-all duration-500"
                          style={{
                            left: `max(30px, ${percentage}%)`,
                            transform: `translateX(-50%) translateY(-50%)`,
                            textShadow: '0 0 4px rgba(0,0,0,0.8)'
                          }}
                        >
                          {amount.toFixed(2)}
                        </div>
                        
                        {/* Max value at the right */}
                        <div 
                          className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs font-mono transition-all ${
                            essence.maxBuffed 
                              ? 'text-green-400 font-bold text-sm'
                              : 'text-gray-400'
                          }`}
                          style={{
                            textShadow: essence.maxBuffed ? '0 0 8px rgba(74, 222, 128, 0.5)' : 'none'
                          }}
                        >
                          {actualMax.toFixed(0)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Action Buttons in glass frame */}
      <div className="flex justify-center gap-4 mt-6 px-4">
        <button 
          onClick={() => setShowAll(!showAll)}
          className="px-4 py-2 bg-gray-900/20 backdrop-blur-md border border-gray-800/50 text-gray-300 text-sm hover:bg-gray-800/30 hover:border-yellow-400/30 transition-all rounded-lg"
          disabled={selectedEssence !== null}
        >
          {showAll ? "Show Less" : "See More"}
        </button>
        <button className="px-4 py-2 bg-gray-900/20 backdrop-blur-md border border-gray-800/50 text-gray-300 text-sm hover:bg-gray-800/30 hover:border-yellow-400/30 transition-all rounded-lg">
          Sell Essence
        </button>
      </div>
      </div>
    </div>
  );
}