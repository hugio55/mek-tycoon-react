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
  const [maxSliceFilter, setMaxSliceFilter] = useState(10); // Default to 10 (show all)
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
  
  // Sort and slice essence data for display with filtering
  const displayedEssences = useMemo(() => {
    let filtered = [...essenceData]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, viewCount)
      .filter(e => e.amount > 0); // Only show essences with quantity
    
    // Apply max filter - only show essences below the threshold
    if (viewCount === 100 && maxSliceFilter < 10) {
      filtered = filtered.filter(e => e.amount <= maxSliceFilter);
    }
    
    return filtered;
  }, [essenceData, viewCount, maxSliceFilter]);
  
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
        
        {/* Controls Bar - Redesigned Sci-Fi Stats Display */}
        <div className="w-full sticky top-0 z-20">
          {/* Main container with industrial frame */}
          <div className="relative bg-black/95 backdrop-blur-xl border-y-2 border-yellow-500/30">
            {/* Animated scan line effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute inset-0 opacity-10" style={{
                background: 'linear-gradient(180deg, transparent 0%, rgba(250, 182, 23, 0.3) 50%, transparent 100%)',
                animation: 'scan 8s linear infinite',
                height: '200%',
                transform: 'translateY(-50%)'
              }} />
            </div>
            
            {/* Grid overlay for tech feel */}
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
              backgroundImage: 'linear-gradient(0deg, rgba(250, 182, 23, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(250, 182, 23, 0.1) 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }} />
            
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between gap-8">
                {/* Stats Section - Left Side */}
                <div className="flex items-center gap-2">
                  {/* Total Essence Stat */}
                  <div className="relative group">
                    <div className="relative bg-gradient-to-br from-yellow-900/20 to-black/60 border border-yellow-500/40 px-6 py-3 clip-path-polygon">
                      {/* Glow effect on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/0 to-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Label */}
                      <div className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-medium mb-1">
                        ESSENCE
                      </div>
                      
                      {/* Value with glow */}
                      <div className="relative">
                        <div className="text-3xl font-bold font-mono text-yellow-400 tracking-tight" style={{
                          textShadow: '0 0 20px rgba(250, 182, 23, 0.5), 0 0 40px rgba(250, 182, 23, 0.3)'
                        }}>
                          {totalStats.totalAmount.toFixed(1)}
                        </div>
                        {/* Subtle pulse animation */}
                        <div className="absolute inset-0 animate-pulse opacity-50">
                          <div className="text-3xl font-bold font-mono text-yellow-400 tracking-tight blur-sm">
                            {totalStats.totalAmount.toFixed(1)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Corner accents */}
                    <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-yellow-400/60" />
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-yellow-400/60" />
                  </div>
                  
                  {/* Separator */}
                  <div className="h-12 w-px bg-gradient-to-b from-transparent via-yellow-500/30 to-transparent" />
                  
                  {/* Total Value Stat */}
                  <div className="relative group">
                    <div className="relative bg-gradient-to-br from-green-900/20 to-black/60 border border-green-500/40 px-6 py-3 clip-path-polygon">
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <div className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-medium mb-1">
                        VALUE
                      </div>
                      
                      <div className="relative">
                        <div className="text-3xl font-bold font-mono text-green-400 tracking-tight flex items-baseline" style={{
                          textShadow: '0 0 20px rgba(74, 222, 128, 0.5), 0 0 40px rgba(74, 222, 128, 0.3)'
                        }}>
                          {Math.round(totalStats.totalValue).toLocaleString()}
                          <span className="text-lg ml-1 text-green-400/80">g</span>
                        </div>
                        <div className="absolute inset-0 animate-pulse opacity-50">
                          <div className="text-3xl font-bold font-mono text-green-400 tracking-tight blur-sm">
                            {Math.round(totalStats.totalValue).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-green-400/60" />
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-green-400/60" />
                  </div>
                  
                  {/* Separator */}
                  <div className="h-12 w-px bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent" />
                  
                  {/* Types Stat */}
                  <div className="relative group">
                    <div className="relative bg-gradient-to-br from-cyan-900/20 to-black/60 border border-cyan-500/40 px-6 py-3 clip-path-polygon">
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <div className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-medium mb-1">
                        TYPES
                      </div>
                      
                      <div className="relative">
                        <div className="text-3xl font-bold font-mono text-cyan-400 tracking-tight" style={{
                          textShadow: '0 0 20px rgba(34, 211, 238, 0.5), 0 0 40px rgba(34, 211, 238, 0.3)'
                        }}>
                          {totalStats.uniqueTypes}
                        </div>
                        <div className="absolute inset-0 animate-pulse opacity-50">
                          <div className="text-3xl font-bold font-mono text-cyan-400 tracking-tight blur-sm">
                            {totalStats.uniqueTypes}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-cyan-400/60" />
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-cyan-400/60" />
                  </div>
                </div>
                
                {/* View Count Selector - Right Side with integrated design */}
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 blur-lg opacity-50" />
                  <div className="relative flex items-center bg-black/80 border border-yellow-500/30 p-1">
                    {/* Label */}
                    <div className="px-3 py-2 text-[10px] text-gray-400 uppercase tracking-[0.2em] border-r border-yellow-500/20">
                      Display
                    </div>
                    
                    {/* Buttons */}
                    <div className="flex">
                      {[
                        { value: 5, label: 'TOP 5' },
                        { value: 10, label: 'TOP 10' },
                        { value: 20, label: 'TOP 20' },
                        { value: 30, label: 'TOP 30' },
                        { value: 100, label: 'ALL' }
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => setViewCount(value as typeof viewCount)}
                          className={`relative px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                            viewCount === value
                              ? 'bg-gradient-to-r from-yellow-500/80 to-yellow-600/80 text-black shadow-lg'
                              : 'bg-black/40 text-gray-400 hover:bg-yellow-500/20 hover:text-yellow-400 hover:border-yellow-500/50'
                          }`}
                          style={{
                            clipPath: value === 100 
                              ? 'polygon(0 0, calc(100% - 8px) 0, 100% 100%, 8px 100%)' 
                              : undefined,
                            boxShadow: viewCount === value 
                              ? '0 0 20px rgba(250, 182, 23, 0.4), inset 0 0 10px rgba(250, 182, 23, 0.2)' 
                              : undefined
                          }}
                        >
                          {/* Active indicator */}
                          {viewCount === value && (
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 animate-pulse" />
                          )}
                          <span className="relative z-10">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
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
                {/* Search Bar - Above chart with proper spacing */}
                <div className="mb-8">
                  <div className="flex justify-center">
                    <div ref={searchRef} className="relative w-80">
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
                </div>
                
                {/* Filter Slider - Only shows when viewing All */}
                {viewCount === 100 && (
                  <div className="mb-6 bg-black/40 backdrop-blur-sm border border-yellow-500/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-400 uppercase tracking-widest">Filter by Maximum Amount</span>
                      <span className="text-sm font-semibold text-yellow-400">
                        {maxSliceFilter < 10 ? `Showing ≤ ${maxSliceFilter.toFixed(1)}` : 'Showing All'}
                      </span>
                    </div>
                    
                    <div className="relative">
                      {/* Slider Track Background */}
                      <div className="absolute inset-0 h-2 bg-gradient-to-r from-cyan-500/20 via-yellow-500/20 to-gray-700/20 rounded-full"></div>
                      
                      {/* Custom Slider */}
                      <input
                        type="range"
                        min="0.1"
                        max="10"
                        step="0.1"
                        value={maxSliceFilter}
                        onChange={(e) => setMaxSliceFilter(parseFloat(e.target.value))}
                        className="w-full h-2 bg-transparent rounded-full appearance-none cursor-pointer relative z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-yellow-400 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-yellow-400/50 [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-yellow-400 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-black [&::-moz-range-thumb]:cursor-pointer"
                      />
                      
                      {/* Scale markers */}
                      <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span>0.1</span>
                        <span>2</span>
                        <span>4</span>
                        <span>6</span>
                        <span>8</span>
                        <span>10</span>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-center">
                      <p className="text-xs text-gray-400">
                        Drag left to focus on smaller amounts • {displayedEssences.length} essences visible
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Donut Chart */}
                <div className="flex justify-center">
                  <EssenceDonutChart
                    data={displayedEssences.map(e => ({
                      ...e,
                      amount: e.amount,
                      isFull: e.amount >= (e.maxAmountBuffed || e.maxAmount || 10) // Mark if essence is full
                    }))}
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
                  const isFull = slice.amount >= effectiveMax;
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
                      
                      {/* Name */}
                      <div className="text-center mb-4">
                        <h2 className="mek-text-industrial text-3xl text-yellow-400 mek-text-shadow text-center">{slice.name.toUpperCase()}</h2>
                      </div>
                      
                      {/* Ownership Section */}
                      <div className="mek-header-industrial rounded-lg p-3 mb-4 relative overflow-hidden border-2 border-yellow-500/40">
                        <div className="flex justify-between items-center mb-2 relative z-10">
                          <span className="text-xs text-white uppercase tracking-widest">OWNERSHIP</span>
                          <span className="text-xl font-normal">
                            <span className="text-yellow-400">{slice.amount.toFixed(1)}</span>
                            <span className="text-cyan-400">/{effectiveMax}</span>
                          </span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="relative h-6 bg-black/80 rounded overflow-hidden border border-yellow-500/30">
                          {/* Filled portion - cyan/blue gradient - flashing if full */}
                          <div 
                            className={`absolute inset-y-0 left-0 transition-all duration-500 ${isFull ? 'animate-pulse' : ''}`}
                            style={{
                              width: `${Math.min((slice.amount / effectiveMax) * 100, 100)}%`,
                              background: isFull 
                                ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.9), rgba(96, 165, 250, 1), rgba(147, 197, 253, 0.9))' 
                                : 'linear-gradient(90deg, rgba(6, 182, 212, 0.8), rgba(6, 182, 212, 1), rgba(14, 165, 233, 0.9))',
                              animation: isFull ? 'flash 0.5s ease-in-out infinite' : 'none'
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
                      <div className="bg-black/40 backdrop-blur-sm border border-yellow-500/30 rounded-lg p-3 relative overflow-hidden">
                        <div className="absolute inset-0 mek-overlay-scratches opacity-10 pointer-events-none"></div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3 relative z-10">
                          {/* Row 1 */}
                          <div>
                            <p className="mek-label-uppercase mb-1">MARKET PRICE</p>
                            <p className="text-lg text-yellow-400">
                              <span className="font-semibold">{slice.currentValue}</span>
                              <span className="font-light">g/ea</span>
                            </p>
                          </div>
                          <div>
                            <p className="mek-label-uppercase mb-1">BASE RATE</p>
                            <p className="text-lg text-cyan-400">
                              <span className="font-semibold">{baseRate.toFixed(2)}</span>
                              <span className="font-light">/d</span>
                            </p>
                          </div>
                          
                          {/* Row 2 */}
                          <div>
                            <p className="mek-label-uppercase mb-1">TOTAL VALUE</p>
                            <p className="text-lg text-yellow-400">
                              <span className="font-semibold">{Math.round(totalValue).toLocaleString()}</span>
                              <span className="font-light">g</span>
                            </p>
                          </div>
                          <div>
                            <p className="mek-label-uppercase mb-1">BONUS RATE</p>
                            <p className="text-lg text-green-400">
                              <span className="font-semibold">{bonusRate > 0 ? `+${bonusRate.toFixed(2)}` : '+0.00'}</span>
                              <span className="font-light">/d</span>
                            </p>
                          </div>
                          
                          {/* Row 3 */}
                          <div>
                            <p className="mek-label-uppercase mb-1">THEORETICAL</p>
                            <p className="text-lg text-purple-400">
                              <span className="font-semibold">{Math.round(theoreticalIncome)}</span>
                              <span className="font-light">g/d</span>
                            </p>
                          </div>
                          <div>
                            <p className="mek-label-uppercase mb-1">TOTAL RATE</p>
                            <p className="text-lg text-cyan-400">
                              <span className="font-semibold">{totalRate.toFixed(2)}</span>
                              <span className="font-light">/d</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })() : (
                  <div className="mek-card-industrial mek-border-sharp-gold p-4 relative opacity-60">
                    {/* Subtle scan line effect */}
                    <div className="absolute inset-0 pointer-events-none mek-scan-effect opacity-20"></div>
                    
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
                    
                    {/* Floating hover instruction in center */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-black/90 backdrop-blur-md border-2 border-yellow-500/40 rounded-lg px-5 py-3 shadow-2xl">
                        <p className="text-yellow-400 text-sm font-semibold uppercase tracking-wider">Hover Chart for Details</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Clear text outside frame - only shows when selected */}
              {selectedSlice && (
                <div className="mt-3 text-center transition-all duration-300 opacity-100">
                  <button
                    onClick={handleClearSelection}
                    className="text-yellow-400/60 hover:text-yellow-400 text-sm uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* CSS for flashing animation */}
      <style jsx>{`
        @keyframes flash {
          0%, 100% {
            opacity: 1;
            filter: brightness(1);
          }
          50% {
            opacity: 0.7;
            filter: brightness(1.5);
          }
        }
      `}</style>
    </div>
  );
}