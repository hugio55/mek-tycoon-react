"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
  const [chartSize, setChartSize] = useState(525); // Increased by 5%
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  const [selectedSlice, setSelectedSlice] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSlotting, setIsSlotting] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
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
  
  // Click outside handler for search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
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
  
  // Search filtered essences
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return essenceData
      .filter(e => e.name.toLowerCase().includes(query))
      .slice(0, 8) // Limit to 8 results
      .sort((a, b) => {
        // Prioritize exact matches and beginning matches
        const aStart = a.name.toLowerCase().startsWith(query);
        const bStart = b.name.toLowerCase().startsWith(query);
        if (aStart && !bStart) return -1;
        if (!aStart && bStart) return 1;
        return b.amount - a.amount; // Then sort by amount
      });
  }, [searchQuery, essenceData]);
  
  // Handle search selection
  const handleSearchSelect = (essenceId: string) => {
    setIsSlotting(true);
    setTimeout(() => setIsSlotting(false), 300);
    setSelectedSlice(essenceId);
    setHoveredSlice(essenceId);
    setSearchQuery("");
    setShowSearchResults(false);
  };
  
  // Handle slice click
  const handleSliceClick = (essenceId: string) => {
    setIsSlotting(true);
    setTimeout(() => setIsSlotting(false), 300);
    setSelectedSlice(essenceId);
  };
  
  // Handle clear selection
  const handleClearSelection = () => {
    setSelectedSlice(null);
    setHoveredSlice(null);
  };
  
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
                View Your Essence Inventory
              </p>
            </div>
          </div>
        </div>
        
        {/* Controls Bar */}
        <div className="w-full bg-black/80 backdrop-blur-md border-y-2 border-yellow-500/20 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Stats - Left Side */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 uppercase tracking-widest">Total Essence:</span>
                  <span className="text-lg font-bold text-yellow-400 font-mono">{totalStats.totalAmount.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 uppercase tracking-widest">Total Value:</span>
                  <span className="text-lg font-bold text-green-400 font-mono">{Math.round(totalStats.totalValue).toLocaleString()}g</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 uppercase tracking-widest">Types:</span>
                  <span className="text-lg font-bold text-blue-400 font-mono">{totalStats.uniqueTypes}</span>
                </div>
              </div>
              
              {/* View Count Selector - Right Side */}
              <div className="flex items-center bg-gray-900/60 rounded-lg border border-gray-700/50 p-1">
                {[5, 10, 20, 30, 100].map(count => (
                  <button
                    key={count}
                    onClick={() => setViewCount(count as typeof viewCount)}
                    className={`px-4 py-2 text-sm font-semibold rounded-md transition-all mx-0.5 ${
                      viewCount === count
                        ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30'
                        : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                    }`}
                  >
                    {count === 100 ? 'All' : `Top ${count}`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Container - Left Side */}
            <div className="lg:col-span-2">
              <div className="relative">
                {/* Search Bar - Floating above chart */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-20 w-80">
                  <div ref={searchRef} className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSearchResults(true);
                      }}
                      onFocus={() => setShowSearchResults(true)}
                      placeholder="Search essence..."
                      className="w-full px-4 py-2 bg-black/80 backdrop-blur-sm border-2 border-yellow-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/60 transition-all"
                    />
                    
                    {/* Search icon */}
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    
                    {/* Search Results Dropdown */}
                    {showSearchResults && searchResults.length > 0 && (
                      <div className="absolute top-full mt-2 w-full bg-black/95 backdrop-blur-sm border-2 border-yellow-500/30 rounded-lg overflow-hidden">
                        {searchResults.map((essence) => (
                          <button
                            key={essence.id}
                            onClick={() => handleSearchSelect(essence.id)}
                            className="w-full px-4 py-3 text-left hover:bg-yellow-500/20 transition-colors border-b border-gray-800/50 last:border-b-0"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-lg">{essence.icon}</span>
                                <span className="text-white font-medium">{essence.name}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-yellow-400 font-bold">{essence.amount.toFixed(1)}</div>
                                <div className="text-gray-400 text-xs">{essence.currentValue}g/ea</div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Donut Chart */}
                <div className="flex justify-center pt-8">
                  <EssenceDonutChart
                    data={displayedEssences}
                    size={chartSize}
                    showCenterStats={true}
                    animationDuration={600}
                    onSliceHover={setHoveredSlice}
                    onSliceClick={handleSliceClick}
                    selectedSlice={selectedSlice}
                  />
                </div>
              </div>
            </div>
            
            {/* Details Panel - Right Side */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                {(hoveredSlice || selectedSlice) ? (() => {
                  const activeSlice = hoveredSlice || selectedSlice;
                  const slice = essenceData.find(e => e.id === activeSlice);
                  if (!slice) return null;
                  
                  // Get the color and index for this essence
                  const sliceIndex = essenceData.indexOf(slice);
                  const ESSENCE_COLORS = [
                    '#fab617', '#ff8c00', '#22d3ee', '#8b5cf6', '#10b981',
                    '#ef4444', '#3b82f6', '#f59e0b', '#ec4899', '#14b8a6'
                  ];
                  const sliceColor = ESSENCE_COLORS[sliceIndex % ESSENCE_COLORS.length];
                  
                  const effectiveMax = slice.maxAmountBuffed || slice.maxAmount || 10;
                  const progress = (slice.amount / effectiveMax) * 100;
                  const baseRate = slice.baseRate || 0.1;
                  const bonusRate = slice.bonusRate || 0;
                  const totalRate = baseRate + bonusRate;
                  const totalValue = slice.amount * slice.currentValue;
                  const theoreticalIncome = totalRate * slice.currentValue;
                  
                  return (
                    <div className={`mek-card-industrial mek-border-sharp-gold p-4 relative ${isSlotting ? 'animate-pulse' : ''}`}>
                      {/* Subtle scan line effect */}
                      <div className="absolute inset-0 pointer-events-none mek-scan-effect opacity-30"></div>
                      
                      {/* Slotting animation overlay */}
                      {isSlotting && (
                        <div className="absolute inset-0 pointer-events-none z-50">
                          <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/30 via-yellow-500/10 to-transparent animate-pulse"></div>
                          <div className="absolute inset-x-0 top-0 h-1 bg-yellow-500 animate-pulse"></div>
                          <div className="absolute inset-x-0 bottom-0 h-1 bg-yellow-500 animate-pulse"></div>
                        </div>
                      )}
                      
                      {/* Essence Bottle Image */}
                      <div className="relative mb-4 mek-slot-empty rounded-lg p-4 flex items-center justify-center border-2 border-yellow-500/30" style={{ minHeight: '200px' }}>
                        <div className="absolute inset-0 mek-overlay-glass opacity-50 pointer-events-none"></div>
                        <img 
                          src={`/essence-images/bumblebee ${(sliceIndex % 3) + 1}.png`}
                          alt={`${slice.name} essence`}
                          className="relative z-10 w-full h-full object-contain"
                          style={{ maxHeight: '180px' }}
                        />
                      </div>
                      
                      {/* Name and Amount */}
                      <div className="text-center mb-4">
                        <h2 className="mek-text-industrial text-3xl text-yellow-400 mb-2 mek-text-shadow">{slice.name.toUpperCase()}</h2>
                        <p className="text-xl text-gray-300 font-semibold">{slice.amount.toFixed(1)} units</p>
                      </div>
                      
                      {/* Ownership Section */}
                      <div className="mek-header-industrial rounded-lg p-3 mb-4 relative overflow-hidden">
                        <div className="flex justify-between items-center mb-2 relative z-10">
                          <span className="mek-label-uppercase text-yellow-400">OWNERSHIP</span>
                          <span className="text-2xl font-bold">
                            <span className="text-yellow-400">{slice.amount.toFixed(1)}</span>
                            <span className="text-cyan-400">/{effectiveMax}</span>
                          </span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="relative h-6 bg-black/80 rounded overflow-hidden border border-yellow-500/30">
                          {/* Filled portion - cyan/blue gradient */}
                          <div 
                            className="absolute inset-y-0 left-0 transition-all duration-500"
                            style={{
                              width: `${Math.min((slice.amount / effectiveMax) * 100, 100)}%`,
                              background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.8), rgba(6, 182, 212, 1), rgba(14, 165, 233, 0.9))'
                            }}
                          >
                            <div className="absolute inset-0 opacity-50 bg-gradient-to-t from-transparent to-white/20"></div>
                          </div>
                          {/* Remaining portion - orange/red gradient */}
                          <div 
                            className="absolute inset-y-0 transition-all duration-500"
                            style={{
                              left: `${Math.min((slice.amount / effectiveMax) * 100, 100)}%`,
                              width: `${Math.max(0, 100 - (slice.amount / effectiveMax) * 100)}%`,
                              background: 'linear-gradient(90deg, rgba(251, 146, 60, 0.6), rgba(239, 68, 68, 0.4))'
                            }}
                          >
                            <div className="absolute inset-0 opacity-30 bg-gradient-to-t from-transparent to-white/10"></div>
                          </div>
                          {/* Progress line indicator */}
                          <div 
                            className="absolute inset-y-0 w-px bg-white/80 transition-all duration-500"
                            style={{
                              left: `${Math.min((slice.amount / effectiveMax) * 100, 100)}%`,
                              boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Stats Grid */}
                      <div className="bg-black/40 backdrop-blur-sm border border-yellow-500/30 rounded-lg p-4 relative overflow-hidden">
                        <div className="absolute inset-0 mek-overlay-scratches opacity-10 pointer-events-none"></div>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4 relative z-10">
                          {/* Row 1 */}
                          <div>
                            <p className="mek-label-uppercase mb-1">MARKET PRICE</p>
                            <p className="text-xl font-bold text-yellow-400">{slice.currentValue}g/ea</p>
                          </div>
                          <div>
                            <p className="mek-label-uppercase mb-1">BASE RATE</p>
                            <p className="text-xl font-bold text-cyan-400">{baseRate.toFixed(2)}/day</p>
                          </div>
                          
                          {/* Row 2 */}
                          <div>
                            <p className="mek-label-uppercase mb-1">TOTAL VALUE</p>
                            <p className="text-xl font-bold text-yellow-400">{Math.round(totalValue)}g</p>
                          </div>
                          <div>
                            <p className="mek-label-uppercase mb-1">BONUS RATE</p>
                            <p className="text-xl font-bold text-green-400">
                              {bonusRate > 0 ? `+${bonusRate.toFixed(2)}/day` : '+0.00/day'}
                            </p>
                          </div>
                          
                          {/* Row 3 */}
                          <div>
                            <p className="mek-label-uppercase mb-1">THEORETICAL</p>
                            <p className="text-xl font-bold text-purple-400">{Math.round(theoreticalIncome)}g/day</p>
                          </div>
                          <div>
                            <p className="mek-label-uppercase mb-1">TOTAL RATE</p>
                            <p className="text-xl font-bold text-cyan-400">{totalRate.toFixed(2)}/day</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Clear Button - Only shows when something is selected, not just hovered */}
                      {selectedSlice && (
                        <div className={`mt-4 transition-all duration-300 ${selectedSlice ? 'opacity-100' : 'opacity-0'}`}>
                          <button
                            onClick={handleClearSelection}
                            className="w-full py-2 px-4 bg-black/60 border-2 border-yellow-500/30 rounded-lg text-yellow-400 font-bold uppercase tracking-wider hover:bg-yellow-500/20 hover:border-yellow-500/50 transition-all duration-200"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })() : (
                  <div className="mek-card-industrial mek-border-sharp-gold p-4 relative opacity-60">
                    {/* Subtle scan line effect */}
                    <div className="absolute inset-0 pointer-events-none mek-scan-effect opacity-20"></div>
                    
                    {/* Hover instruction */}
                    <div className="text-center mb-2">
                      <p className="text-gray-400 text-xs uppercase tracking-widest">Hover over chart for details</p>
                    </div>
                    
                    {/* Essence Bottle Image Placeholder */}
                    <div className="relative mb-4 mek-slot-empty rounded-lg p-4 flex items-center justify-center border-2 border-gray-700/30" style={{ minHeight: '200px' }}>
                      <div className="absolute inset-0 mek-overlay-glass opacity-30 pointer-events-none"></div>
                      <img 
                        src="/essence-images/bumblebee 1.png"
                        alt="Essence placeholder"
                        className="relative z-10 w-full h-full object-contain opacity-30"
                        style={{ maxHeight: '180px' }}
                      />
                    </div>
                    
                    {/* Name and Amount Placeholder */}
                    <div className="text-center mb-4">
                      <h2 className="mek-text-industrial text-3xl text-gray-500 mb-2">---</h2>
                      <p className="text-xl text-gray-600 font-semibold">-- units</p>
                    </div>
                    
                    {/* Ownership Section Placeholder */}
                    <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 mb-4 relative overflow-hidden border border-gray-700/30">
                      <div className="flex justify-between items-center mb-2 relative z-10">
                        <span className="mek-label-uppercase text-gray-500">OWNERSHIP</span>
                        <span className="text-2xl font-bold text-gray-500">--/--</span>
                      </div>
                      
                      {/* Empty Progress Bar */}
                      <div className="relative h-6 bg-black/60 rounded overflow-hidden border border-gray-700/30">
                        <div className="absolute inset-0 bg-gray-800/30"></div>
                      </div>
                    </div>
                    
                    {/* Stats Grid Placeholder */}
                    <div className="bg-black/30 backdrop-blur-sm border border-gray-700/30 rounded-lg p-4 relative overflow-hidden">
                      <div className="absolute inset-0 mek-overlay-scratches opacity-5 pointer-events-none"></div>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-4 relative z-10">
                        <div>
                          <p className="mek-label-uppercase mb-1 text-gray-600">MARKET PRICE</p>
                          <p className="text-xl font-bold text-gray-500">--g/ea</p>
                        </div>
                        <div>
                          <p className="mek-label-uppercase mb-1 text-gray-600">BASE RATE</p>
                          <p className="text-xl font-bold text-gray-500">--/day</p>
                        </div>
                        <div>
                          <p className="mek-label-uppercase mb-1 text-gray-600">TOTAL VALUE</p>
                          <p className="text-xl font-bold text-gray-500">--g</p>
                        </div>
                        <div>
                          <p className="mek-label-uppercase mb-1 text-gray-600">BONUS RATE</p>
                          <p className="text-xl font-bold text-gray-500">--/day</p>
                        </div>
                        <div>
                          <p className="mek-label-uppercase mb-1 text-gray-600">THEORETICAL</p>
                          <p className="text-xl font-bold text-gray-500">--g/day</p>
                        </div>
                        <div>
                          <p className="mek-label-uppercase mb-1 text-gray-600">TOTAL RATE</p>
                          <p className="text-xl font-bold text-gray-500">--/day</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}