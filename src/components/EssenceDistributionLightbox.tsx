"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import EssenceDonutChart from "@/components/essence-donut-chart";
import "@/styles/global-design-system.css";

interface EssenceDistributionLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress?: string;
}

// Real-time accumulation component showing high-precision decimals
// CRITICAL FIX: Use client-side time calculation like gold system
// Backend gives us a snapshot at query time, but we continue accumulating client-side
function RealTimeAccumulation({ currentAmount, ratePerDay, isFull, essenceId }: { currentAmount: number; ratePerDay: number; isFull: boolean; essenceId: string }) {
  const [displayAmount, setDisplayAmount] = useState(currentAmount);

  // CRITICAL: Only reset when component MOUNTS or when hovering to a DIFFERENT essence
  // Don't reset just because backend re-calculated the same essence
  const mountTimeRef = useRef(Date.now());
  const mountAmountRef = useRef(currentAmount);
  const isInitialMountRef = useRef(true);

  // Only update baseline when we first render THIS essence or when the essence ID changes
  useEffect(() => {
    if (isInitialMountRef.current) {
      // First render of this component
      console.log(`🎯 [FRONTEND MOUNT] ${essenceId} - Initial mount:`, {
        currentAmount: currentAmount.toFixed(12),
        timestamp: new Date().toISOString()
      });
      mountTimeRef.current = Date.now();
      mountAmountRef.current = currentAmount;
      setDisplayAmount(currentAmount);
      isInitialMountRef.current = false;
    } else {
      // essenceId changed - we're hovering to a different essence
      console.log(`🎯 [FRONTEND SWITCH] ${essenceId} - Essence changed:`, {
        newCurrentAmount: currentAmount.toFixed(12),
        timestamp: new Date().toISOString(),
        resetToNewEssence: true
      });
      mountTimeRef.current = Date.now();
      mountAmountRef.current = currentAmount;
      setDisplayAmount(currentAmount);
    }
  }, [essenceId]); // ONLY reset when essenceId changes, NOT when currentAmount changes

  // Separate effect for animation - runs continuously without resetting
  useEffect(() => {
    if (isFull) {
      setDisplayAmount(currentAmount);
      return;
    }

    console.log(`⏱️ [FRONTEND ANIMATION] ${essenceId} - Starting animation interval:`, {
      mountAmount: mountAmountRef.current.toFixed(12),
      ratePerDay,
      mountTime: new Date(mountTimeRef.current).toISOString()
    });

    // Update every 50ms for smooth animation
    // CRITICAL: Use mountTimeRef and mountAmountRef which only update when essence changes
    const interval = setInterval(() => {
      const elapsedMs = Date.now() - mountTimeRef.current;
      const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
      const accumulated = mountAmountRef.current + (ratePerDay * elapsedDays);
      setDisplayAmount(accumulated);
    }, 50);

    return () => {
      console.log(`🛑 [FRONTEND ANIMATION] ${essenceId} - Cleaning up interval`);
      clearInterval(interval);
    };
  }, [ratePerDay, isFull, essenceId]); // Removed currentAmount from dependencies

  return (
    <div className="mt-3 pt-3 border-t border-yellow-500/20">
      <div className="text-center">
        <div className="text-[10px] text-gray-400 uppercase tracking-[0.2em] mb-1 font-bold">
          Real-Time Accumulation
        </div>
        <div
          className="text-xl font-mono text-cyan-400 tracking-tight tabular-nums"
          style={{
            textShadow: '0 0 10px rgba(34, 211, 238, 0.5)',
            fontVariantNumeric: 'tabular-nums'
          }}
        >
          {displayAmount.toFixed(12)}
        </div>
      </div>
    </div>
  );
}

export default function EssenceDistributionLightbox({ isOpen, onClose, walletAddress = "demo_wallet_123" }: EssenceDistributionLightboxProps) {
  const [viewCount, setViewCount] = useState<5 | 10 | 20 | 30 | 100>(20);
  const [chartSize, setChartSize] = useState(525);
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  const [selectedSlice, setSelectedSlice] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSlotting, setIsSlotting] = useState(false);
  const [filterDesign, setFilterDesign] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [hoverEffect, setHoverEffect] = useState<1 | 2 | 3 | 4>(1);
  const searchRef = useRef<HTMLDivElement>(null);

  // Query player's essence data from Convex
  const playerEssenceState = useQuery(
    api.essence.getPlayerEssenceState,
    { walletAddress }
  );

  // Query marketplace listings to get current prices
  const marketListings = useQuery(
    api.marketplace.getActiveListings,
    { itemType: "essence", limit: 1000 }
  );

  // Query essence config for base rates
  const essenceConfig = useQuery(api.essence.getEssenceConfig);

  // Transform player essence balances into chart-ready data
  const essenceData = useMemo(() => {
    if (!playerEssenceState?.balances) return [];

    // DEBUG: Log raw backend values to prove they're real
    console.log('📦 [FRONTEND USEMEMO] Received backend essence values:',
      playerEssenceState.balances.map((b: any) => ({
        name: b.variationName,
        amount: b.accumulatedAmount.toFixed(12),
        timestamp: new Date().toISOString()
      }))
    );

    // Calculate average market price for each essence type
    const marketPrices: Record<string, number> = {};
    if (marketListings?.listings) {
      marketListings.listings.forEach((listing: any) => {
        const essType = listing.itemVariation || listing.essenceType;
        if (essType && listing.pricePerUnit) {
          if (!marketPrices[essType]) {
            marketPrices[essType] = listing.pricePerUnit;
          } else {
            // Average if multiple listings
            marketPrices[essType] = (marketPrices[essType] + listing.pricePerUnit) / 2;
          }
        }
      });
    }

    const essenceIcons = ["🔮", "💎", "⚡", "🌟", "🔥", "❄️", "🌿", "💫", "✨", "🌊"];

    return playerEssenceState.balances.map((balance: any, index: number) => {
      const currentValue = marketPrices[balance.variationName] || 100;
      const baseRate = essenceConfig?.essenceRate || 0.1;
      const essenceCap = essenceConfig?.essenceCap || 10;

      // Use variation name to construct image path (lowercase, replace spaces with hyphens)
      const imageName = balance.variationName.toLowerCase().replace(/\s+/g, '-');

      return {
        id: balance.variationName.toLowerCase().replace(/\s+/g, '-'),
        name: balance.variationName,
        amount: parseFloat(balance.accumulatedAmount.toFixed(2)),
        currentValue: Math.floor(currentValue),
        maxAmount: essenceCap,
        maxAmountBuffed: undefined, // TODO: Get from buffs
        icon: essenceIcons[index % essenceIcons.length],
        image: `/essence-images/${imageName}.png`, // Map to variation-specific images
        baseRate,
        bonusRate: 0 // TODO: Get from buffs
      };
    });
  }, [playerEssenceState, marketListings, essenceConfig]);

  const defaultMaxAmount = Math.max(...(essenceData.length > 0 ? essenceData.map(e => e.amount) : [10]));
  const [maxSliceFilter, setMaxSliceFilter] = useState(defaultMaxAmount);

  // Update max filter when data changes
  useEffect(() => {
    if (essenceData.length > 0) {
      const newMax = Math.max(...essenceData.map(e => e.amount));
      setMaxSliceFilter(newMax);
    }
  }, [essenceData]);

  // Clear selection when lightbox reopens
  useEffect(() => {
    if (isOpen) {
      setSelectedSlice(null);
      setHoveredSlice(null);
    }
  }, [isOpen]);

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
    setSelectedSlice(essenceId);
    setHoveredSlice(essenceId);
    setSearchQuery("");
    setShowSearchResults(false);
  };

  const handleSliceClick = (essenceId: string) => {
    // Toggle selection: if clicking same slice, deselect it
    if (selectedSlice === essenceId) {
      setSelectedSlice(null);
      setHoveredSlice(null);
    } else {
      setSelectedSlice(essenceId);
    }
  };

  const handleClearSelection = () => {
    setSelectedSlice(null);
    setHoveredSlice(null);
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    // Only clear selection if clicking directly on the background (not on children)
    if (e.target === e.currentTarget) {
      handleClearSelection();
    }
  };

  if (!isOpen) return null;

  // Show loading state while data is being fetched (but only for a reasonable time)
  const isLoading = playerEssenceState === undefined || marketListings === undefined || essenceConfig === undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Lightbox Container */}
      <div className="relative w-[960px] max-w-[95vw] h-[90vh] bg-black/95 border-4 border-yellow-500/50 rounded-lg overflow-hidden shadow-2xl">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-yellow-400 text-lg uppercase tracking-wider">Loading Essence Data...</p>
            </div>
          </div>
        )}
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-10 h-10 flex items-center justify-center bg-black/80 border-2 border-yellow-500/50 rounded hover:bg-yellow-500/20 hover:border-yellow-500 transition-all"
        >
          <span className="text-yellow-400 text-2xl font-bold">×</span>
        </button>

        {/* Scrollable Content */}
        <div className="w-full h-full overflow-y-auto overflow-x-hidden scrollbar-hide" onClick={handleBackgroundClick}>
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
                  <p className="text-center text-gray-500 uppercase tracking-[0.3em] text-sm mb-1">
                    View Your Essence Inventory
                  </p>
                  <p className="text-center text-gray-400 text-xs max-w-2xl mx-auto" style={{
                    lineHeight: '1.6'
                  }}>
                    Your slotted Mek variations generate unique essence daily. Track all accumulated essence types and their current market values.
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
                          <div className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-medium mb-1 text-center">ESSENCE</div>
                          <div className="relative text-center">
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
                          <div className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-medium mb-1 text-center">VALUE</div>
                          <div className="relative text-center">
                            <div className="text-3xl font-bold font-mono text-green-400 tracking-tight inline-flex items-baseline" style={{
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
                          <div className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-medium mb-1 text-center">TYPES</div>
                          <div className="relative text-center">
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
            <div className="max-w-7xl mx-auto px-4 py-8 pb-16" onClick={handleBackgroundClick}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Container */}
                <div className="lg:col-span-2" onClick={handleBackgroundClick}>
                  <div className="relative" onClick={handleBackgroundClick}>
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
                                    <div className="flex items-center">
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

                    {/* Donut Chart or Empty State */}
                    <div className="flex justify-center" onClick={handleBackgroundClick}>
                      {displayedEssences.length > 0 ? (
                        <div onClick={(e) => e.stopPropagation()}>
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
                      ) : (
                        <div className="flex items-center justify-center h-[525px]">
                          <div className="text-center mek-card-industrial p-12 mek-border-sharp-gold">
                            <div className="text-gray-500 text-6xl mb-4">⚗️</div>
                            <h3 className="text-yellow-400 text-2xl font-bold mb-2 uppercase tracking-wider">No Essence Yet</h3>
                            <p className="text-gray-400 text-sm">Slot Meks to start generating essence</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details Panel */}
                <div className="lg:col-span-1">
                  <div className="sticky top-24" style={{ transform: 'scale(0.85)', transformOrigin: 'top center' }}>
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
                        <div className="mek-card-industrial mek-border-sharp-gold p-4 relative">
                          <div className="absolute inset-0 pointer-events-none mek-scan-effect opacity-30"></div>

                          {/* Essence Bottle Image */}
                          <div className="relative mb-4 bg-black/40 rounded-lg p-4 flex items-center justify-center border-2 border-yellow-500/30 mx-auto" style={{
                            width: '240px',
                            height: '240px',
                            background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255, 255, 255, 0.02) 10px, rgba(255, 255, 255, 0.02) 20px)'
                          }}>
                            <div className="absolute inset-0 mek-overlay-glass opacity-50 pointer-events-none"></div>
                            <img
                              src={slice.image || '/essence-images/bumble0000.png'}
                              alt={`${slice.name} essence`}
                              className="relative z-10 w-full h-full object-contain"
                              style={{ maxHeight: '200px' }}
                              onError={(e) => {
                                // Fallback to generic essence bottle if specific image not found
                                (e.target as HTMLImageElement).src = '/essence-images/bumble0000.png';
                              }}
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

                            {/* High-Precision Real-Time Accumulation Display */}
                            <RealTimeAccumulation
                              currentAmount={slice.amount}
                              ratePerDay={totalRate}
                              isFull={isFull}
                              essenceId={slice.id}
                            />
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
                                  <span className="font-semibold">{baseRate % 1 === 0 ? baseRate.toFixed(0) : parseFloat(baseRate.toFixed(2)).toString()}</span>
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
                                  <span className="font-semibold">{bonusRate > 0 ? `+${bonusRate % 1 === 0 ? bonusRate.toFixed(0) : parseFloat(bonusRate.toFixed(2)).toString()}` : '+0'}</span>
                                  <span className="font-light">/d</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })() : (
                      <div className="mek-card-industrial mek-border-sharp-gold p-4 relative opacity-40">
                        <div className="absolute inset-0 pointer-events-none mek-scan-effect opacity-30"></div>

                        {/* Essence Bottle Placeholder */}
                        <div className="relative mb-4 bg-black/40 rounded-lg p-4 flex items-center justify-center border-2 border-yellow-500/30 mx-auto" style={{
                          width: '240px',
                          height: '240px',
                          background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255, 255, 255, 0.02) 10px, rgba(255, 255, 255, 0.02) 20px)'
                        }}>
                          <div className="absolute inset-0 mek-overlay-glass opacity-50 pointer-events-none"></div>
                          <img
                            src="/essence-images/bumble0000.png"
                            alt="Essence placeholder"
                            className="relative z-10 w-full h-full object-contain opacity-30"
                            style={{ maxHeight: '200px' }}
                          />
                        </div>

                        {/* Placeholder Name */}
                        <div className="text-center mb-4">
                          <h2 className="mek-text-industrial text-3xl text-gray-600 text-center">ESSENCE</h2>
                        </div>

                        {/* Ownership Section Placeholder */}
                        <div className="mek-header-industrial rounded-lg p-3 mb-4 relative overflow-hidden border-2 border-yellow-500/40">
                          <div className="flex justify-between items-center mb-2 relative z-10">
                            <span className="text-xs text-gray-600 uppercase tracking-widest">OWNERSHIP</span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-bold text-gray-600">--</span>
                              <span className="text-xl font-normal text-gray-600">/10</span>
                            </div>
                          </div>

                          {/* Progress Bar Placeholder */}
                          <div className="relative h-6 bg-black/80 rounded overflow-hidden border border-yellow-500/30">
                            <div className="absolute inset-y-0 left-0" style={{
                              width: '0%',
                              background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.8), rgba(6, 182, 212, 1), rgba(14, 165, 233, 0.9))'
                            }} />
                          </div>

                          {/* Real-Time Accumulation Placeholder */}
                          <div className="mt-3 pt-3 border-t border-yellow-500/20">
                            <div className="text-center">
                              <div className="text-[10px] text-gray-600 uppercase tracking-[0.2em] mb-1 font-bold">
                                Real-Time Accumulation
                              </div>
                              <div className="text-xl font-mono text-gray-600 tracking-tight tabular-nums" style={{
                                fontVariantNumeric: 'tabular-nums'
                              }}>
                                --.------------
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Stats Grid Placeholder */}
                        <div className="bg-black/40 backdrop-blur-sm border border-yellow-500/30 rounded-lg p-3 relative overflow-hidden">
                          <div className="absolute inset-0 mek-overlay-scratches opacity-10 pointer-events-none"></div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-3 relative z-10">
                            <div>
                              <p className="mek-label-uppercase mb-1 text-gray-600">MARKET PRICE</p>
                              <p className="text-lg text-gray-600">
                                <span className="font-semibold">--</span>
                                <span className="font-light">g/ea</span>
                              </p>
                            </div>
                            <div>
                              <p className="mek-label-uppercase mb-1 text-gray-600">BASE RATE</p>
                              <p className="text-lg text-gray-600">
                                <span className="font-semibold">--</span>
                                <span className="font-light">/d</span>
                              </p>
                            </div>
                            <div>
                              <p className="mek-label-uppercase mb-1 text-gray-600">TOTAL VALUE</p>
                              <p className="text-lg text-gray-600">
                                <span className="font-semibold">--</span>
                                <span className="font-light">g</span>
                              </p>
                            </div>
                            <div>
                              <p className="mek-label-uppercase mb-1 text-gray-600">BONUS RATE</p>
                              <p className="text-lg text-gray-600">
                                <span className="font-semibold">--</span>
                                <span className="font-light">/d</span>
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Overlay Message - fixed position to not affect parent layout */}
                        <div
                          className="pointer-events-none z-50"
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            maxWidth: '100%'
                          }}
                        >
                          <div className="bg-black/95 backdrop-blur-xl border-3 border-yellow-500/70 rounded-lg px-6 py-4 shadow-2xl" style={{
                            boxShadow: '0 0 30px rgba(250, 182, 23, 0.6), 0 0 60px rgba(250, 182, 23, 0.4), inset 0 0 20px rgba(250, 182, 23, 0.2)'
                          }}>
                            <p className="text-yellow-400 text-base font-bold uppercase tracking-[0.2em] animate-pulse text-center" style={{
                              textShadow: '0 0 20px rgba(250, 182, 23, 0.9), 0 0 40px rgba(250, 182, 23, 0.6), 0 0 60px rgba(250, 182, 23, 0.4)'
                            }}>Hover Chart<br />for Details</p>
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
