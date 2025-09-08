"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import EssenceDonutChart from "@/components/essence-donut-chart";
import "@/styles/global-design-system.css";

// Generate more essence types with varying quantities (using deterministic values)
const generateEssenceData = () => {
  const essenceNames = [
    "Stone", "Disco", "Paul", "Cartoon", "Candy", "Tiles", "Moss", "Bullish",
    "Journalist", "Laser", "Flashbulb", "Accordion", "Turret", "Drill", "Security",
    "Bumblebee", "Camera", "Metal", "Crystal", "Flame", "Ice", "Nature", "Thunder",
    "Shadow", "Light", "Water", "Earth", "Wind", "Void", "Chaos", "Order",
    "Digital", "Analog", "Neon", "Retro", "Future", "Past", "Present", "Quantum",
    "Plasma", "Energy", "Matter", "Space", "Time", "Reality", "Dream", "Nightmare",
    "Joy", "Sorrow", "Rage", "Peace", "War", "Love", "Hate", "Fear",
    "Courage", "Wisdom", "Power", "Mind", "Soul", "Body", "Spirit", "Heart",
    "Gold", "Silver", "Bronze", "Platinum", "Diamond", "Ruby", "Emerald", "Sapphire",
    "Amethyst", "Topaz", "Opal", "Pearl", "Coral", "Jade", "Obsidian", "Quartz",
    "Marble", "Granite", "Sandstone", "Limestone", "Basalt", "Shale", "Coal", "Iron",
    "Copper", "Tin", "Lead", "Zinc", "Nickel", "Aluminum", "Titanium", "Mercury",
    "Uranium", "Plutonium", "Radium", "Helium", "Krypton", "Argon", "Xenon", "Radon"
  ];

  // Use deterministic values based on index
  return essenceNames.map((name, index) => {
    const hasBonus = index % 4 === 0; // Every 4th essence has a bonus
    
    // Create more realistic amounts with greater variation
    let amount;
    if (index === 0) amount = 0.1; // Show minimum
    else if (index === 1) amount = 2.5; // Show medium
    else if (index === 2) amount = 9.8; // Show near max
    else if (index === 3) amount = 0.05; // Very low
    else if (index === 4) amount = 1.2;
    else if (index === 5) amount = 7.3;
    else if (index === 6) amount = 0.8;
    else if (index === 7) amount = 13.5; // Buffed above normal max
    else if (index === 8) amount = 3.4;
    else if (index === 9) amount = 0.3;
    else if (index === 10) amount = 5.6;
    else if (index === 11) amount = 0.15;
    else if (index === 12) amount = 4.2;
    else if (index === 13) amount = 1.8;
    else if (index === 14) amount = 8.2; // Another buffed example
    else if (index < 25) {
      // Some with very low amounts (0.05-2) - deterministic based on index
      amount = 0.05 + ((index * 7) % 20) * 0.0975;
    } else {
      // Rest with scattered amounts (0.1-3) - deterministic based on index
      amount = 0.1 + ((index * 11) % 30) * 0.0967;
    }
    
    let maxAmount = 10;
    let maxAmountBuffed = undefined;
    
    // Set buffed max values for specific essences
    if (index === 7) {
      maxAmountBuffed = 14; // Buffed to 14 as requested
    } else if (index === 14) {
      maxAmountBuffed = 11.5; // Another buffed example
    } else if (index === 20) {
      maxAmountBuffed = 12; // Another variation
    }
    
    // Ensure amount doesn't exceed max
    const effectiveMax = maxAmountBuffed || maxAmount;
    amount = Math.min(amount, effectiveMax);
    
    return {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      amount: parseFloat(amount.toFixed(2)),
      currentValue: Math.floor(100 + ((index * 13 + 7) % 900)), // Deterministic value 100-1000
      maxAmount,
      maxAmountBuffed,
      icon: ["🔮", "💎", "⚡", "🌟", "🔥", "❄️", "🌿", "💫", "✨", "🌊"][index % 10],
      image: `/essence-images/bumblebee ${(index % 3) + 1}.png`, // Use Bumblebee 1, 2, or 3 images
      baseRate: 0.1, // Base generation rate
      bonusRate: hasBonus ? 0.05 + (index % 5) * 0.01 : 0 // Some have bonus rates
    };
  });
};

export default function EssenceDonutPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [viewCount, setViewCount] = useState<5 | 10 | 20 | 30 | 100>(20);
  const [essenceData] = useState(generateEssenceData());
  const [showLegend, setShowLegend] = useState(false); // Default to no legend for single column
  const [chartSize, setChartSize] = useState(500);
  
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
  
  // Sort and slice essence data for display
  const displayedEssences = useMemo(() => {
    return [...essenceData]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, viewCount)
      .filter(e => e.amount > 0); // Only show essences with quantity
  }, [essenceData, viewCount]);
  
  // Calculate total stats
  const totalStats = useMemo(() => {
    const total = displayedEssences.reduce((sum, e) => sum + e.amount, 0);
    const totalValue = displayedEssences.reduce((sum, e) => sum + (e.amount * e.currentValue), 0);
    const averageValue = totalValue / total || 0;
    
    return {
      totalAmount: total,
      totalValue,
      averageValue,
      uniqueTypes: displayedEssences.length
    };
  }, [displayedEssences]);
  
  return (
    <div className="min-h-screen relative">
      
      <div className="relative z-10 text-white">
        {/* Industrial Header */}
        <div className="w-full bg-gradient-to-b from-black via-gray-900/50 to-transparent">
          <div className="relative overflow-hidden">
            {/* Hazard stripes pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: 'repeating-linear-gradient(45deg, #fab617 0, #fab617 10px, transparent 10px, transparent 20px)',
              }} />
            </div>
            
            {/* Corner decorations */}
            <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-yellow-500/50"></div>
            <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-yellow-500/50"></div>
            
            <div className="max-w-7xl mx-auto px-4 py-8">
              <h1 className="text-5xl font-bold font-orbitron tracking-wider text-center mb-2">
                <span className="text-yellow-400">ESSENCE</span>{" "}
                <span className="text-gray-400">DISTRIBUTION</span>
              </h1>
              <p className="text-center text-gray-500 uppercase tracking-[0.3em] text-sm">
                System Analysis • Resource Allocation
              </p>
            </div>
          </div>
        </div>
        
        {/* Controls Bar */}
        <div className="w-full bg-black/60 backdrop-blur-md border-y border-gray-800/50 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              {/* View Count Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Display:</span>
                {[5, 10, 20, 30, 100].map(count => (
                  <button
                    key={count}
                    onClick={() => setViewCount(count as typeof viewCount)}
                    className={`px-3 py-1.5 text-sm font-medium transition-all ${
                      viewCount === count
                        ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/30'
                        : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 border border-gray-700'
                    }`}
                    style={{
                      clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))'
                    }}
                  >
                    {count === 100 ? 'All' : `Top ${count}`}
                  </button>
                ))}
              </div>
              
              {/* Chart Controls */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">SIZE:</span>
                  <input
                    type="range"
                    min="300"
                    max="600"
                    value={chartSize}
                    onChange={(e) => setChartSize(Number(e.target.value))}
                    className="w-24"
                  />
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-gray-500 uppercase">Total</div>
                  <div className="text-lg font-bold text-yellow-400 font-mono">
                    {totalStats.totalAmount.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 uppercase">Value</div>
                  <div className="text-lg font-bold text-green-400 font-mono">
                    {totalStats.totalValue.toLocaleString()}g
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-center">
            {/* Chart Container - Single Column */}
            <div className="w-full max-w-5xl">
              <div className="relative bg-black/40 backdrop-blur-sm border-2 border-yellow-500/30 p-6">
                {/* Industrial frame corners */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-yellow-500"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-yellow-500"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-yellow-500"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-yellow-500"></div>
                
                {/* Scan line effect */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent animate-scan" />
                </div>
                
                {/* Compact Stats Header */}
                <div className="mb-6 pb-4 border-b border-gray-800/50">
                  <div className="flex justify-center gap-8">
                    <div className="text-center">
                      <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Total Essence</div>
                      <div className="text-2xl font-bold text-yellow-400 font-mono">{totalStats.totalAmount.toFixed(1)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Total Value</div>
                      <div className="text-2xl font-bold text-green-400 font-mono">{totalStats.totalValue.toLocaleString()}g</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Essence Types</div>
                      <div className="text-2xl font-bold text-blue-400 font-mono">{totalStats.uniqueTypes}</div>
                    </div>
                  </div>
                </div>
                
                {/* Donut Chart */}
                <div className="flex justify-center">
                  <EssenceDonutChart
                    data={displayedEssences}
                    size={chartSize}
                    showCenterStats={true}
                    animationDuration={1500}
                  />
                </div>
              </div>
            </div>
            
            {/* Legend/Stats Panel - Removed */}
            {false && (
              <div className="lg:col-span-4">
                <div className="bg-black/40 backdrop-blur-sm border border-gray-800/50 p-4">
                  <h3 className="text-sm font-bold text-gray-500 tracking-[0.2em] uppercase mb-3">
                    Essence Breakdown
                  </h3>
                  
                  <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                    {displayedEssences.map((essence, index) => {
                      const percentage = ((essence.amount / totalStats.totalAmount) * 100).toFixed(1);
                      
                      return (
                        <div
                          key={essence.id}
                          className="flex items-center gap-2 p-2 bg-gray-900/30 hover:bg-gray-900/50 transition-all group"
                          style={{
                            borderLeft: `3px solid ${['#fab617', '#ff8c00', '#22d3ee', '#8b5cf6', '#10b981'][index % 5]}`
                          }}
                        >
                          {/* Icon */}
                          <div className="text-lg">{essence.icon}</div>
                          
                          {/* Name & Stats */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-white truncate">
                                {essence.name}
                              </span>
                              <span className="text-xs text-yellow-400 font-mono ml-2">
                                {percentage}%
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>Qty: {essence.amount}</span>
                              <span>{essence.currentValue}g/ea</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Summary Stats */}
                  <div className="mt-4 pt-4 border-t border-gray-800/50 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Types Shown:</span>
                      <span className="text-yellow-400 font-bold">{totalStats.uniqueTypes}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Amount:</span>
                      <span className="text-yellow-400 font-bold">{totalStats.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Value:</span>
                      <span className="text-green-400 font-bold">{totalStats.totalValue.toLocaleString()}g</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Avg Value:</span>
                      <span className="text-blue-400 font-bold">{totalStats.averageValue.toFixed(2)}g</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}