"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import EssenceDonutChart from "@/components/essence-donut-chart";
import { useEssence } from "@/contexts/EssenceContext";
import { clampEssenceToCap, isEssenceFull, ESSENCE_CAP_EPSILON } from "../../convex/lib/essenceCalculations";

interface EssenceDistributionLightboxSpaceAgeProps {
  isOpen: boolean;
  onClose: () => void;
}

// Helper function: Round DOWN essence amounts to nearest 0.1
// Examples: 0.09999 → 0.0, 0.19999 → 0.1, 0.99999 → 0.9, 1.0 → 1.0
function roundDownToTenth(value: number): string {
  const rounded = Math.floor(value * 10) / 10;
  return rounded.toFixed(1);
}

// Animated essence amount component - client-side accumulation for table view
// Uses identical logic to EssenceBalancesViewer's AnimatedEssenceAmount for consistency
function AnimatedEssenceTableCell({
  baseAmount,
  ratePerDay,
  cap,
  backendCalculationTime,
  decimals = 10
}: {
  baseAmount: number;
  ratePerDay: number;
  cap: number;
  backendCalculationTime: number;
  decimals?: number;
}) {
  const [displayAmount, setDisplayAmount] = useState(baseAmount);
  const baseAmountRef = useRef(baseAmount);
  const backendTimeRef = useRef(backendCalculationTime);
  const previousBackendTimeRef = useRef(backendCalculationTime);

  // Update baseline when backend sends new values
  useEffect(() => {
    const previousBackendTime = previousBackendTimeRef.current;
    const backendTimeChanged = backendCalculationTime !== previousBackendTime;

    if (backendTimeChanged) {
      console.log('🔵🔥 [SPACE AGE LIGHTBOX] *** BACKEND SNAPSHOT UPDATE ***', {
        component: 'AnimatedEssenceTableCell',
        OLD_backendTime: new Date(previousBackendTime).toISOString(),
        NEW_backendTime: new Date(backendCalculationTime).toISOString(),
        timeDifference_ms: backendCalculationTime - previousBackendTime,
        baseAmount: baseAmount.toFixed(12),
        ratePerDay: ratePerDay.toFixed(12),
        cap
      });
    }

    previousBackendTimeRef.current = backendCalculationTime;
    baseAmountRef.current = baseAmount;
    backendTimeRef.current = backendCalculationTime;
    setDisplayAmount(baseAmount);
  }, [baseAmount, backendCalculationTime]);

  // Animate if generating
  useEffect(() => {
    if (ratePerDay <= 0 || isEssenceFull(displayAmount, cap)) {
      setDisplayAmount(clampEssenceToCap(baseAmount, cap));
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - backendTimeRef.current;
      const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
      const accumulated = ratePerDay * elapsedDays;
      const newAmount = clampEssenceToCap(baseAmountRef.current + accumulated, cap);
      setDisplayAmount(newAmount);
    }, 50);

    return () => clearInterval(interval);
  }, [ratePerDay, cap, baseAmount]);

  return <span>{displayAmount.toFixed(decimals)}</span>;
}

// Real-time accumulation component showing high-precision decimals
function RealTimeAccumulation({
  baseAmount,
  ratePerDay,
  isFull,
  essenceId,
  backendCalculationTime
}: {
  baseAmount: number;
  ratePerDay: number;
  isFull: boolean;
  essenceId: string;
  backendCalculationTime: number;
}) {
  const [displayAmount, setDisplayAmount] = useState(baseAmount);
  const baseAmountRef = useRef(baseAmount);
  const backendTimeRef = useRef(backendCalculationTime);
  const previousEssenceIdRef = useRef(essenceId);

  // Update baseline when essence changes OR when backend data updates
  useEffect(() => {
    previousEssenceIdRef.current = essenceId;
    baseAmountRef.current = baseAmount;
    backendTimeRef.current = backendCalculationTime;
    setDisplayAmount(baseAmount);
  }, [essenceId, baseAmount, backendCalculationTime]);

  // Animation loop - accumulate from backend baseline
  useEffect(() => {
    if (isFull) {
      setDisplayAmount(baseAmount);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - backendTimeRef.current;
      const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
      const accumulated = baseAmountRef.current + (ratePerDay * elapsedDays);
      setDisplayAmount(accumulated);
    }, 50);

    return () => clearInterval(interval);
  }, [ratePerDay, isFull, baseAmount, essenceId]);

  return (
    <div className="mt-3 pt-3 border-t border-white/10">
      <div className="text-center">
        <div className="text-[10px] text-white/40 uppercase tracking-[0.2em] mb-1 font-bold" style={{ fontFamily: 'Play, sans-serif' }}>
          Real-Time Accumulation
        </div>
        <div
          className="text-xl font-mono text-cyan-400 tracking-tight tabular-nums"
          style={{
            textShadow: '0 0 15px rgba(34, 211, 238, 0.6)',
            fontVariantNumeric: 'tabular-nums'
          }}
        >
          {displayAmount.toFixed(8)}
        </div>
      </div>
    </div>
  );
}

export default function EssenceDistributionLightboxSpaceAge({ isOpen, onClose }: EssenceDistributionLightboxSpaceAgeProps) {
  useEffect(() => {
    console.log('🌌 [SPACE AGE LIGHTBOX] Component mounted with props:', { isOpen });
  }, []);

  const [mounted, setMounted] = useState(false);
  const [viewCount, setViewCount] = useState<5 | 10 | 20 | 30 | 100>(20);
  const [chartSize, setChartSize] = useState(525);
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  const [selectedSlice, setSelectedSlice] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [viewMode, setViewMode] = useState<'donut' | 'table'>('donut');
  const [mobileDataColumn, setMobileDataColumn] = useState<'amount' | 'growth' | 'maxCap' | 'totalValue' | 'count'>('amount');
  const [sortColumn, setSortColumn] = useState<'name' | 'growth' | 'maxCap' | 'totalValue' | 'amount' | 'count'>('amount');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const searchRef = useRef<HTMLDivElement>(null);

  // Mount portal and lock body scroll
  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Get player's essence data from shared context
  const { playerEssenceState, isLoading } = useEssence();
  const walletAddress = playerEssenceState?.walletAddress || '';
  const allSlots = playerEssenceState?.slots || [];

  // Query marketplace listings to get current prices
  const marketListings = useQuery(
    api.marketplace.getActiveListings,
    { itemType: "essence", limit: 1000 }
  );

  // Query essence config for base rates
  const essenceConfig = useQuery(api.essence.getEssenceConfig);

  // Count how many slots use each variation
  const getVariationCount = (variationName: string, variationType: 'head' | 'body' | 'item'): number => {
    if (!allSlots) return 0;
    let count = 0;
    for (const slot of allSlots) {
      if (variationType === 'head' && slot.headVariationName === variationName) count++;
      if (variationType === 'body' && slot.bodyVariationName === variationName) count++;
      if (variationType === 'item' && slot.itemVariationName === variationName) count++;
    }
    return count;
  };

  // Transform player essence balances into chart-ready data
  const essenceData = useMemo(() => {
    if (!playerEssenceState?.balances || !allSlots) return [];

    const marketPrices: Record<string, number> = {};
    if (marketListings?.listings) {
      marketListings.listings.forEach((listing: any) => {
        const essType = listing.itemVariation || listing.essenceType;
        if (essType && listing.pricePerUnit) {
          if (!marketPrices[essType]) {
            marketPrices[essType] = listing.pricePerUnit;
          } else {
            marketPrices[essType] = (marketPrices[essType] + listing.pricePerUnit) / 2;
          }
        }
      });
    }

    const essenceIcons = ["🔮", "💎", "⚡", "🌟", "🔥", "❄️", "🌿", "💫", "✨", "🌊"];

    return playerEssenceState.balances.map((balance: any, index: number) => {
      const currentValue = marketPrices[balance.variationName] || 100;
      const actualRate = playerEssenceState.essenceRates?.[balance.variationId] || 0;
      const essenceCap = playerEssenceState.caps?.[balance.variationId] || 10;
      const imageName = balance.variationName.toLowerCase().replace(/\s+/g, '-');
      const variationCount = getVariationCount(balance.variationName, balance.variationType);

      return {
        id: balance.variationName.toLowerCase().replace(/\s+/g, '-'),
        name: balance.variationName,
        variationId: balance.variationId,
        amount: balance.accumulatedAmount,
        currentValue: Math.floor(currentValue),
        maxAmount: essenceCap,
        maxAmountBuffed: undefined,
        icon: essenceIcons[index % essenceIcons.length],
        image: `/essence-images/${imageName}.png`,
        baseRate: actualRate,
        bonusRate: 0,
        count: variationCount
      };
    });
  }, [playerEssenceState, marketListings, essenceConfig, allSlots]);

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

    return filtered.reverse();
  }, [essenceData, viewCount, maxSliceFilter, maxEssenceAmount]);

  const totalStats = useMemo(() => {
    const total = essenceData.reduce((sum, e) => sum + e.amount, 0);
    const totalValue = essenceData.reduce((sum, e) => sum + (e.amount * e.currentValue), 0);
    const averageValue = totalValue / total || 0;
    const totalPerDay = essenceData.reduce((sum, e) => sum + ((e.baseRate || 0) + (e.bonusRate || 0)), 0);

    return {
      totalAmount: total,
      totalValue,
      averageValue,
      uniqueTypes: essenceData.length,
      totalPerDay
    };
  }, [essenceData]);

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
    if (e.target === e.currentTarget) {
      handleClearSelection();
    }
  };

  const isDataLoading = playerEssenceState === undefined || marketListings === undefined || essenceConfig === undefined;

  // Handle column sorting
  const handleSort = (column: typeof sortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // Sort displayed essences
  const sortedEssences = useMemo(() => {
    const sorted = [...displayedEssences].sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortColumn) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'growth':
          aValue = (a.baseRate || 0) + (a.bonusRate || 0);
          bValue = (b.baseRate || 0) + (b.bonusRate || 0);
          break;
        case 'maxCap':
          aValue = a.maxAmountBuffed || a.maxAmount || 10;
          bValue = b.maxAmountBuffed || b.maxAmount || 10;
          break;
        case 'totalValue':
          aValue = a.amount * a.currentValue;
          bValue = b.amount * b.currentValue;
          break;
        case 'count':
          aValue = (a as any).count || 0;
          bValue = (b as any).count || 0;
          break;
        case 'amount':
        default:
          aValue = a.amount;
          bValue = b.amount;
          break;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortDirection === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

    return sorted;
  }, [displayedEssences, sortColumn, sortDirection]);

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-auto p-4" onClick={onClose}>
      {/* Space Age Backdrop - Deep blue with blur */}
      <div
        className="fixed inset-0 bg-black/70"
        style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
        onClick={onClose}
      />

      {/* Lightbox Container - Liquid Glass Style */}
      <div
        className="relative w-[960px] max-w-[95vw] h-auto max-h-[90vh] overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '20px',
          boxShadow: '0 25px 80px rgba(0,0,0,0.6), 0 0 60px rgba(34,211,238,0.05)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Loading Overlay */}
        {isDataLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" style={{ borderRadius: '20px' }}>
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-cyan-400 text-lg uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>Loading Essence Data...</p>
            </div>
          </div>
        )}

        {/* Close Button - Space Age Style */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-50 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <span className="text-white/70 text-2xl font-light hover:text-white transition-colors">×</span>
        </button>

        {/* Scrollable Content */}
        <div className="w-full h-full overflow-y-auto overflow-x-hidden scrollbar-hide" onClick={handleBackgroundClick}>
          <div className="relative text-white">
            {/* Space Age Header */}
            <div className="w-full py-6 px-8">
              <h1 className="text-4xl font-bold tracking-wider text-center mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                <span className="text-cyan-400" style={{ textShadow: '0 0 30px rgba(34, 211, 238, 0.5)' }}>ESSENCE</span>{" "}
                <span className="text-white/80">DISTRIBUTION</span>
              </h1>
              <p className="text-center text-white/50 text-sm max-w-2xl mx-auto" style={{ fontFamily: 'Play, sans-serif' }}>
                Your slotted Mek variations generate unique essence daily. Track all accumulated essence types and their current market values.
              </p>
            </div>

            {/* Controls Bar - Space Age Style */}
            <div className="w-full sticky top-0 z-20">
              <div
                className="relative py-3 px-6"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(20px)'
                }}
              >
                <div className="max-w-7xl mx-auto">
                  <div className="flex items-center justify-between gap-8">
                    {/* Stats Section */}
                    <div className="flex items-center gap-3">
                      {/* Total Essence */}
                      <StatCard label="ESSENCE" value={roundDownToTenth(totalStats.totalAmount)} color="cyan" />
                      <div className="h-8 w-px bg-white/10" />
                      {/* Total Value */}
                      <StatCard label="APPROX. VALUE" value={`${Math.round(totalStats.totalValue).toLocaleString()}g`} color="yellow" />
                      <div className="h-8 w-px bg-white/10" />
                      {/* Types */}
                      <StatCard label="TYPES" value={totalStats.uniqueTypes.toString()} color="white" />
                      <div className="h-8 w-px bg-white/10" />
                      {/* Essence Per Day */}
                      <StatCard label="ESSENCE/DAY" value={totalStats.totalPerDay.toFixed(1)} color="green" />
                    </div>

                    {/* View Count Selector - Liquid Glass Tabs */}
                    <div
                      className="flex items-center rounded-xl overflow-hidden"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      <div className="px-3 py-2 text-[10px] text-white/40 uppercase tracking-[0.15em] border-r border-white/10" style={{ fontFamily: 'Play, sans-serif' }}>
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
                            className="relative px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all duration-200"
                            style={{
                              fontFamily: 'Saira, sans-serif',
                              background: viewCount === value
                                ? 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(34,211,238,0.1))'
                                : 'transparent',
                              color: viewCount === value ? '#22d3ee' : 'rgba(255,255,255,0.5)',
                              borderLeft: '1px solid rgba(255,255,255,0.05)',
                            }}
                          >
                            {viewCount === value && (
                              <div className="absolute inset-0 pointer-events-none" style={{
                                background: 'linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.1) 50%, transparent 100%)',
                                animation: 'slideParticles 3s linear infinite'
                              }} />
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

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-6 pb-6" onClick={handleBackgroundClick}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Container */}
                <div className="lg:col-span-2" onClick={handleBackgroundClick}>
                  <div className="relative" onClick={handleBackgroundClick}>
                    {/* Search Bar - Space Age Style */}
                    <div className="mb-4">
                      <div className="flex justify-center">
                        <div ref={searchRef} className="relative w-[423px]">
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              setShowSearchResults(true);
                            }}
                            onFocus={() => setShowSearchResults(true)}
                            placeholder="Search essence..."
                            className="w-full px-4 py-3 text-white placeholder-white/30 focus:outline-none transition-all"
                            style={{
                              fontFamily: 'Play, sans-serif',
                              background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                              backdropFilter: 'blur(12px)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '12px',
                            }}
                          />
                          <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>

                          {showSearchResults && searchResults.length > 0 && (
                            <div
                              className="absolute top-full mt-2 w-full overflow-hidden z-50"
                              style={{
                                background: 'linear-gradient(135deg, rgba(20,20,20,0.98), rgba(10,10,10,0.98))',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
                              }}
                            >
                              {searchResults.map((essence) => (
                                <button
                                  key={essence.id}
                                  onClick={() => handleSearchSelect(essence.id)}
                                  className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-white font-medium" style={{ fontFamily: 'Saira, sans-serif' }}>{essence.name}</span>
                                    <div className="text-right">
                                      <div className="text-cyan-400 font-bold">{roundDownToTenth(essence.amount)}</div>
                                      <div className="text-white/40 text-xs">{essence.currentValue}g/ea</div>
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Zoom Slider - Only visible when "All" is selected */}
                    {viewCount === 100 && (
                      <div className="mb-4 flex justify-center">
                        <div
                          className="relative w-[423px] flex items-center gap-3 px-4 py-2"
                          style={{
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px'
                          }}
                        >
                          <div className="text-[9px] text-white/40 uppercase tracking-wider whitespace-nowrap font-medium">0.001</div>
                          <div className="flex-1 relative h-6">
                            <input
                              type="range"
                              min="0.001"
                              max={defaultMaxAmount}
                              step="0.001"
                              value={maxSliceFilter}
                              onChange={(e) => setMaxSliceFilter(parseFloat(e.target.value))}
                              className="absolute inset-0 w-full h-full appearance-none bg-transparent cursor-pointer z-10"
                              style={{
                                accentColor: '#22d3ee'
                              }}
                            />
                          </div>
                          <div className="text-[9px] text-cyan-400 uppercase tracking-wider whitespace-nowrap font-medium" style={{ textShadow: '0 0 10px rgba(34, 211, 238, 0.5)' }}>
                            {maxSliceFilter.toFixed(3)} E
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Donut Chart or Table View */}
                    <div className="flex flex-col items-center" onClick={handleBackgroundClick}>
                      {viewMode === 'donut' ? (
                        <>
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
                                hoverEffect={1}
                              />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-[525px]">
                              <div
                                className="text-center p-12"
                                style={{
                                  background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  borderRadius: '16px'
                                }}
                              >
                                <div className="text-white/30 text-6xl mb-4">⚗️</div>
                                <h3 className="text-cyan-400 text-2xl font-bold mb-2 uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>No Essence Yet</h3>
                                <p className="text-white/50 text-sm" style={{ fontFamily: 'Play, sans-serif' }}>Slot Meks to start generating essence</p>
                              </div>
                            </div>
                          )}

                          {/* View Toggle Button */}
                          {displayedEssences.length > 0 && (
                            <button
                              onClick={() => setViewMode('table')}
                              className="mt-4 px-8 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-200 hover:scale-[1.02]"
                              style={{
                                fontFamily: 'Saira, sans-serif',
                                background: 'linear-gradient(to right, #facc15, #eab308)',
                                color: 'black',
                                borderRadius: '12px',
                                boxShadow: '0 0 20px rgba(250, 204, 21, 0.3)'
                              }}
                            >
                              Table View
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          {/* Table View - Space Age Style */}
                          <div className="w-full max-w-5xl">
                            {/* Mobile Data Column Selector */}
                            <div className="md:hidden mb-4 flex justify-center">
                              <select
                                value={mobileDataColumn}
                                onChange={(e) => setMobileDataColumn(e.target.value as typeof mobileDataColumn)}
                                className="px-4 py-2 text-white uppercase text-xs font-bold tracking-wider cursor-pointer"
                                style={{
                                  fontFamily: 'Saira, sans-serif',
                                  background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                                  border: '1px solid rgba(255,255,255,0.2)',
                                  borderRadius: '8px'
                                }}
                              >
                                <option value="amount">Amount Owned</option>
                                <option value="growth">Growth Rate</option>
                                <option value="count">Variation Count</option>
                                <option value="maxCap">Max Cap</option>
                                <option value="totalValue">Total Value</option>
                              </select>
                            </div>

                            {/* Space Age Table */}
                            <div
                              className="relative overflow-hidden"
                              style={{
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '16px'
                              }}
                            >
                              {/* Table Header */}
                              <div className="hidden md:grid md:grid-cols-6 px-4 py-3 text-[11px] font-bold uppercase tracking-widest border-b border-white/10"
                                style={{ fontFamily: 'Play, sans-serif', background: 'rgba(255,255,255,0.03)' }}>
                                <TableHeaderButton label="NAME" column="name" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                                <TableHeaderButton label="APPROX. VALUE" column="totalValue" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} center />
                                <TableHeaderButton label="MAX CAP" column="maxCap" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} center />
                                <TableHeaderButton label="GROWTH/d" column="growth" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} center />
                                <TableHeaderButton label="COUNT" column="count" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} center />
                                <TableHeaderButton label="OWNED" column="amount" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} center />
                              </div>

                              {/* Table Body */}
                              <div className="max-h-[500px] overflow-y-auto text-[13px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                                {sortedEssences.map((essence, index) => {
                                  const baseRate = essence.baseRate || 0;
                                  const bonusRate = essence.bonusRate || 0;
                                  const totalRate = baseRate + bonusRate;
                                  const effectiveMax = essence.maxAmountBuffed || essence.maxAmount || 10;
                                  const totalValue = essence.amount * essence.currentValue;
                                  const isGenerating = totalRate > 0;
                                  const hasGrowthBuff = bonusRate > 0;
                                  const hasCapBuff = essence.maxAmountBuffed && essence.maxAmountBuffed > (essence.maxAmount || 10);

                                  return (
                                    <div
                                      key={essence.id}
                                      onMouseEnter={() => setHoveredSlice(essence.id)}
                                      onMouseLeave={() => { if (selectedSlice !== essence.id) setHoveredSlice(null); }}
                                      onClick={() => {
                                        if (selectedSlice === essence.id) {
                                          setSelectedSlice(null);
                                          setHoveredSlice(null);
                                        } else {
                                          setSelectedSlice(essence.id);
                                        }
                                      }}
                                      className="relative hidden md:grid md:grid-cols-6 items-center px-4 h-[56px] transition-all cursor-pointer group"
                                      style={{
                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                        background: selectedSlice === essence.id
                                          ? 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(34,211,238,0.05))'
                                          : hoveredSlice === essence.id
                                          ? 'rgba(255,255,255,0.03)'
                                          : 'transparent'
                                      }}
                                    >
                                      {/* Left accent bar */}
                                      <div className="absolute left-0 top-0 bottom-0 w-1 transition-colors"
                                        style={{
                                          background: selectedSlice === essence.id
                                            ? 'linear-gradient(180deg, #22d3ee, #06b6d4)'
                                            : 'rgba(255,255,255,0.1)'
                                        }}
                                      />

                                      <div className="text-white font-medium" style={{ fontFamily: 'Saira, sans-serif' }}>
                                        {essence.name.toUpperCase()}
                                      </div>

                                      <div className="text-center text-yellow-400/90 tabular-nums">
                                        {Math.round(totalValue).toLocaleString()}g
                                      </div>

                                      <div className={`text-center tabular-nums ${hasCapBuff ? 'text-green-400 font-bold' : 'text-white/70'}`}>
                                        {effectiveMax}
                                      </div>

                                      <div className={`text-center tabular-nums ${
                                        totalRate === 0 ? 'text-white/30'
                                          : hasGrowthBuff ? 'text-green-400 font-bold'
                                          : 'text-cyan-400'
                                      }`}>
                                        {totalRate === 0 ? '—' : totalRate.toFixed(2)}
                                      </div>

                                      <div className="text-center text-white/60 tabular-nums">
                                        {(essence as any).count || 0}
                                      </div>

                                      <div className={`text-center font-bold tabular-nums ${isGenerating ? 'text-cyan-400' : 'text-yellow-400'}`}
                                        style={isGenerating ? { textShadow: '0 0 10px rgba(34, 211, 238, 0.5)' } : undefined}>
                                        <AnimatedEssenceTableCell
                                          baseAmount={essence.amount}
                                          ratePerDay={totalRate}
                                          cap={effectiveMax}
                                          backendCalculationTime={playerEssenceState?.lastCalculationTime || Date.now()}
                                          decimals={7}
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Back to Donut Button */}
                          <button
                            onClick={() => setViewMode('donut')}
                            className="mt-4 px-8 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-200 hover:scale-[1.02]"
                            style={{
                              fontFamily: 'Saira, sans-serif',
                              background: 'linear-gradient(to right, #facc15, #eab308)',
                              color: 'black',
                              borderRadius: '12px',
                              boxShadow: '0 0 20px rgba(250, 204, 21, 0.3)'
                            }}
                          >
                            Donut View
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details Panel - Space Age Style */}
                <div className="lg:col-span-1">
                  <div className="sticky top-24 relative" style={{ transform: 'scale(0.85)', transformOrigin: 'top center' }}>
                    {(hoveredSlice || selectedSlice) ? (() => {
                      const activeSlice = hoveredSlice || selectedSlice;
                      const slice = essenceData.find(e => e.id === activeSlice);
                      if (!slice) return null;

                      const effectiveMax = slice.maxAmountBuffed || slice.maxAmount || 10;
                      const isFull = slice.amount >= effectiveMax;
                      const baseRate = slice.baseRate || 0;
                      const bonusRate = slice.bonusRate || 0;
                      const totalRate = baseRate + bonusRate;
                      const totalValue = slice.amount * slice.currentValue;

                      return (
                        <div
                          className="p-5 relative overflow-hidden"
                          style={{
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '20px',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
                          }}
                        >
                          {/* Essence Bottle Image */}
                          <div
                            className="relative mb-4 mx-auto flex items-center justify-center"
                            style={{
                              width: '240px',
                              height: '240px',
                              background: 'linear-gradient(135deg, rgba(0,0,0,0.3), rgba(0,0,0,0.1))',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '16px'
                            }}
                          >
                            <img
                              src={slice.image || '/essence-images/bumble0000.png'}
                              alt={`${slice.name} essence`}
                              className="relative z-10 w-full h-full object-contain p-4"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/essence-images/bumble0000.png';
                              }}
                            />
                          </div>

                          {/* Name */}
                          <div className="text-center mb-4" style={{ minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <h2
                              className="text-center leading-tight"
                              style={{
                                fontFamily: 'Orbitron, sans-serif',
                                fontSize: slice.name.length > 20 ? '1.1rem' : slice.name.length > 15 ? '1.3rem' : '1.6rem',
                                color: '#22d3ee',
                                textShadow: '0 0 25px rgba(34, 211, 238, 0.5)'
                              }}
                            >
                              {slice.name.toUpperCase()}
                            </h2>
                          </div>

                          {/* Ownership Section */}
                          <div
                            className="rounded-xl p-4 mb-4"
                            style={{
                              background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                              border: '1px solid rgba(255,255,255,0.1)'
                            }}
                          >
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-xs text-white/50 uppercase tracking-widest" style={{ fontFamily: 'Play, sans-serif' }}>OWNERSHIP</span>
                              <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-cyan-400" style={{
                                  fontFamily: 'Orbitron, sans-serif',
                                  textShadow: '0 0 20px rgba(34, 211, 238, 0.6)'
                                }}>
                                  {roundDownToTenth(slice.amount)}
                                </span>
                                <span className="text-xl font-normal">
                                  <span className="text-white/30">/</span>
                                  <span className={slice.maxAmountBuffed && slice.maxAmountBuffed > 10 ? "text-green-400" : "text-white/70"}>
                                    {effectiveMax}
                                  </span>
                                </span>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="relative h-5 bg-black/40 rounded-full overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                              <div
                                className={`absolute inset-y-0 left-0 transition-all duration-500 rounded-full ${isFull ? 'animate-pulse' : ''}`}
                                style={{
                                  width: `${Math.min((slice.amount / effectiveMax) * 100, 100)}%`,
                                  background: isFull
                                    ? 'linear-gradient(90deg, #22d3ee, #06b6d4, #0891b2)'
                                    : 'linear-gradient(90deg, #22d3ee, #06b6d4)',
                                  boxShadow: '0 0 15px rgba(34, 211, 238, 0.5)'
                                }}
                              />
                            </div>

                            {/* Real-Time Accumulation */}
                            <RealTimeAccumulation
                              baseAmount={slice.amount}
                              ratePerDay={totalRate}
                              isFull={isFull}
                              essenceId={slice.id}
                              backendCalculationTime={playerEssenceState?.lastCalculationTime || Date.now()}
                            />
                          </div>

                          {/* Stats Grid */}
                          <div
                            className="rounded-xl p-4"
                            style={{
                              background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
                              border: '1px solid rgba(255,255,255,0.08)'
                            }}
                          >
                            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                              <DetailStat label="MARKET PRICE" value={`${slice.currentValue}g/ea`} color="yellow" />
                              <DetailStat label="BASE RATE" value={`${baseRate % 1 === 0 ? baseRate.toFixed(0) : parseFloat(baseRate.toFixed(2)).toString()}/d`} color="cyan" />
                              <DetailStat label="TOTAL VALUE" value={`${Math.round(totalValue).toLocaleString()}g`} color="yellow" />
                              <DetailStat label="BONUS RATE" value={`+${bonusRate > 0 ? (bonusRate % 1 === 0 ? bonusRate.toFixed(0) : parseFloat(bonusRate.toFixed(2)).toString()) : '0'}/d`} color="green" />
                            </div>
                          </div>
                        </div>
                      );
                    })() : (
                      <div
                        className="p-5 relative overflow-hidden"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '20px'
                        }}
                      >
                        {/* Placeholder content */}
                        <div className="opacity-30">
                          <div
                            className="relative mb-4 mx-auto flex items-center justify-center"
                            style={{
                              width: '240px',
                              height: '240px',
                              background: 'linear-gradient(135deg, rgba(0,0,0,0.3), rgba(0,0,0,0.1))',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '16px'
                            }}
                          >
                            <img
                              src="/essence-images/bumble0000.png"
                              alt="Essence placeholder"
                              className="relative z-10 w-full h-full object-contain p-4 opacity-30"
                            />
                          </div>

                          <div className="text-center mb-4" style={{ minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <h2 className="text-2xl text-white/30" style={{ fontFamily: 'Orbitron, sans-serif' }}>ESSENCE</h2>
                          </div>

                          <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-xs text-white/20 uppercase tracking-widest">OWNERSHIP</span>
                              <span className="text-3xl font-bold text-white/20">--/10</span>
                            </div>
                            <div className="relative h-5 bg-black/40 rounded-full overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.05)' }} />
                          </div>
                        </div>

                        {/* Hover message */}
                        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ zIndex: 20 }}>
                          <div
                            className="inline-flex items-center gap-2 px-4 py-2"
                            style={{
                              background: 'rgba(0,0,0,0.8)',
                              border: '1px solid rgba(255,255,255,0.2)',
                              borderRadius: '10px'
                            }}
                          >
                            <svg className="w-4 h-4 text-cyan-400/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                            </svg>
                            <span className="text-sm text-white/70 font-medium whitespace-nowrap" style={{ fontFamily: 'Play, sans-serif' }}>Hover chart for details</span>
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

      {/* Sliding particles animation keyframes */}
      <style>{`
        @keyframes slideParticles {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );

  if (!isOpen || !mounted) return null;

  return createPortal(modalContent, document.body);
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function StatCard({ label, value, color }: { label: string; value: string; color: 'cyan' | 'yellow' | 'white' | 'green' }) {
  const colorStyles = {
    cyan: { text: '#22d3ee', shadow: 'rgba(34, 211, 238, 0.5)' },
    yellow: { text: '#facc15', shadow: 'rgba(250, 204, 21, 0.5)' },
    white: { text: '#ffffff', shadow: 'rgba(255, 255, 255, 0.3)' },
    green: { text: '#4ade80', shadow: 'rgba(74, 222, 128, 0.5)' }
  };
  const cs = colorStyles[color];

  return (
    <div
      className="px-4 py-2 rounded-lg"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
        border: '1px solid rgba(255,255,255,0.08)'
      }}
    >
      <div className="text-[9px] text-white/40 uppercase tracking-[0.15em] mb-1 text-center" style={{ fontFamily: 'Play, sans-serif' }}>{label}</div>
      <div
        className="text-xl font-bold text-center tracking-tight"
        style={{
          fontFamily: 'Orbitron, sans-serif',
          color: cs.text,
          textShadow: `0 0 15px ${cs.shadow}`
        }}
      >
        {value}
      </div>
    </div>
  );
}

function TableHeaderButton({
  label,
  column,
  sortColumn,
  sortDirection,
  onSort,
  center = false
}: {
  label: string;
  column: string;
  sortColumn: string;
  sortDirection: string;
  onSort: (col: any) => void;
  center?: boolean;
}) {
  return (
    <button
      onClick={() => onSort(column)}
      className={`text-white/50 hover:text-white/80 transition-colors cursor-pointer flex items-center gap-1 ${center ? 'justify-center' : ''}`}
    >
      {label}
      {sortColumn === column && (
        <span className="text-[8px] text-cyan-400">{sortDirection === 'asc' ? '▲' : '▼'}</span>
      )}
    </button>
  );
}

function DetailStat({ label, value, color }: { label: string; value: string; color: 'cyan' | 'yellow' | 'green' }) {
  const colorMap = {
    cyan: 'text-cyan-400',
    yellow: 'text-yellow-400',
    green: 'text-green-400'
  };

  return (
    <div>
      <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1" style={{ fontFamily: 'Play, sans-serif' }}>{label}</p>
      <p className={`text-lg font-semibold ${colorMap[color]}`} style={{ fontFamily: 'Inter, sans-serif' }}>
        {value}
      </p>
    </div>
  );
}
