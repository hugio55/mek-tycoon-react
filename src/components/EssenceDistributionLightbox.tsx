"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import EssenceDonutChart from "@/components/essence-donut-chart";
import "@/styles/global-design-system.css";
import { useEssence } from "@/contexts/EssenceContext";

interface EssenceDistributionLightboxProps {
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
  const previousBackendTimeRef = useRef(backendCalculationTime); // Track previous value to detect changes

  // Update baseline when backend sends new values (matches EssenceBalancesViewer)
  useEffect(() => {
    const previousBackendTime = previousBackendTimeRef.current;
    const backendTimeChanged = backendCalculationTime !== previousBackendTime;

    // CRITICAL LOG: Detect when backend sends NEW snapshot data
    if (backendTimeChanged) {
      console.log('🔵🔥 [DISTRIBUTION LIGHTBOX] *** BACKEND SNAPSHOT UPDATE DETECTED ***', {
        component: 'AnimatedEssenceTableCell',
        OLD_backendTime: new Date(previousBackendTime).toISOString(),
        NEW_backendTime: new Date(backendCalculationTime).toISOString(),
        timeDifference_ms: backendCalculationTime - previousBackendTime,
        timeDifference_seconds: ((backendCalculationTime - previousBackendTime) / 1000).toFixed(1),
        OLD_baseAmount: baseAmountRef.current.toFixed(12),
        NEW_baseAmount: baseAmount.toFixed(12),
        amountDifference: (baseAmount - baseAmountRef.current).toFixed(12),
        ratePerDay: ratePerDay.toFixed(12),
        cap
      });
    } else {
      // Regular baseline update (not a new snapshot, just component re-render)
      console.log('🔵 [DISTRIBUTION LIGHTBOX] Baseline update (no backend change):', {
        component: 'AnimatedEssenceTableCell',
        baseAmount: baseAmount.toFixed(12),
        backendTime: new Date(backendCalculationTime).toISOString(),
        backendTimeMs: backendCalculationTime,
        ratePerDay: ratePerDay.toFixed(12),
        cap
      });
    }

    // Update all refs with new values
    previousBackendTimeRef.current = backendCalculationTime;
    baseAmountRef.current = baseAmount;
    backendTimeRef.current = backendCalculationTime;
    setDisplayAmount(baseAmount);
  }, [baseAmount, backendCalculationTime]);

  // Animate if generating (matches EssenceBalancesViewer)
  useEffect(() => {
    if (ratePerDay <= 0 || displayAmount >= cap) {
      setDisplayAmount(Math.min(baseAmount, cap));
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - backendTimeRef.current;
      const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
      const accumulated = ratePerDay * elapsedDays;
      const newAmount = Math.min(baseAmountRef.current + accumulated, cap);

      // Log every 5 seconds (100 intervals at 50ms)
      const intervalCount = Math.floor(elapsedMs / 50);
      if (intervalCount % 100 === 0) {
        console.log('🔵 [DISTRIBUTION LIGHTBOX] Animation tick:', {
          component: 'AnimatedEssenceTableCell',
          now: new Date(now).toISOString(),
          elapsedMs,
          elapsedDays: elapsedDays.toFixed(12),
          baseAmount: baseAmountRef.current.toFixed(12),
          ratePerDay: ratePerDay.toFixed(12),
          accumulated: accumulated.toFixed(12),
          newAmount: newAmount.toFixed(12)
        });
      }

      setDisplayAmount(newAmount);
    }, 50); // Update every 50ms for smooth animation

    return () => clearInterval(interval);
  }, [ratePerDay, cap, baseAmount]);

  return <span>{displayAmount.toFixed(decimals)}</span>;
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
          {displayAmount.toFixed(8)}
        </div>
      </div>
    </div>
  );
}

export default function EssenceDistributionLightbox({ isOpen, onClose }: EssenceDistributionLightboxProps) {
  // VERSION MARKER - Check browser console to see if this appears
  useEffect(() => {
    console.log('🔥🔥🔥 [FILE VERSION CHECK] EssenceDistributionLightbox.tsx - USING SHARED ESSENCE CONTEXT 🔥🔥🔥');
    console.log('[EssenceDistributionLightbox] Component mounted with props:', { isOpen });
  }, []);

  // Log when isOpen changes
  useEffect(() => {
    console.log('[EssenceDistributionLightbox] isOpen changed to:', isOpen);
  }, [isOpen]);

  const [mounted, setMounted] = useState(false);
  const [viewCount, setViewCount] = useState<5 | 10 | 20 | 30 | 100>(20);
  const [chartSize, setChartSize] = useState(525);
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  const [selectedSlice, setSelectedSlice] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSlotting, setIsSlotting] = useState(false);
  const [filterDesign, setFilterDesign] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [hoverEffect, setHoverEffect] = useState<1 | 2 | 3 | 4>(1);
  const [viewMode, setViewMode] = useState<'donut' | 'table'>('donut');
  const [mobileDataColumn, setMobileDataColumn] = useState<'amount' | 'growth' | 'maxCap' | 'totalValue'>('amount');
  const [tableStyle, setTableStyle] = useState<1 | 2 | 3>(2);
  const [sortColumn, setSortColumn] = useState<'name' | 'growth' | 'maxCap' | 'totalValue' | 'amount'>('amount');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Debug controls
  const [backdropDarkness, setBackdropDarkness] = useState<10 | 20 | 40 | 60 | 80>(10);
  const [backdropBlur, setBackdropBlur] = useState<0 | 1 | 2 | 3 | 4>(1);
  const [cardDarkness, setCardDarkness] = useState<20 | 30 | 40 | 50 | 70>(20);
  const [cardBlur, setCardBlur] = useState<'none' | 'sm' | 'md' | 'lg' | 'xl'>('md');
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  // Mount portal and lock body scroll
  useEffect(() => {
    console.log('[EssenceDistributionLightbox] Mount effect running, setting mounted=true, isOpen:', isOpen);
    setMounted(true);
    if (isOpen) {
      console.log('[EssenceDistributionLightbox] Locking body scroll');
      document.body.style.overflow = 'hidden';
    }
    return () => {
      console.log('[EssenceDistributionLightbox] Cleanup: unlocking body scroll');
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Get player's essence data from shared context (single source of truth)
  const { playerEssenceState, isLoading } = useEssence();

  console.log('[EssenceDistributionLightbox] Using shared context data:', {
    hasData: !!playerEssenceState,
    isLoading,
    balanceCount: playerEssenceState?.balances?.length || 0
  });

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
      // Use actual generation rate from essenceRates (will be 0 if not generating)
      const actualRate = playerEssenceState.essenceRates?.[balance.variationId] || 0;
      const essenceCap = playerEssenceState.caps?.[balance.variationId] || 10;

      // Use variation name to construct image path (lowercase, replace spaces with hyphens)
      const imageName = balance.variationName.toLowerCase().replace(/\s+/g, '-');

      return {
        id: balance.variationName.toLowerCase().replace(/\s+/g, '-'),
        name: balance.variationName,
        variationId: balance.variationId, // Include variationId for rate lookups
        amount: balance.accumulatedAmount, // Use raw amount, don't round
        currentValue: Math.floor(currentValue),
        maxAmount: essenceCap,
        maxAmountBuffed: undefined, // TODO: Get from buffs
        icon: essenceIcons[index % essenceIcons.length],
        image: `/essence-images/${imageName}.png`, // Map to variation-specific images
        baseRate: actualRate, // Use actual rate (0 if not generating)
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

    // VISUAL FLIP: Reverse array so donut goes smallest → largest clockwise from 12 o'clock
    return filtered.reverse();
  }, [essenceData, viewCount, maxSliceFilter, maxEssenceAmount]);

  const totalStats = useMemo(() => {
    // GLOBAL STATS: Calculate from ALL essences, not just displayed/filtered ones
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

  // Show loading state while data is being fetched (but only for a reasonable time)
  const isLoading = playerEssenceState === undefined || marketListings === undefined || essenceConfig === undefined;

  // Handle column sorting
  const handleSort = (column: typeof sortColumn) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to descending
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

  // Helper functions to get proper Tailwind classes
  const getBackdropDarknessClass = () => {
    switch (backdropDarkness) {
      case 10: return 'bg-black/10';
      case 20: return 'bg-black/20';
      case 40: return 'bg-black/40';
      case 60: return 'bg-black/60';
      case 80: return 'bg-black/80';
      default: return 'bg-black/40';
    }
  };

  const getBackdropBlurStyle = () => {
    if (backdropBlur === 0) return {};
    return { backdropFilter: `blur(${backdropBlur}px)` };
  };

  const getCardDarknessClass = () => {
    switch (cardDarkness) {
      case 20: return 'bg-black/20';
      case 30: return 'bg-black/30';
      case 40: return 'bg-black/40';
      case 50: return 'bg-black/50';
      case 70: return 'bg-black/70';
      default: return 'bg-black/70';
    }
  };

  const getCardBlurClass = () => {
    switch (cardBlur) {
      case 'none': return '';
      case 'sm': return 'backdrop-blur-sm';
      case 'md': return 'backdrop-blur-md';
      case 'lg': return 'backdrop-blur-lg';
      case 'xl': return 'backdrop-blur-xl';
      default: return '';
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-auto p-4" onClick={onClose}>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 ${getBackdropDarknessClass()}`}
        style={getBackdropBlurStyle()}
        onClick={onClose}
      />

      {/* Debug Toggle Button - Fixed to viewport */}
      <button
        onClick={() => setShowDebugPanel(!showDebugPanel)}
        className="fixed top-4 right-4 z-[10000] px-3 py-2 flex items-center justify-center bg-black/80 border-2 border-cyan-500/50 rounded hover:bg-cyan-500/20 hover:border-cyan-500 transition-all"
      >
        <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider">Debug</span>
      </button>

      {/* Debug Panel - Fixed to viewport */}
      {showDebugPanel && (
        <div className="fixed top-16 right-4 z-[10000] w-80 bg-black/95 border-2 border-cyan-500/50 rounded-lg p-4 shadow-2xl">
            <h3 className="text-cyan-400 text-sm font-bold uppercase tracking-wider mb-4 border-b border-cyan-500/30 pb-2">
              Visual Debug Controls
            </h3>

            {/* Backdrop Darkness */}
            <div className="mb-4">
              <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-2">
                Backdrop Darkness (Main Page)
              </label>
              <div className="flex gap-1">
                {[10, 20, 40, 60, 80].map((value) => (
                  <button
                    key={value}
                    onClick={() => setBackdropDarkness(value as typeof backdropDarkness)}
                    className={`flex-1 px-2 py-1 text-xs font-bold transition-all ${
                      backdropDarkness === value
                        ? 'bg-cyan-500 text-black border border-cyan-400'
                        : 'bg-black/60 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20'
                    }`}
                  >
                    {value}%
                  </button>
                ))}
              </div>
            </div>

            {/* Backdrop Blur */}
            <div className="mb-4">
              <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-2">
                Backdrop Blur Amount
              </label>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((value) => (
                  <button
                    key={value}
                    onClick={() => setBackdropBlur(value as typeof backdropBlur)}
                    className={`flex-1 px-2 py-1 text-xs font-bold transition-all ${
                      backdropBlur === value
                        ? 'bg-cyan-500 text-black border border-cyan-400'
                        : 'bg-black/60 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20'
                    }`}
                  >
                    {value}px
                  </button>
                ))}
              </div>
            </div>

            {/* Card Darkness */}
            <div className="mb-4">
              <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-2">
                Lightbox Card Darkness
              </label>
              <div className="flex gap-1">
                {[20, 30, 40, 50, 70].map((value) => (
                  <button
                    key={value}
                    onClick={() => setCardDarkness(value as typeof cardDarkness)}
                    className={`flex-1 px-2 py-1 text-xs font-bold transition-all ${
                      cardDarkness === value
                        ? 'bg-yellow-500 text-black border border-yellow-400'
                        : 'bg-black/60 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/20'
                    }`}
                  >
                    {value}%
                  </button>
                ))}
              </div>
            </div>

            {/* Card Blur */}
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-2">
                Lightbox Card Blur
              </label>
              <div className="flex gap-1">
                {(['none', 'sm', 'md', 'lg', 'xl'] as const).map((value) => (
                  <button
                    key={value}
                    onClick={() => setCardBlur(value)}
                    className={`flex-1 px-2 py-1 text-xs font-bold uppercase transition-all ${
                      cardBlur === value
                        ? 'bg-yellow-500 text-black border border-yellow-400'
                        : 'bg-black/60 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/20'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      {/* Lightbox Container */}
      <div
        className={`relative w-[960px] max-w-[95vw] h-[90vh] ${getCardDarknessClass()} ${getCardBlurClass()} border-2 border-yellow-500/50 rounded-lg overflow-hidden shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
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
          className="absolute top-4 right-4 z-50 flex items-center justify-center hover:scale-110 transition-transform"
        >
          <span className="text-yellow-400 text-3xl font-bold" style={{ textShadow: '0 0 10px rgba(250, 182, 23, 0.5)' }}>×</span>
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

                <div className="max-w-7xl mx-auto px-4 py-[15px]">
                  <h1 className="text-5xl font-bold font-orbitron tracking-wider text-center mb-1">
                    <span className="text-yellow-400">ESSENCE</span>{" "}
                    <span className="text-gray-400">DISTRIBUTION</span>
                  </h1>
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

                <div className="max-w-7xl mx-auto px-4 py-2">
                  <div className="flex items-center justify-between gap-8">
                    {/* Stats Section */}
                    <div className="flex items-center gap-2">
                      {/* Total Essence */}
                      <div className="relative group">
                        <div className="relative bg-gradient-to-br from-yellow-900/20 to-black/60 border border-yellow-500/40 px-[18px] py-[5px]">
                          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/0 to-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="text-[7.5px] text-gray-500 uppercase tracking-[0.2em] font-medium mb-[2px] text-center">ESSENCE</div>
                          <div className="relative text-center">
                            <div className="text-[22.5px] font-bold font-mono text-yellow-400 tracking-tight leading-none" style={{
                              textShadow: '0 0 20px rgba(250, 182, 23, 0.5), 0 0 40px rgba(250, 182, 23, 0.3)'
                            }}>
                              {roundDownToTenth(totalStats.totalAmount)}
                            </div>
                          </div>
                        </div>
                        <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-yellow-400/60" />
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-yellow-400/60" />
                      </div>

                      <div className="h-10 w-px bg-gradient-to-b from-transparent via-yellow-500/30 to-transparent" />

                      {/* Total Value */}
                      <div className="relative group">
                        <div className="relative bg-gradient-to-br from-green-900/20 to-black/60 border border-green-500/40 px-[18px] py-[5px]">
                          <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="text-[7.5px] text-gray-500 uppercase tracking-[0.2em] font-medium mb-[2px] text-center">APPROX. VALUE</div>
                          <div className="relative text-center">
                            <div className="text-[22.5px] font-bold font-mono text-green-400 tracking-tight inline-flex items-baseline leading-none" style={{
                              textShadow: '0 0 20px rgba(74, 222, 128, 0.5), 0 0 40px rgba(74, 222, 128, 0.3)'
                            }}>
                              {Math.round(totalStats.totalValue).toLocaleString()}
                              <span className="text-[14px] ml-1 text-green-400/80">g</span>
                            </div>
                          </div>
                        </div>
                        <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-green-400/60" />
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-green-400/60" />
                      </div>

                      <div className="h-10 w-px bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent" />

                      {/* Types */}
                      <div className="relative group">
                        <div className="relative bg-gradient-to-br from-cyan-900/20 to-black/60 border border-cyan-500/40 px-[18px] py-[5px]">
                          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="text-[7.5px] text-gray-500 uppercase tracking-[0.2em] font-medium mb-[2px] text-center">TYPES</div>
                          <div className="relative text-center">
                            <div className="text-[22.5px] font-bold font-mono text-cyan-400 tracking-tight leading-none" style={{
                              textShadow: '0 0 20px rgba(34, 211, 238, 0.5), 0 0 40px rgba(34, 211, 238, 0.3)'
                            }}>
                              {totalStats.uniqueTypes}
                            </div>
                          </div>
                        </div>
                        <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-cyan-400/60" />
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-cyan-400/60" />
                      </div>

                      <div className="h-10 w-px bg-gradient-to-b from-transparent via-blue-500/30 to-transparent" />

                      {/* Essence Per Day */}
                      <div className="relative group">
                        <div className="relative bg-gradient-to-br from-blue-900/20 to-black/60 border border-blue-500/40 px-[18px] py-[5px]">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="text-[7.5px] text-gray-500 uppercase tracking-[0.2em] font-medium mb-[2px] text-center">ESSENCE/DAY</div>
                          <div className="relative text-center">
                            <div className="text-[22.5px] font-bold font-mono text-blue-400 tracking-tight leading-none" style={{
                              textShadow: '0 0 20px rgba(96, 165, 250, 0.5), 0 0 40px rgba(96, 165, 250, 0.3)'
                            }}>
                              {totalStats.totalPerDay.toFixed(1)}
                            </div>
                          </div>
                        </div>
                        <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-blue-400/60" />
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-blue-400/60" />
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
                                      <div className="text-yellow-400 font-bold">{roundDownToTenth(essence.amount)}</div>
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

                          {/* View Toggle Button */}
                          {displayedEssences.length > 0 && (
                            <button
                              onClick={() => setViewMode('table')}
                              className="mt-6 mek-button-primary px-8 py-3 text-sm font-bold uppercase tracking-wider"
                            >
                              Table View
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          {/* Table View */}
                          <div className="w-full max-w-5xl">
                            {/* Mobile Data Column Selector */}
                            <div className="md:hidden mb-4 flex justify-center">
                              <div className="relative inline-block">
                                <select
                                  value={mobileDataColumn}
                                  onChange={(e) => setMobileDataColumn(e.target.value as typeof mobileDataColumn)}
                                  className="bg-black/80 border-2 border-yellow-500/50 text-yellow-400 px-4 py-2 pr-10 rounded appearance-none cursor-pointer uppercase text-xs font-bold tracking-wider"
                                >
                                  <option value="amount">Amount Owned</option>
                                  <option value="growth">Growth Rate</option>
                                  <option value="maxCap">Max Cap</option>
                                  <option value="totalValue">Total Value</option>
                                </select>
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                  <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>
                            </div>

                            {/* Amber Vintage Terminal - Locked Style */}
                            <div className="relative bg-black/90 border-2 border-amber-500/50 overflow-hidden" style={{
                              boxShadow: '0 0 20px rgba(245, 158, 11, 0.3), inset 0 0 40px rgba(245, 158, 11, 0.05)'
                            }}>
                              {/* Scan line effect */}
                              <div className="absolute inset-0 pointer-events-none opacity-20" style={{
                                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(245, 158, 11, 0.1) 2px, rgba(245, 158, 11, 0.1) 4px)'
                              }} />

                              {/* Terminal Header */}
                              <div className="hidden md:grid md:grid-cols-5 bg-black/95 border-b-2 border-amber-500/50 px-4 py-3 font-mono text-[11px] text-amber-400 uppercase tracking-widest">
                                <button
                                  onClick={() => handleSort('name')}
                                  className="text-left hover:text-amber-300 transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  NAME
                                  {sortColumn === 'name' && (
                                    <span className="text-[8px]">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleSort('growth')}
                                  className="text-center hover:text-amber-300 transition-colors cursor-pointer flex items-center justify-center gap-1"
                                >
                                  GROWTH/d
                                  {sortColumn === 'growth' && (
                                    <span className="text-[8px]">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleSort('maxCap')}
                                  className="text-center hover:text-amber-300 transition-colors cursor-pointer flex items-center justify-center gap-1"
                                >
                                  MAX CAP
                                  {sortColumn === 'maxCap' && (
                                    <span className="text-[8px]">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleSort('totalValue')}
                                  className="text-center hover:text-amber-300 transition-colors cursor-pointer flex items-center justify-center gap-1"
                                >
                                  APPROX. VALUE
                                  {sortColumn === 'totalValue' && (
                                    <span className="text-[8px]">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleSort('amount')}
                                  className="text-center hover:text-amber-300 transition-colors cursor-pointer flex items-center justify-center gap-1"
                                >
                                  OWNED
                                  {sortColumn === 'amount' && (
                                    <span className="text-[8px]">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                                  )}
                                </button>
                              </div>

                              {/* Mobile Header */}
                              <div className="md:hidden grid grid-cols-2 bg-black/95 border-b-2 border-amber-500/50 px-4 py-3 font-mono text-[11px] text-amber-400 uppercase tracking-widest">
                                <div>NAME</div>
                                <div className="text-center">
                                  {mobileDataColumn === 'amount' && 'OWNED'}
                                  {mobileDataColumn === 'growth' && 'GROWTH/d'}
                                  {mobileDataColumn === 'maxCap' && 'MAX CAP'}
                                  {mobileDataColumn === 'totalValue' && 'APPROX. VALUE'}
                                </div>
                              </div>

                              {/* Terminal Body */}
                              <div className="max-h-[500px] overflow-y-auto font-mono text-[13px] custom-scrollbar">
                                {sortedEssences.map((essence, index) => {
                                  const baseRate = essence.baseRate || 0; // Don't default to 0.1, keep 0 for non-generating
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
                                      className={`relative hidden md:grid md:grid-cols-5 items-center px-4 py-3 border-b ${
                                        selectedSlice === essence.id
                                          ? 'border-amber-400 bg-amber-400/20'
                                          : hoveredSlice === essence.id
                                          ? 'border-amber-400/40 bg-amber-400/15'
                                          : 'border-amber-400/20'
                                      } hover:bg-amber-400/10 transition-all cursor-pointer`}
                                    >
                                      {/* Full height amber bar */}
                                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400/30" />

                                      <div className="text-white font-semibold">{essence.name.toUpperCase()}</div>

                                      {/* Growth Rate Column */}
                                      <div className={`text-center tabular-nums ${
                                        totalRate === 0
                                          ? 'text-gray-500'
                                          : hasGrowthBuff
                                          ? 'text-green-400 font-bold'
                                          : 'text-cyan-400'
                                      }`}
                                      style={hasGrowthBuff ? {
                                        textShadow: '0 0 10px rgba(34, 197, 94, 0.6)'
                                      } : isGenerating ? {
                                        textShadow: '0 0 8px rgba(34, 211, 238, 0.5)'
                                      } : undefined}
                                      >
                                        {totalRate === 0 ? '—' : totalRate.toFixed(2)}
                                      </div>

                                      {/* Max Cap Column */}
                                      <div className={`text-center tabular-nums ${
                                        hasCapBuff
                                          ? 'text-green-400 font-bold'
                                          : 'text-amber-300'
                                      }`}
                                      style={hasCapBuff ? {
                                        textShadow: '0 0 10px rgba(34, 197, 94, 0.6)'
                                      } : undefined}
                                      >
                                        {effectiveMax}
                                      </div>

                                      <div className="text-center text-yellow-300 tabular-nums">
                                        {Math.round(totalValue).toLocaleString()}g
                                      </div>
                                      <div className="text-center text-yellow-400 font-bold tabular-nums">
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
                            className="mt-6 mek-button-primary px-8 py-3 text-sm font-bold uppercase tracking-wider"
                          >
                            Donut View
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details Panel */}
                <div className="lg:col-span-1">
                  <div className="sticky top-24 relative" style={{ transform: 'scale(0.85)', transformOrigin: 'top center' }}>
                    {(hoveredSlice || selectedSlice) ? (() => {
                      const activeSlice = hoveredSlice || selectedSlice;
                      const slice = essenceData.find(e => e.id === activeSlice);
                      if (!slice) return null;

                      const sliceIndex = essenceData.indexOf(slice);
                      const effectiveMax = slice.maxAmountBuffed || slice.maxAmount || 10;
                      const isFull = slice.amount >= effectiveMax;
                      const baseRate = slice.baseRate || 0; // Don't default to 0.1, keep 0 for non-generating
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
                                  {roundDownToTenth(slice.amount)}
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
                      <div className="mek-card-industrial mek-border-sharp-gold p-4 relative">
                        {/* Placeholder content with opacity */}
                        <div className="opacity-40">
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
                        </div>

                        {/* "Hover Chart for Details" Message - Centered inside placeholder */}
                        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ zIndex: 20 }}>
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/80 border border-yellow-500/40 rounded-lg">
                            <svg className="w-4 h-4 text-yellow-400/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                            </svg>
                            <span className="text-sm text-gray-300 font-medium whitespace-nowrap">Hover chart for details</span>
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

  if (!isOpen || !mounted) return null;

  return createPortal(modalContent, document.body);
}
