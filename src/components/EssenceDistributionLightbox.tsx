"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import EssenceDonutChart from "@/components/essence-donut-chart";
import "@/styles/global-design-system.css";

// Generate essence data
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

  return essenceNames.map((name, index) => {
    const hasBonus = index % 4 === 0;

    let amount;
    if (index === 0) amount = 0.1;
    else if (index === 1) amount = 2.5;
    else if (index === 2) amount = 9.8;
    else if (index === 3) amount = 0.05;
    else if (index === 4) amount = 1.2;
    else if (index === 5) amount = 7.3;
    else if (index === 6) amount = 0.8;
    else if (index === 7) amount = 13.5;
    else if (index === 8) amount = 3.4;
    else if (index === 9) amount = 0.3;
    else if (index === 10) amount = 5.6;
    else if (index === 11) amount = 0.15;
    else if (index === 12) amount = 4.2;
    else if (index === 13) amount = 1.8;
    else if (index === 14) amount = 8.2;
    else if (index < 25) {
      amount = 0.05 + ((index * 7) % 20) * 0.0975;
    } else {
      amount = 0.1 + ((index * 11) % 30) * 0.0967;
    }

    let maxAmount = 10;
    let maxAmountBuffed = undefined;

    if (index === 7) {
      maxAmountBuffed = 14;
    } else if (index === 14) {
      maxAmountBuffed = 11.5;
    } else if (index === 20) {
      maxAmountBuffed = 12;
    }

    const effectiveMax = maxAmountBuffed || maxAmount;
    amount = Math.min(amount, effectiveMax);

    return {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      amount: parseFloat(amount.toFixed(2)),
      currentValue: Math.floor(100 + ((index * 13 + 7) % 900)),
      maxAmount,
      maxAmountBuffed,
      icon: ["🔮", "💎", "⚡", "🌟", "🔥", "❄️", "🌿", "💫", "✨", "🌊"][index % 10],
      image: `/essence-images/bumblebee ${(index % 3) + 1}.png`,
      baseRate: 0.1,
      bonusRate: hasBonus ? 0.05 + (index % 5) * 0.01 : 0
    };
  });
};

interface EssenceDistributionLightboxProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EssenceDistributionLightbox({ isOpen, onClose }: EssenceDistributionLightboxProps) {
  const [viewCount, setViewCount] = useState<5 | 10 | 20 | 30 | 100>(20);
  const [essenceData] = useState(generateEssenceData());
  const [chartSize, setChartSize] = useState(525);
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  const [selectedSlice, setSelectedSlice] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSlotting, setIsSlotting] = useState(false);
  const [filterDesign, setFilterDesign] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [hoverEffect, setHoverEffect] = useState<1 | 2 | 3 | 4>(1);
  const searchRef = useRef<HTMLDivElement>(null);

  const defaultMaxAmount = Math.max(...generateEssenceData().map(e => e.amount));
  const [maxSliceFilter, setMaxSliceFilter] = useState(defaultMaxAmount);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const maxEssenceAmount = useMemo(() => {
    return Math.max(...essenceData.map(e => e.amount));
  }, [essenceData]);

  const displayedEssences = useMemo(() => {
    let filtered = [...essenceData]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, viewCount)
      .filter(e => e.amount > 0);

    if (viewCount === 100 && maxSliceFilter < maxEssenceAmount) {
      filtered = filtered.filter(e => e.amount <= maxSliceFilter);
    }

    return filtered;
  }, [essenceData, viewCount, maxSliceFilter, maxEssenceAmount]);

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

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    return essenceData
      .filter(e => e.name.toLowerCase().includes(query))
      .slice(0, 8)
      .sort((a, b) => {
        const aStart = a.name.toLowerCase().startsWith(query);
        const bStart = b.name.toLowerCase().startsWith(query);
        if (aStart && !bStart) return -1;
        if (!aStart && bStart) return 1;
        return b.amount - a.amount;
      });
  }, [searchQuery, essenceData]);

  const handleSearchSelect = (essenceId: string) => {
    setIsSlotting(true);
    setTimeout(() => setIsSlotting(false), 300);
    setSelectedSlice(essenceId);
    setHoveredSlice(essenceId);
    setSearchQuery("");
    setShowSearchResults(false);
  };

  const handleSliceClick = (essenceId: string) => {
    setIsSlotting(true);
    setTimeout(() => setIsSlotting(false), 300);
    setSelectedSlice(essenceId);
  };

  const handleClearSelection = () => {
    setSelectedSlice(null);
    setHoveredSlice(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Lightbox Container */}
      <div className="relative w-[1280px] max-w-[95vw] h-[90vh] bg-black/95 border-4 border-yellow-500/50 rounded-lg overflow-hidden shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-10 h-10 flex items-center justify-center bg-black/80 border-2 border-yellow-500/50 rounded hover:bg-yellow-500/20 hover:border-yellow-500 transition-all"
        >
          <span className="text-yellow-400 text-2xl font-bold">×</span>
        </button>

        {/* Scrollable Content */}
        <div className="w-full h-full overflow-y-auto">
          <div className="relative text-white">
            {/* Industrial Header */}
            <div className="w-full bg-gradient-to-b from-black via-gray-900/50 to-transparent">
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, #fab617 0, #fab617 10px, transparent 10px, transparent 20px)',
                  }} />
                </div>

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
            <div className="w-full sticky top-0 z-20">
              <div className="relative bg-black/95 backdrop-blur-xl border-y-2 border-yellow-500/30">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute inset-0 opacity-10" style={{
                    background: 'linear-gradient(180deg, transparent 0%, rgba(250, 182, 23, 0.3) 50%, transparent 100%)',
                    animation: 'scan 8s linear infinite',
                    height: '200%',
                    transform: 'translateY(-50%)'
                  }} />
                </div>

                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
                  backgroundImage: 'linear-gradient(0deg, rgba(250, 182, 23, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(250, 182, 23, 0.1) 1px, transparent 1px)',
                  backgroundSize: '40px 40px'
                }} />

                <div className="max-w-7xl mx-auto px-4 py-4">
                  <div className="flex items-center justify-between gap-8">
                    {/* Stats Section */}
                    <div className="flex items-center gap-2">
                      {/* Total Essence */}
                      <div className="relative group">
                        <div className="relative bg-gradient-to-br from-yellow-900/20 to-black/60 border border-yellow-500/40 px-6 py-3">
                          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/0 to-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-medium mb-1">ESSENCE</div>
                          <div className="relative">
                            <div className="text-3xl font-bold font-mono text-yellow-400 tracking-tight" style={{
                              textShadow: '0 0 20px rgba(250, 182, 23, 0.5), 0 0 40px rgba(250, 182, 23, 0.3)'
                            }}>
                              {totalStats.totalAmount.toFixed(1)}
                            </div>
                          </div>
                        </div>
                        <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-yellow-400/60" />
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-yellow-400/60" />
                      </div>

                      <div className="h-12 w-px bg-gradient-to-b from-transparent via-yellow-500/30 to-transparent" />

                      {/* Total Value */}
                      <div className="relative group">
                        <div className="relative bg-gradient-to-br from-green-900/20 to-black/60 border border-green-500/40 px-6 py-3">
                          <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-medium mb-1">VALUE</div>
                          <div className="relative">
                            <div className="text-3xl font-bold font-mono text-green-400 tracking-tight flex items-baseline" style={{
                              textShadow: '0 0 20px rgba(74, 222, 128, 0.5), 0 0 40px rgba(74, 222, 128, 0.3)'
                            }}>
                              {Math.round(totalStats.totalValue).toLocaleString()}
                              <span className="text-lg ml-1 text-green-400/80">g</span>
                            </div>
                          </div>
                        </div>
                        <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-green-400/60" />
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-green-400/60" />
                      </div>

                      <div className="h-12 w-px bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent" />

                      {/* Types */}
                      <div className="relative group">
                        <div className="relative bg-gradient-to-br from-cyan-900/20 to-black/60 border border-cyan-500/40 px-6 py-3">
                          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-medium mb-1">TYPES</div>
                          <div className="relative">
                            <div className="text-3xl font-bold font-mono text-cyan-400 tracking-tight" style={{
                              textShadow: '0 0 20px rgba(34, 211, 238, 0.5), 0 0 40px rgba(34, 211, 238, 0.3)'
                            }}>
                              {totalStats.uniqueTypes}
                            </div>
                          </div>
                        </div>
                        <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-cyan-400/60" />
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-cyan-400/60" />
                      </div>
                    </div>

                    {/* View Count Selector */}
                    <div className="relative">
                      <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 blur-lg opacity-50" />
                      <div className="relative flex items-center bg-black/80 border border-yellow-500/30 p-1">
                        <div className="px-3 py-2 text-[10px] text-gray-400 uppercase tracking-[0.2em] border-r border-yellow-500/20">
                          Display
                        </div>
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

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Container */}
                <div className="lg:col-span-2">
                  <div className="relative">
                    {/* Search Bar */}
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
                          <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>

                          {showSearchResults && searchResults.length > 0 && (
                            <div className="absolute top-full mt-2 w-full bg-black/95 backdrop-blur-sm border-2 border-yellow-500/30 rounded-lg overflow-hidden z-50">
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

                    {/* Donut Chart */}
                    <div className="flex justify-center">
                      <EssenceDonutChart
                        data={displayedEssences.map(e => ({
                          ...e,
                          amount: e.amount,
                          isFull: e.amount >= (e.maxAmountBuffed || e.maxAmount || 10)
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
                  </div>
                </div>

                {/* Details Panel */}
                <div className="lg:col-span-1">
                  <div className="sticky top-24">
                    {(hoveredSlice || selectedSlice) ? (() => {
                      const activeSlice = hoveredSlice || selectedSlice;
                      const slice = essenceData.find(e => e.id === activeSlice);
                      if (!slice) return null;

                      const sliceIndex = essenceData.indexOf(slice);
                      const effectiveMax = slice.maxAmountBuffed || slice.maxAmount || 10;
                      const isFull = slice.amount >= effectiveMax;
                      const baseRate = slice.baseRate || 0.1;
                      const bonusRate = slice.bonusRate || 0;
                      const totalRate = baseRate + bonusRate;
                      const totalValue = slice.amount * slice.currentValue;
                      const theoreticalIncome = totalRate * slice.currentValue;

                      return (
                        <div className={`mek-card-industrial mek-border-sharp-gold p-4 relative ${isSlotting ? 'animate-pulse' : ''}`}>
                          <div className="absolute inset-0 pointer-events-none mek-scan-effect opacity-30"></div>

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
                              <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-yellow-400" style={{
                                  textShadow: '0 0 20px rgba(250, 182, 23, 0.8), 0 0 40px rgba(250, 182, 23, 0.4)'
                                }}>
                                  {slice.amount.toFixed(1)}
                                </span>
                                <span className="text-xl font-normal">
                                  <span className="text-gray-400">/</span>
                                  <span className={slice.maxAmountBuffed && slice.maxAmountBuffed > 10 ? "text-green-400" : "text-white"}>
                                    {effectiveMax}
                                  </span>
                                </span>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="relative h-6 bg-black/80 rounded overflow-hidden border border-yellow-500/30">
                              <div
                                className={`absolute inset-y-0 left-0 transition-all duration-500 ${isFull ? 'animate-pulse' : ''}`}
                                style={{
                                  width: `${Math.min((slice.amount / effectiveMax) * 100, 100)}%`,
                                  background: isFull
                                    ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.9), rgba(96, 165, 250, 1), rgba(147, 197, 253, 0.9))'
                                    : 'linear-gradient(90deg, rgba(6, 182, 212, 0.8), rgba(6, 182, 212, 1), rgba(14, 165, 233, 0.9))'
                                }}
                              />
                            </div>
                          </div>

                          {/* Stats Grid */}
                          <div className="bg-black/40 backdrop-blur-sm border border-yellow-500/30 rounded-lg p-3 relative overflow-hidden">
                            <div className="absolute inset-0 mek-overlay-scratches opacity-10 pointer-events-none"></div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-3 relative z-10">
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
                            </div>
                          </div>
                        </div>
                      );
                    })() : (
                      <div className="mek-card-industrial mek-border-sharp-gold p-4 relative opacity-60">
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="bg-black/90 backdrop-blur-md border-2 border-yellow-500/40 rounded-lg px-5 py-3 shadow-2xl">
                            <p className="text-yellow-400 text-sm font-semibold uppercase tracking-wider">Hover Chart for Details</p>
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
      </div>
    </div>
  );
}
