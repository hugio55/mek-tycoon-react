"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import EssenceDonutChart from "@/components/essence-donut-chart";
import EssenceDistributionLightbox from "@/components/EssenceDistributionLightbox";
import "@/styles/global-design-system.css";
import { getMediaUrl } from "@/lib/media-url";

// Session Timer Component - Shows countdown to session expiration
function SessionTimer({ expiresAt }: { expiresAt: number }) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const remaining = expiresAt - now;

      if (remaining <= 0) {
        setTimeRemaining('Expired');
        setIsExpiringSoon(true);
        return;
      }

      setIsExpiringSoon(remaining < 60 * 60 * 1000);

      const hours = Math.floor(remaining / (60 * 60 * 1000));
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`${minutes}m`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <div className={`font-mono text-base sm:text-lg ${isExpiringSoon ? 'text-orange-400' : 'text-green-400'}`}>
      {timeRemaining}
    </div>
  );
}

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
  const [viewCount, setViewCount] = useState<5 | 10 | 20 | 30 | 100>(20);
  const [essenceData] = useState(generateEssenceData());
  const [chartSize, setChartSize] = useState(525); // Increased by 5%
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  const [selectedSlice, setSelectedSlice] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSlotting, setIsSlotting] = useState(false);
  const [filterDesign, setFilterDesign] = useState<1 | 2 | 3 | 4 | 5>(1); // Select filter design
  const [hoverEffect, setHoverEffect] = useState<1 | 2 | 3 | 4>(1); // Select hover effect style
  const [isDistributionOpen, setIsDistributionOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Calculate the actual maximum essence amount first
  const defaultMaxAmount = Math.max(...generateEssenceData().map(e => e.amount));
  const [maxSliceFilter, setMaxSliceFilter] = useState(defaultMaxAmount); // Default to max (show all)

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

  // Calculate the actual maximum essence amount in the data
  const maxEssenceAmount = useMemo(() => {
    return Math.max(...essenceData.map(e => e.amount));
  }, [essenceData]);
  
  // Sort and slice essence data for display with filtering
  const displayedEssences = useMemo(() => {
    let filtered = [...essenceData]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, viewCount)
      .filter(e => e.amount > 0); // Only show essences with quantity
    
    // Apply max filter - only show essences below the threshold
    if (viewCount === 100 && maxSliceFilter < maxEssenceAmount) {
      filtered = filtered.filter(e => e.amount <= maxSliceFilter);
    }
    
    return filtered;
  }, [essenceData, viewCount, maxSliceFilter, maxEssenceAmount]);
  
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
        {/* Controls Bar - Redesigned Sci-Fi Stats Display */}
        <div className="w-full sticky top-0 z-20 mt-16">
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
          <div className="flex justify-center items-center min-h-[60vh]">
            <button
              onClick={() => setIsDistributionOpen(true)}
              className="group relative mek-card-industrial mek-border-sharp-gold p-12 hover:scale-105 transition-transform duration-300"
            >
              {/* Animated background */}
              <div className="absolute inset-0 mek-overlay-scratches opacity-10 pointer-events-none"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/0 to-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

              {/* Content */}
              <div className="relative z-10 text-center">
                <div className="mb-4">
                  <svg className="w-24 h-24 mx-auto text-yellow-400 group-hover:text-yellow-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                </div>
                <h2 className="mek-text-industrial text-4xl text-yellow-400 mb-2">
                  VIEW DISTRIBUTION
                </h2>
                <p className="text-gray-400 uppercase tracking-wider text-sm">
                  Click to analyze essence allocation
                </p>
              </div>

              {/* Corner accents */}
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-yellow-400/60 group-hover:border-yellow-300 transition-colors" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-yellow-400/60 group-hover:border-yellow-300 transition-colors" />
            </button>
          </div>
        </div>
      </div>

      {/* Essence Distribution Lightbox */}
      <EssenceDistributionLightbox
        isOpen={isDistributionOpen}
        onClose={() => setIsDistributionOpen(false)}
      />

      {/* OLD CONTENT - KEEPING FOR REFERENCE BUT HIDDEN */}
      <div className="hidden">
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

                {/* 5 Slot Thumbnails - At-a-Glance Display */}
                <div className="mb-6 flex justify-center">
                  <div className="flex gap-3">
                    {[1, 2, 3, 4, 5].map((slotNum) => {
                      const isUnlocked = slotNum === 1; // For now, only slot 1 is unlocked
                      const hasMek = false; // TODO: Connect to real data

                      return (
                        <div
                          key={slotNum}
                          className={`relative group cursor-pointer transition-all duration-200 ${
                            isUnlocked ? 'hover:scale-105' : 'opacity-60'
                          }`}
                          style={{ width: '80px', height: '80px' }}
                        >
                          {/* Slot container */}
                          <div className={`w-full h-full rounded-lg border-2 ${
                            isUnlocked
                              ? 'border-yellow-500/50 bg-gradient-to-br from-yellow-900/20 to-black/60'
                              : 'border-gray-600/50 bg-black/60'
                          } overflow-hidden relative`}>

                            {/* Slot number indicator */}
                            <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-black/80 border border-yellow-500/50 flex items-center justify-center z-10">
                              <span className="text-[10px] font-bold text-yellow-400">{slotNum}</span>
                            </div>

                            {/* Unlocked slot - ready for Mek */}
                            {isUnlocked && !hasMek && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-yellow-500/30 text-3xl">+</div>
                              </div>
                            )}

                            {/* Locked slot - show lock icon and cost */}
                            {!isUnlocked && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="text-gray-500 text-2xl mb-1">🔒</div>
                                <div className="text-[9px] text-gray-500 text-center px-1">
                                  <div>{slotNum * 10}k g</div>
                                  <div>{slotNum} essence</div>
                                </div>
                              </div>
                            )}

                            {/* Mek image (when slotted) */}
                            {hasMek && (
                              <img
                                src={getMediaUrl("/mek-images/150px/000-000-000.webp")}
                                alt="Slotted Mek"
                                className="w-full h-full object-cover"
                              />
                            )}

                            {/* Hover glow effect */}
                            {isUnlocked && (
                              <div className="absolute inset-0 bg-yellow-500/0 group-hover:bg-yellow-500/20 transition-all duration-200 pointer-events-none" />
                            )}
                          </div>

                          {/* Hover tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 border border-yellow-500/30 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            {isUnlocked
                              ? (hasMek ? 'Click to swap Mek' : 'Click to assign Mek')
                              : `Unlock: ${slotNum * 10}k gold + ${slotNum} essence types`
                            }
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Filter Design Selector - Only shows when viewing All */}
                {viewCount === 100 && (
                  <div className="mb-2 flex justify-center">
                    <div className="bg-black/60 backdrop-blur-sm border border-yellow-500/30 rounded-lg px-3 py-1.5 flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider">Filter Style:</span>
                      <select 
                        value={filterDesign} 
                        onChange={(e) => setFilterDesign(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                        className="bg-black/80 border border-yellow-500/20 rounded px-2 py-0.5 text-xs text-yellow-400 focus:outline-none focus:border-yellow-500/40"
                      >
                        <option value={1}>Ultra-Minimal</option>
                        <option value={2}>Industrial Panel</option>
                        <option value={3}>HUD Strip</option>
                        <option value={4}>Minimalist Tech</option>
                        <option value={5}>Command Strip</option>
                      </select>
                    </div>
                  </div>
                )}
                
                {/* Filter Option 1: Ultra-Minimal Inline Bar */}
                {filterDesign === 1 && (
                  <div className={`mb-3 h-10 bg-black/60 backdrop-blur-sm border-l-4 border-yellow-500 overflow-hidden transition-all duration-500 ease-out ${
                    viewCount === 100 ? 'max-h-10 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                  <div className="h-full px-4 flex items-center gap-4">
                    {/* Compact Label */}
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-500/70 whitespace-nowrap">
                      MAX
                    </span>
                    
                    {/* Inline Slider with proper alignment */}
                    <div className="flex-1 relative flex items-center">
                      <div className="absolute inset-0 h-[2px] bg-gradient-to-r from-yellow-500/10 via-yellow-500/30 to-gray-700/20 rounded-full"></div>
                      <input
                        type="range"
                        min="0"
                        max={maxEssenceAmount}
                        step="0.1"
                        value={maxSliceFilter}
                        onChange={(e) => setMaxSliceFilter(parseFloat(e.target.value))}
                        className="w-full h-[2px] bg-transparent appearance-none cursor-pointer relative z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-yellow-400 [&::-webkit-slider-thumb]:to-yellow-600 [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(250,182,23,0.5)] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:-mt-[7px] [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-gradient-to-br [&::-moz-range-thumb]:from-yellow-400 [&::-moz-range-thumb]:to-yellow-600 [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-black [&::-moz-range-thumb]:cursor-pointer"
                      />
                      {/* Quick markers for reference */}
                      <div className="absolute inset-x-0 top-full mt-0.5 flex justify-between pointer-events-none">
                        <span className="text-[7px] text-gray-600">0</span>
                        <span className="text-[7px] text-gray-600">{(maxEssenceAmount / 2).toFixed(1)}</span>
                        <span className="text-[7px] text-gray-600">{maxEssenceAmount.toFixed(1)}</span>
                      </div>
                    </div>
                    
                    {/* Live Value Display */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-500">≤</span>
                      <span className="text-sm font-mono font-bold text-yellow-400 min-w-[3ch]">
                        {maxSliceFilter < maxEssenceAmount ? maxSliceFilter.toFixed(1) : 'ALL'}
                      </span>
                      <span className="text-[10px] text-gray-500">({displayedEssences.length})</span>
                    </div>
                  </div>
                </div>
                )}
                
                {/* Filter Option 2: Industrial Control Panel */}
                {filterDesign === 2 && viewCount === 100 && (
                  <div className="mb-4 h-14 relative overflow-hidden animate-in slide-in-from-top-2 duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-gray-900/60 to-black/80 backdrop-blur-md"></div>
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(250,182,23,0.03)_2px,rgba(250,182,23,0.03)_4px)]"></div>
                    <div className="relative h-full border-y-2 border-yellow-500/30 flex items-center px-4">
                      <div className="flex items-center gap-2 mr-4">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-bold text-yellow-500/80 uppercase tracking-[0.3em]">FILTER</span>
                      </div>
                      <div className="flex-1 relative px-2">
                        <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
                          {[0, maxEssenceAmount * 0.2, maxEssenceAmount * 0.4, maxEssenceAmount * 0.6, maxEssenceAmount * 0.8, maxEssenceAmount].map((val, i) => (
                            <div key={i} className="flex flex-col items-center">
                              <div className={`w-[1px] h-3 ${i === 0 || i === 5 ? 'bg-yellow-500/50' : 'bg-gray-600/30'}`}></div>
                              <span className="text-[8px] text-gray-600 mt-1">{val.toFixed(1)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="relative flex items-center h-6">
                          <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-cyan-500/20 via-yellow-500/40 to-orange-500/20 rounded"></div>
                          <input type="range" min="0" max={maxEssenceAmount} step="0.1" value={maxSliceFilter} onChange={(e) => setMaxSliceFilter(parseFloat(e.target.value))} className="w-full h-6 bg-transparent appearance-none cursor-pointer relative z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-yellow-400 [&::-webkit-slider-thumb]:rounded-sm [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgba(250,182,23,0.6)] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:bg-yellow-300 [&::-webkit-slider-thumb]:active:scale-110" />
                        </div>
                      </div>
                      <div className="ml-4 bg-black/60 border border-yellow-500/30 px-3 py-1 rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-yellow-400 font-bold">{maxSliceFilter.toFixed(1)}</span>
                          <span className="text-[9px] text-gray-500">MAX</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Filter Option 3: Compact HUD Strip */}
                {filterDesign === 3 && viewCount === 100 && (
                  <div className="mb-3 h-12 relative group transition-all duration-500 ease-out">
                    <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-gray-900/30 to-black/40 backdrop-blur-sm" style={{clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 100%, 20px 100%)'}}></div>
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-yellow-500 to-transparent"></div>
                    <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-yellow-500 to-transparent"></div>
                    <div className="relative h-full flex items-center px-6">
                      <div className="flex items-center gap-3 mr-4">
                        <div className="relative">
                          <div className="absolute inset-0 bg-yellow-400/20 blur-lg"></div>
                          <span className="relative text-[10px] font-black text-yellow-400 uppercase">LIMIT</span>
                        </div>
                        <span className="text-[11px] text-gray-400">{displayedEssences.length} shown</span>
                      </div>
                      <div className="flex-1 relative mx-4">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full h-[3px] bg-gradient-to-r from-gray-700/30 via-yellow-500/20 to-gray-700/30 rounded-full"></div>
                        </div>
                        <input type="range" min="0" max={maxEssenceAmount} step="0.1" value={maxSliceFilter} onChange={(e) => setMaxSliceFilter(parseFloat(e.target.value))} className="relative w-full h-[3px] bg-transparent appearance-none cursor-pointer z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[18px] [&::-webkit-slider-thumb]:h-[18px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-yellow-400 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-gray-900 [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(250,182,23,0.7)] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:shadow-[0_0_20px_rgba(250,182,23,1)]" />
                        <div className="absolute inset-x-0 top-full mt-1 flex justify-between pointer-events-none">
                          <span className="text-[8px] text-gray-600">0</span>
                          <span className="text-[8px] text-gray-600">{(maxEssenceAmount / 2).toFixed(1)}</span>
                          <span className="text-[8px] text-gray-600">{maxEssenceAmount.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-0 bg-yellow-400/30 blur-xl"></div>
                        <div className="relative bg-black/80 border border-yellow-500/50 px-3 py-1 rounded-sm">
                          <span className="text-sm font-mono font-bold text-yellow-400">≤{maxSliceFilter.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Filter Option 4: Minimalist Tech Bar */}
                {filterDesign === 4 && viewCount === 100 && (
                  <div className="mb-3 h-9 bg-gradient-to-r from-gray-900/20 via-gray-800/30 to-gray-900/20 backdrop-blur-sm border-t border-b border-yellow-500/10 transition-all duration-300 ease-out">
                    <div className="h-full flex items-center px-4 gap-4">
                      <span className="text-[11px] text-gray-500 font-medium min-w-fit">MAX:</span>
                      <div className="flex-1 relative flex items-center">
                        <div className="absolute w-full h-[1px] bg-gray-700/50"></div>
                        <div className="absolute h-[1px] bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" style={{width: `${(maxSliceFilter / maxEssenceAmount) * 100}%`}}></div>
                        <input type="range" min="0" max={maxEssenceAmount} step="0.1" value={maxSliceFilter} onChange={(e) => setMaxSliceFilter(parseFloat(e.target.value))} className="relative w-full h-4 bg-transparent appearance-none cursor-pointer z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-yellow-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-150 [&::-webkit-slider-thumb]:active:scale-125" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-yellow-400/90">{maxSliceFilter.toFixed(1)}</span>
                        <span className="text-[10px] text-gray-600">({displayedEssences.length})</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Filter Option 5: Floating Command Strip */}
                {filterDesign === 5 && viewCount === 100 && (
                  <div className="mb-4 relative animate-in fade-in slide-in-from-left-4 duration-500">
                    <div className="h-11 relative group">
                      <div className="absolute inset-0 bg-yellow-500/10 blur-2xl transform translate-y-2"></div>
                      <div className="relative h-full bg-gradient-to-r from-gray-900/80 via-black/90 to-gray-900/80 backdrop-blur-md border border-yellow-500/20 rounded-sm overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-8 opacity-30" style={{background: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(250,182,23,0.2) 4px, rgba(250,182,23,0.2) 8px)'}}></div>
                        <div className="relative h-full flex items-center px-10">
                          <div className="flex items-center gap-2 mr-6">
                            <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z"/>
                            </svg>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">FILTER</span>
                          </div>
                          <div className="flex-1 relative">
                            <div className="relative h-5 flex items-center">
                              <div className="absolute w-full h-[4px] bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-cyan-500/50 to-yellow-500/50 transition-all duration-150" style={{width: `${(maxSliceFilter / maxEssenceAmount) * 100}%`}}></div>
                              </div>
                              <input type="range" min="0" max={maxEssenceAmount} step="0.1" value={maxSliceFilter} onChange={(e) => setMaxSliceFilter(parseFloat(e.target.value))} className="absolute w-full h-5 bg-transparent appearance-none cursor-pointer z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-sm [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-yellow-300 [&::-webkit-slider-thumb]:to-yellow-500 [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-black/50 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:from-yellow-200 [&::-webkit-slider-thumb]:hover:to-yellow-400 [&::-webkit-slider-thumb]:active:scale-90" />
                            </div>
                            <div className="absolute inset-x-0 -bottom-3 flex justify-between pointer-events-none">
                              <span className="text-[8px] text-gray-600">0</span>
                              <span className="text-[8px] text-gray-600">{(maxEssenceAmount / 2).toFixed(1)}</span>
                              <span className="text-[8px] text-gray-600">{maxEssenceAmount.toFixed(1)}</span>
                            </div>
                          </div>
                          <div className="ml-6 flex items-center gap-3">
                            <div className="h-6 w-[1px] bg-gray-700"></div>
                            <div className="flex flex-col items-end">
                              <span className="text-xs font-bold text-yellow-400">{maxSliceFilter < maxEssenceAmount ? `≤${maxSliceFilter.toFixed(1)}` : 'ALL'}</span>
                              <span className="text-[9px] text-gray-500">{displayedEssences.length} items</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Donut Chart with smooth transition */}
                <div className={`flex justify-center transition-all duration-500 ease-out ${
                  viewCount === 100 ? 'transform translate-y-0' : 'transform -translate-y-3'
                }`}>
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
                    hoverEffect={hoverEffect}
                  />
                </div>
                
                {/* Hover Effect Selector */}
                <div className="mt-6 flex justify-center">
                  <div className="bg-black/60 backdrop-blur-sm border border-yellow-500/30 rounded-lg px-3 py-1.5 flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">Hover Effect:</span>
                    <select 
                      value={hoverEffect} 
                      onChange={(e) => setHoverEffect(Number(e.target.value) as 1 | 2 | 3 | 4)}
                      className="bg-black/80 border border-yellow-500/20 rounded px-2 py-0.5 text-xs text-yellow-400 focus:outline-none focus:border-yellow-500/40"
                    >
                      <option value={1}>Inner Glow</option>
                      <option value={2}>Brightness Boost</option>
                      <option value={3}>Radial Gradient</option>
                      <option value={4}>Pulse Effect</option>
                    </select>
                  </div>
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
                      <div className="mek-header-industrial rounded-lg p-3 mb-4 relative overflow-hidden border-2 border-yellow-500/40 group/ownership">
                        <div className="flex justify-between items-center mb-2 relative z-10">
                          <span className="text-xs text-white uppercase tracking-widest">OWNERSHIP</span>
                          <div className="flex items-baseline gap-1">
                            <span className="relative">
                              <span className="text-3xl font-bold text-yellow-400" style={{
                                textShadow: '0 0 20px rgba(250, 182, 23, 0.8), 0 0 40px rgba(250, 182, 23, 0.4)',
                                filter: 'drop-shadow(0 0 10px rgba(250, 182, 23, 0.5))'
                              }}>
                                {slice.amount.toFixed(1)}
                              </span>
                              {/* Subtle pulse glow behind the number */}
                              <span className="absolute inset-0 text-3xl font-bold text-yellow-400 animate-pulse opacity-50 blur-sm" aria-hidden="true">
                                {slice.amount.toFixed(1)}
                              </span>
                            </span>
                            <span className="text-xl font-normal">
                              <span className="text-gray-400">/</span>
                              <span className={slice.maxAmountBuffed && slice.maxAmountBuffed > 10 ? "text-green-400" : "text-white"}>
                                {effectiveMax}
                              </span>
                            </span>
                          </div>
                        </div>
                        
                        {/* Storage Modifications Tooltip */}
                        <div className="absolute left-0 top-full mt-2 w-full opacity-0 pointer-events-none group-hover/ownership:opacity-100 group-hover/ownership:pointer-events-auto transition-opacity duration-200 z-50">
                          <div className="bg-black/95 backdrop-blur-sm border border-yellow-500/30 rounded-lg p-3 shadow-2xl">
                            <div className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-2">Storage Modifications</div>
                            <div className="space-y-1">
                              {/* Base storage */}
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-400">Base Storage</span>
                                <span className="text-white">10.0</span>
                              </div>
                              
                              {/* Show buff sources if buffed */}
                              {slice.maxAmountBuffed && slice.maxAmountBuffed > 10 && (
                                <>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-400">Bumblebee Head (Mek #1560)</span>
                                    <span className="text-green-400">+2.0</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-400">Mechanism Tree Node</span>
                                    <span className="text-green-400">+{(slice.maxAmountBuffed - 12).toFixed(1)}</span>
                                  </div>
                                </>
                              )}
                              
                              {/* Total */}
                              <div className="border-t border-gray-700 mt-1 pt-1 flex justify-between text-xs font-bold">
                                <span className="text-yellow-400">Total Capacity</span>
                                <span className={slice.maxAmountBuffed && slice.maxAmountBuffed > 10 ? "text-green-400" : "text-white"}>
                                  {effectiveMax.toFixed(1)}
                                </span>
                              </div>
                              
                              {/* Current ownership info */}
                              <div className="border-t border-gray-700 mt-1 pt-1 flex justify-between text-xs">
                                <span className="text-gray-400">Current Stored</span>
                                <span className="text-yellow-400">{slice.amount.toFixed(1)}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-400">Remaining Space</span>
                                <span className="text-cyan-400">{(effectiveMax - slice.amount).toFixed(1)}</span>
                              </div>
                            </div>
                          </div>
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
                        src={getMediaUrl("/essence-images/bumblebee 1.png")}
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
    </div>
  );
}